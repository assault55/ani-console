import { expect, test } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('容器实例独立列表', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('使用 container 过滤接口并保留现有详情和创建路由', async ({ page }) => {
    const instanceRequests: string[] = []
    await page.route('**/api/v1/instances?**', async (route) => {
      const url = new URL(route.request().url())
      instanceRequests.push(url.search)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'container-1',
              tenant_id: 'tenant-1',
              name: 'api-service',
              kind: 'container',
              state: 'running',
              provider: 'kubernetes_rest',
              termination_protection: false,
              vpc_id: 'vpc-1',
              subnet_id: 'subnet-1',
              private_ip: '10.0.1.10',
              image: 'demo/app:v1.0.0',
              cpu: '2C',
              memory: '4G',
              node_name: 'worker-a',
              endpoint: 'http://container-1.example:8080',
              container: { replicas: 2, ready_replicas: 2, rollout_status: 'healthy' },
              created_at: '2026-07-28T08:00:00Z',
              updated_at: '2026-07-28T08:00:00Z',
            },
          ],
          total: 1,
        }),
      })
    })

    await page.goto('/instances/container')

    await expect(page.getByRole('heading', { name: '容器实例' })).toBeVisible()
    await expect.poll(() => instanceRequests.some((search) => new URLSearchParams(search).get('kind') === 'container')).toBe(true)
    for (const column of ['名称', '类型', 'VPC', '子网', 'IP', '状态', '镜像', 'CPU / 内存', '副本', '发布', '节点', '访问地址', '创建时间']) {
      await expect(page.getByRole('columnheader', { name: column })).toHaveCount(1)
    }
    await expect(page.getByRole('link', { name: 'api-service' })).toHaveAttribute(
      'href',
      '/instances/container/container-1',
    )

    await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
    const toolbarStart = page.getByRole('button', { name: '启动' }).first()
    const toolbarStop = page.getByRole('button', { name: '停止' }).first()
    const toolbarMore = page.getByRole('button', { name: '更多' }).first()
    await expect(toolbarStart).toBeDisabled()
    await expect(toolbarStop).toBeDisabled()
    await expect(toolbarMore).toBeDisabled()

    const instanceRow = page.getByRole('row', { name: /api-service/ })
    await instanceRow.getByRole('checkbox').check()
    await expect(toolbarStop).toBeEnabled()
    await expect(toolbarMore).toBeEnabled()

    await instanceRow.hover()
    await expect(instanceRow.getByRole('button', { name: '停止' })).toBeVisible()
    await expect(instanceRow.getByRole('button', { name: '重启' })).toBeVisible()
    await instanceRow.getByRole('button', { name: '更多' }).click()
    await expect(page.getByText('详情', { exact: true })).toBeVisible()
    await expect(page.getByText('扩缩容', { exact: true })).toBeVisible()
    await expect(page.getByText('终端', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: '创建容器实例' }).click()
    await expect(page).toHaveURL(/\/instances\/container\/create$/)
  })
})
