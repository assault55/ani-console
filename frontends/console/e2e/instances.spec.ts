import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('实例与算力', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('实例列表可进入详情', async ({ page }) => {
    await page.goto('/instances')
    await expect(page.getByRole('heading', { name: '实例' })).toBeVisible()
    await expect(page.getByText('vpc-1')).toBeVisible()
    await expect(page.getByText('subnet-1')).toBeVisible()
    await expect(page.getByText('10.0.1.10')).toBeVisible()
    await page.getByRole('link', { name: 'e2e-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/inst-1/)
    await expect(page.getByRole('heading', { name: 'e2e-vm' })).toBeVisible()
    await expect(page.getByRole('button', { name: '控制台' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '终端' })).toBeVisible()
    await expect(page.getByText('subnet-1')).toBeVisible()
    await expect(page.getByText('10.0.1.10')).toBeVisible()
    await page.getByRole('tab', { name: '日志' }).click()
    await expect(page.getByText('container ready')).toBeVisible()
    await expect(page.getByText('stdout')).toBeVisible()
    const popupPromise = page.waitForEvent('popup')
    await page.getByRole('button', { name: '终端' }).click()
    const popup = await popupPromise
    await expect(popup).toHaveURL(/\/instances\/terminal\/inst-1/)
    await popup.close()
  })

  test('容器实例终端新页面连接 exec WebSocket', async ({ page }) => {
    let execBody: Record<string, unknown> | undefined
    let execAuthorization: string | null = null
    await page.addInitScript(() => {
      const state = window as typeof window & {
        __terminalWsUrls?: string[]
        __terminalWsSent?: string[]
        __terminalWsClosed?: number
        __windowOpenCalled?: boolean
        __emitTerminalWsMessage?: (data: string | ArrayBuffer | Blob) => void
      }
      state.__terminalWsUrls = []
      state.__terminalWsSent = []
      state.__terminalWsClosed = 0
      state.__windowOpenCalled = false
      window.open = () => {
        state.__windowOpenCalled = true
        return null
      }

      class MockWebSocket extends EventTarget {
        static CONNECTING = 0
        static OPEN = 1
        static CLOSING = 2
        static CLOSED = 3
        CONNECTING = 0
        OPEN = 1
        CLOSING = 2
        CLOSED = 3
        binaryType: BinaryType = 'blob'
        bufferedAmount = 0
        extensions = ''
        protocol = ''
        readyState = MockWebSocket.CONNECTING
        onopen: ((event: Event) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null
        onerror: ((event: Event) => void) | null = null
        onclose: ((event: CloseEvent) => void) | null = null
        url: string

        constructor(url: string | URL) {
          super()
          this.url = String(url)
          state.__terminalWsUrls?.push(this.url)
          state.__emitTerminalWsMessage = (data) => this.emitMessage(data)
          window.setTimeout(() => {
            this.readyState = MockWebSocket.OPEN
            const openEvent = new Event('open')
            this.onopen?.(openEvent)
            this.dispatchEvent(openEvent)
            this.emitMessage('connected\n')
          }, 0)
        }

        send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
          const payload = String(data)
          state.__terminalWsSent?.push(payload)
          try {
            const parsed = JSON.parse(payload) as { Op?: string; Data?: string }
            if (parsed.Op === 'stdin') {
              this.emitMessage(JSON.stringify({ Data: `echo:${parsed.Data ?? ''}` }))
            }
          } catch {
            this.emitMessage(`echo:${payload}`)
          }
        }

        close() {
          this.readyState = MockWebSocket.CLOSED
          state.__terminalWsClosed = (state.__terminalWsClosed ?? 0) + 1
          const closeEvent = new CloseEvent('close')
          this.onclose?.(closeEvent)
          this.dispatchEvent(closeEvent)
        }

        private emitMessage(data: string | ArrayBuffer | Blob) {
          const message = new MessageEvent('message', { data })
          this.onmessage?.(message)
          this.dispatchEvent(message)
        }
      }

      window.WebSocket = MockWebSocket as unknown as typeof WebSocket
    })
    await page.route('**/api/v1/instances/*/exec', async (route, request) => {
      execBody = request.postDataJSON() as Record<string, unknown>
      execAuthorization = request.headers().authorization ?? null
      await route.fulfill({
        status: 200,
        json: {
          id: 'exec-1',
          instance_id: 'inst-1',
          ws_url:
            'wss://terminal.example/kapis/clusters/host/terminal.kubercloud.com/v1alpha2/namespaces/default/pods/pod-1/exec?container=main&shell=sh&token=short-ticket',
          token: 'short-ticket',
          expires_at: '2026-06-01T08:10:00Z',
          dev_profile: { real_provider: false, profile: 'CORE-DEV-PROFILE-A' },
        },
      })
    })

    await page.goto('/instances/terminal/inst-1')

    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page.getByTestId('instance-terminal-output')).toContainText('connected')
    expect(execAuthorization).toBe('Bearer e2e-access-token')
    expect(execBody?.container).toBeNull()
    expect(execBody?.command).toEqual(['/bin/sh'])
    expect(execBody?.tty).toBe(true)
    expect(typeof execBody?.rows).toBe('number')
    expect(typeof execBody?.cols).toBe('number')
    await expect
      .poll(() => page.evaluate(() => window.__terminalWsUrls?.filter((url) => url.includes('terminal.example'))))
      .toHaveLength(1)
    await expect
      .poll(() => page.evaluate(() => window.__terminalWsUrls?.find((url) => url.includes('terminal.example'))))
      .toContain(
        'wss://terminal.example/kapis/clusters/host/terminal.kubercloud.com/v1alpha2/namespaces/default/pods/pod-1/exec?container=main&shell=sh&token=short-ticket',
      )
    await expect.poll(() => page.evaluate(() => window.__windowOpenCalled)).toBe(false)

    await page.getByTestId('instance-terminal-output').click()
    await page.keyboard.type('a')
    await expect(page.getByTestId('instance-terminal-output')).toContainText('echo:a')
    await expect.poll(() => page.evaluate(() => window.__terminalWsSent)).toContain(JSON.stringify({ Op: 'stdin', Data: 'a' }))

    await expect
      .poll(() => page.evaluate(() => window.__terminalWsSent?.some((item) => item.includes('"Op":"resize"'))))
      .toBe(true)

    await page.evaluate(() => {
      window.__emitTerminalWsMessage?.(JSON.stringify({ Data: 'json-output\n' }))
      window.__emitTerminalWsMessage?.(new TextEncoder().encode('binary-output\n').buffer)
      window.__emitTerminalWsMessage?.(new Blob(['blob-output\n']))
    })
    await expect(page.getByTestId('instance-terminal-output')).toContainText('json-output')
    await expect(page.getByTestId('instance-terminal-output')).toContainText('binary-output')
    await expect(page.getByTestId('instance-terminal-output')).toContainText('blob-output')
  })

  test('VM 实例控制台打开独立 VNC 页面', async ({ page }) => {
    let consoleBody: Record<string, unknown> | undefined
    await page.addInitScript(() => {
      const state = window as typeof window & {
        __openedUrls?: string[]
      }
      state.__openedUrls = []
      window.open = (url?: string | URL) => {
        if (url) state.__openedUrls?.push(String(url))
        return null
      }
    })
    await page.route('**/api/v1/instances/inst-vm-1', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'inst-vm-1',
          name: 'e2e-vm-console',
          state: 'running',
          kind: 'vm',
          vpc_id: 'vpc-1',
          subnet_id: 'subnet-1',
          private_ip: '10.0.1.20',
          termination_protection: false,
          created_at: '2026-06-01T08:00:00Z',
          updated_at: '2026-06-01T08:00:00Z',
        },
      })
    })
    await page.route('**/api/v1/instances/inst-vm-1/console', async (route, request) => {
      consoleBody = request.postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 200,
        json: {
          session_id: 'vnc-session-1',
          protocol: 'novnc',
          connect_url: 'ws://vnc.example/instances/inst-vm-1/console/vnc-session-1?token=short-ticket',
          url: 'ws://vnc.example/instances/inst-vm-1/console/vnc-session-1?token=short-ticket',
          expires_at: '2099-06-01T08:10:00Z',
        },
      })
    })

    await page.goto('/instances/inst-vm-1')
    await expect(page.getByRole('heading', { name: 'e2e-vm-console' })).toBeVisible()
    await page.getByRole('button', { name: '控制台' }).click()
    await expect.poll(() => page.evaluate(() => window.__openedUrls)).toEqual(['/instances/console/inst-vm-1'])

    await page.goto('/instances/console/inst-vm-1')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page.getByTestId('instance-vnc-console')).toBeVisible()
    await expect.poll(() => consoleBody?.protocol).toBe('novnc')
  })

  test('VM 和容器实例详情按运行状态禁用启动停止按钮', async ({ page }) => {
    await page.goto('/instances/container/inst-1')
    await expect(page.getByRole('heading', { name: 'e2e-vm' })).toBeVisible()
    await expect(page.getByRole('button', { name: '启动' })).toBeDisabled()
    await expect(page.getByRole('button', { name: '停止' })).toBeEnabled()

    await page.route('**/api/v1/instances/inst-container-stopped', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'inst-container-stopped',
          name: 'stopped-container',
          state: 'stopped',
          kind: 'container',
          termination_protection: false,
          created_at: '2026-06-01T08:00:00Z',
          updated_at: '2026-06-01T08:00:00Z',
        },
      })
    })
    await page.goto('/instances/container/inst-container-stopped')
    await expect(page.getByRole('heading', { name: 'stopped-container' })).toBeVisible()
    await expect(page.getByRole('button', { name: '启动' })).toBeEnabled()
    await expect(page.getByRole('button', { name: '停止' })).toBeDisabled()

    await page.route('**/api/v1/instances/inst-vm-running', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'inst-vm-running',
          name: 'running-vm',
          state: 'running',
          kind: 'vm',
          termination_protection: false,
          created_at: '2026-06-01T08:00:00Z',
          updated_at: '2026-06-01T08:00:00Z',
        },
      })
    })
    await page.goto('/instances/vm/inst-vm-running')
    await expect(page.getByRole('heading', { name: 'running-vm' })).toBeVisible()
    await expect(page.getByRole('button', { name: '启动' })).toBeDisabled()
    await expect(page.getByRole('button', { name: '停止' })).toBeEnabled()

    await page.route('**/api/v1/instances/inst-vm-stopped', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'inst-vm-stopped',
          name: 'stopped-vm',
          state: 'stopped',
          kind: 'vm',
          termination_protection: false,
          created_at: '2026-06-01T08:00:00Z',
          updated_at: '2026-06-01T08:00:00Z',
        },
      })
    })
    await page.goto('/instances/vm/inst-vm-stopped')
    await expect(page.getByRole('heading', { name: 'stopped-vm' })).toBeVisible()
    await expect(page.getByRole('button', { name: '启动' })).toBeEnabled()
    await expect(page.getByRole('button', { name: '停止' })).toBeDisabled()
  })

  test('创建实例时提交所选 VPC 子网和固定 IP', async ({ page }) => {
    let createBody: Record<string, unknown> | undefined
    await page.route('**/api/v1/instances', async (route, request) => {
      if (request.method() !== 'POST') {
        await route.fallback()
        return
      }
      createBody = request.postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        headers: { Location: '/api/v1/tasks/task-network-instance' },
        json: { instance: { id: 'inst-2', name: 'web-a', state: 'pending' } },
      })
    })

    await page.goto('/instances')
    await page.getByRole('button', { name: '创建实例' }).click()
    await page.getByTestId('instance-name-input').fill('web-a')
    await page.getByRole('dialog').getByText('VPC 网络').click()
    await page.getByTestId('instance-vpc-select').click()
    await page.getByRole('option', { name: 'prod-vpc' }).click()
    await page.getByTestId('instance-subnet-select').click()
    await page.getByRole('option', { name: 'app-subnet' }).click()
    await page.getByRole('dialog').getByText('手动指定').click()
    const privateIpInputs = page.getByTestId('instance-private-ip-input').getByRole('spinbutton')
    await privateIpInputs.nth(3).fill('10')
    await page.getByRole('dialog').getByRole('button', { name: '创建实例' }).click()

    expect(createBody?.network).toEqual({
      vpc_id: 'vpc-1',
      subnet_id: 'subnet-1',
      private_ip: '10.0.1.10',
    })
  })

  test('创建容器实例支持默认网络、VPC 自动 IP 和手动 IP', async ({ page }) => {
    const createBodies: Record<string, unknown>[] = []
    await page.route('**/api/v1/instances', async (route, request) => {
      if (request.method() !== 'POST') {
        await route.fallback()
        return
      }
      createBodies.push(request.postDataJSON() as Record<string, unknown>)
      await route.fulfill({
        status: 201,
        headers: { Location: '/api/v1/tasks/task-network-instance' },
        json: { instance: { id: `inst-${createBodies.length + 1}`, name: 'web-a', state: 'pending' } },
      })
    })

    await page.goto('/instances/container/create')
    await page.getByTestId('instance-name-input').fill('default-net')
    await page.getByRole('button', { name: '创建实例' }).click()
    expect(createBodies[0]?.network).toBeUndefined()

    await page.goto('/instances/container/create')
    await page.getByTestId('instance-name-input').fill('auto-vpc')
    await page.getByText('VPC 网络').click()
    await page.getByTestId('instance-vpc-select').click()
    await page.getByRole('option', { name: 'prod-vpc' }).click()
    await page.getByTestId('instance-subnet-select').click()
    await page.getByRole('option', { name: 'app-subnet' }).click()
    await page.getByText('自动分配').click()
    await page.getByRole('button', { name: '创建实例' }).click()
    expect(createBodies[1]?.network).toEqual({
      vpc_id: 'vpc-1',
      subnet_id: 'subnet-1',
    })

    await page.goto('/instances/container/create')
    await page.getByTestId('instance-name-input').fill('manual-vpc')
    await page.getByText('VPC 网络').click()
    await page.getByTestId('instance-vpc-select').click()
    await page.getByRole('option', { name: 'prod-vpc' }).click()
    await page.getByTestId('instance-subnet-select').click()
    await page.getByRole('option', { name: 'app-subnet' }).click()
    await page.getByText('手动指定').click()
    const privateIpInputs = page.getByTestId('instance-private-ip-input').getByRole('spinbutton')
    await expect(privateIpInputs.nth(0)).toHaveValue('10')
    await expect(privateIpInputs.nth(1)).toHaveValue('0')
    await expect(privateIpInputs.nth(2)).toHaveValue('1')
    await privateIpInputs.nth(3).fill('20')
    await page.getByRole('button', { name: '创建实例' }).click()
    expect(createBodies[2]?.network).toEqual({
      vpc_id: 'vpc-1',
      subnet_id: 'subnet-1',
      private_ip: '10.0.1.20',
    })
  })

  test('创建 VM 实例可选择 Ready ISO 作为启动介质', async ({ page }) => {
    let createBody: Record<string, unknown> | undefined
    await page.route('**/api/v1/instances', async (route, request) => {
      if (request.method() !== 'POST') {
        await route.fallback()
        return
      }
      createBody = request.postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        headers: { Location: '/api/v1/tasks/task-vm-iso' },
        json: { instance: { id: 'inst-iso', name: 'vm-from-iso', state: 'pending' } },
      })
    })

    await page.goto('/instances/vm/create')
    await page.getByTestId('instance-name-input').fill('vm-from-iso')
    await page.getByText('ISO 安装').click()
    await page.getByTestId('instance-iso-image-select').click()
    await page.getByRole('option', { name: 'ubuntu-24.04.iso' }).click()
    await page.getByTestId('instance-root-disk-size-input').fill('40')
    await page.getByRole('button', { name: '创建实例' }).click()

    expect(createBody?.boot_image).toBeNull()
    expect(createBody?.boot_media).toEqual({ type: 'iso', image_id: 'img-ubuntu-iso', boot_order: 1 })
    expect(createBody?.root_disk_size_gib).toBe(40)
  })

  test('Sandbox 列表按 kind=sandbox 查询并创建真实 Kubernetes/Kata Sandbox', async ({ page }) => {
    let listKind: string | null = null
    let postAttempts = 0
    const createBodies: Record<string, unknown>[] = []

    await page.route('**/api/v1/instances**', async (route, request) => {
      const url = new URL(request.url())
      if (request.method() === 'GET') {
        listKind = url.searchParams.get('kind')
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 'inst-sandbox-existing',
                tenant_id: 'tenant-1',
                name: 'existing-sandbox',
                kind: 'sandbox',
                state: 'running',
                provider: 'kubernetes_rest',
                dev_profile: { mode: 'real', provider: 'kubernetes_rest', real_provider: true },
                sandbox: {
                  runtime_class: 'sandbox-kata',
                  session_state: 'running',
                  session_timeout: '30m',
                  network_egress_policy: 'deny_all',
                },
                resource_refs: ['pod/default/existing-sandbox'],
                termination_protection: false,
                created_at: '2026-06-01T08:00:00Z',
                updated_at: '2026-06-01T08:00:00Z',
              },
            ],
            total: 1,
          },
        })
        return
      }
      if (request.method() === 'POST') {
        postAttempts += 1
        createBodies.push(request.postDataJSON() as Record<string, unknown>)
        if (postAttempts === 1) {
          await route.fulfill({ status: 503, json: { code: 'UPSTREAM_UNAVAILABLE', message: 'provider unavailable' } })
          return
        }
        await route.fulfill({
          status: 201,
          json: {
            instance: {
              id: 'inst-sandbox-1',
              tenant_id: 'tenant-1',
              name: 'agent-sandbox-001',
              kind: 'sandbox',
              state: 'running',
              provider: 'kubernetes_rest',
              dev_profile: { mode: 'real', provider: 'kubernetes_rest', real_provider: true },
              sandbox: {
                runtime_class: 'sandbox-kata',
                session_state: 'running',
                session_timeout: '1h',
                network_egress_policy: 'internet',
              },
              resource_refs: ['pod/default/agent-sandbox-001', 'runtimeclass/sandbox-kata'],
              termination_protection: false,
              created_at: '2026-06-01T08:00:00Z',
              updated_at: '2026-06-01T08:00:00Z',
            },
            operation_id: 'op-sandbox-create',
          },
        })
        return
      }
      await route.fallback()
    })

    await page.route('**/api/v1/instances/inst-sandbox-1', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'inst-sandbox-1',
          tenant_id: 'tenant-1',
          name: 'agent-sandbox-001',
          kind: 'sandbox',
          state: 'running',
          provider: 'kubernetes_rest',
          dev_profile: { mode: 'real', provider: 'kubernetes_rest', real_provider: true },
          sandbox: {
            runtime_class: 'sandbox-kata',
            session_state: 'running',
            session_timeout: '1h',
            network_egress_policy: 'internet',
          },
          resource_refs: ['pod/default/agent-sandbox-001', 'runtimeclass/sandbox-kata'],
          termination_protection: false,
          created_at: '2026-06-01T08:00:00Z',
          updated_at: '2026-06-01T08:00:00Z',
        },
      })
    })

    await page.goto('/instances/sandbox')
    await expect(page.getByRole('heading', { name: 'Sandbox 实例' })).toBeVisible()
    expect(listKind).toBe('sandbox')

    await page.getByRole('button', { name: '创建实例' }).click()
    await page.getByTestId('instance-name-input').fill('agent-sandbox-001')
    await page.getByTestId('sandbox-session-timeout-select').click()
    await page.getByRole('option', { name: '1h' }).click()
    await page.getByTestId('sandbox-egress-policy-select').click()
    await page.getByRole('option', { name: 'internet' }).click()
    await page.getByRole('button', { name: '创建实例' }).click()
    await expect(page.getByText('创建失败，请检查配置后重试')).toBeVisible()
    await page.getByRole('button', { name: '创建实例' }).click()

    expect(createBodies[0]?.idempotency_key).toBe(createBodies[1]?.idempotency_key)
    expect(createBodies[1]).toMatchObject({
      kind: 'sandbox',
      image: 'docker.changqingyun.cn/mirror/busybox:latest',
      command: ['sh', '-c', 'uname -a; sleep 300'],
      sandbox_config: {
        runtime_class: 'sandbox-kata',
        session_timeout: '1h',
        network_egress_policy: 'internet',
      },
    })
    await expect(page).toHaveURL(/\/instances\/sandbox\/inst-sandbox-1/)
    await expect(page.getByRole('heading', { name: 'agent-sandbox-001' })).toBeVisible()
    await expect(page.getByText('真实 Kubernetes/Kata 后端')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'sandbox-kata', exact: true })).toBeVisible()
    await expect(page.getByText('runtimeclass/sandbox-kata')).toBeVisible()
  })

  test('Sandbox 详情不会把 local dev profile 标成真实运行', async ({ page }) => {
    await page.route('**/api/v1/instances/inst-sandbox-local', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'inst-sandbox-local',
          tenant_id: 'tenant-1',
          name: 'local-sandbox',
          kind: 'sandbox',
          state: 'running',
          provider: 'kubernetes_rest',
          dev_profile: { mode: 'local', provider: 'local', real_provider: false },
          sandbox: {
            runtime_class: 'sandbox-kata',
            session_state: 'running',
            session_timeout: '30m',
            network_egress_policy: 'deny_all',
          },
          resource_refs: [],
          termination_protection: false,
          created_at: '2026-06-01T08:00:00Z',
          updated_at: '2026-06-01T08:00:00Z',
        },
      })
    })

    await page.goto('/instances/sandbox/inst-sandbox-local')
    await expect(page.getByRole('heading', { name: 'local-sandbox' })).toBeVisible()
    await expect(page.getByText('本地开发模式')).toBeVisible()
    await expect(page.getByText('真实 Kubernetes/Kata 后端')).toHaveCount(0)
  })

  test('GPU 清单页展示指标', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '概览' })).toBeVisible({ timeout: 15000 })
    await page.getByText('算力与实例').click()
    await page.getByRole('link', { name: 'GPU 清单' }).click()
    await expect(page).toHaveURL(/\/gpu-inventory/)
    await expect(page.getByRole('heading', { name: 'GPU 清单' })).toBeVisible()
    await expect(page.getByText('GPU 总量')).toBeVisible()
  })
})
