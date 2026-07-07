import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('网络资源', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('VPC 列表可打开详情 Drawer', async ({ page }) => {
    await page.goto('/networks/vpcs')
    await expect(page.getByRole('heading', { name: 'VPC' })).toBeVisible()
    await expect(page.getByText('网络管理', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'prod-vpc' }).click()
    await expect(page.getByText('VPC详情 · prod-vpc')).toBeVisible()
    await expect(page.locator('.arco-drawer').getByText('10.0.0.0/16')).toBeVisible()
  })

  test('路由列表展示条目', async ({ page }) => {
    await page.goto('/networks/routes')
    await expect(page.getByRole('heading', { name: '路由' })).toBeVisible()
    await expect(page.getByText('0.0.0.0/0')).toBeVisible()
    await expect(page.getByText('igw-1')).toBeVisible()
  })

  test('子网列表按 VPC 服务端筛选', async ({ page }) => {
    await page.goto('/networks/subnets')
    const filtered = page.waitForRequest((request) => {
      const url = new URL(request.url())
      return url.pathname.endsWith('/api/v1/networks/subnets') && url.searchParams.get('vpc_id') === 'vpc-1'
    })
    await page.getByRole('combobox', { name: '按 VPC 筛选' }).click()
    await page.getByRole('option', { name: 'prod-vpc' }).click()
    await filtered
  })

  test('路由可打开详情并删除', async ({ page }) => {
    await page.goto('/networks/routes')
    await page.getByRole('button', { name: 'route-1' }).click()
    await expect(page.getByText('路由详情 · route-1')).toBeVisible()
    await expect(page.getByText('default route')).toBeVisible()

    const deleted = page.waitForRequest((request) => {
      const url = new URL(request.url())
      return request.method() === 'DELETE' && url.pathname.endsWith('/api/v1/networks/routes/route-1')
    })
    await page.getByRole('button', { name: '删除路由' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await deleted
  })

  test('安全组详情可提交规则整包更新', async ({ page }) => {
    await page.goto('/networks/security-groups')
    await page.getByRole('button', { name: 'web-sg' }).click()
    await expect(page.getByText('安全组详情 · web-sg')).toBeVisible()
    await page.getByRole('button', { name: '编辑规则' }).click()
    await page.getByLabel('端口').fill('443')

    const patched = page.waitForRequest(async (request) => {
      const url = new URL(request.url())
      if (request.method() !== 'PATCH' || !url.pathname.endsWith('/api/v1/networks/security-groups/sg-1')) return false
      const body = request.postDataJSON() as { rules?: Array<{ port_range?: string }> }
      return body.rules?.[0]?.port_range === '443'
    })
    await page.getByRole('button', { name: '保存' }).click()
    await patched
  })

  test('创建安全组使用动态规则表单', async ({ page }) => {
    await page.goto('/networks/security-groups')
    await page.getByRole('button', { name: '创建' }).click()
    await page.getByLabel('名称').fill('api-sg')
    await page.getByRole('button', { name: '添加规则' }).click()
    await page.getByLabel('端口').fill('443')

    const created = page.waitForRequest(async (request) => {
      const url = new URL(request.url())
      if (request.method() !== 'POST' || !url.pathname.endsWith('/api/v1/networks/security-groups')) return false
      const body = request.postDataJSON() as { rules?: Array<{ port_range?: string }> }
      return body.rules?.[0]?.port_range === '443'
    })
    await page.getByRole('button', { name: '确定' }).click()
    await created
  })

  test('创建负载均衡使用动态监听器表单', async ({ page }) => {
    await page.goto('/networks/load-balancers')
    await page.getByRole('button', { name: '创建' }).click()
    await page.getByLabel('名称').fill('api-lb')
    await page.getByRole('combobox', { name: 'VPC' }).click()
    await page.getByRole('option', { name: 'prod-vpc' }).click()
    await page.getByRole('button', { name: '添加监听器' }).click()
    await page.getByRole('spinbutton', { name: '端口', exact: true }).fill('443')
    await page.getByRole('spinbutton', { name: '目标端口' }).fill('8443')

    const created = page.waitForRequest(async (request) => {
      const url = new URL(request.url())
      if (request.method() !== 'POST' || !url.pathname.endsWith('/api/v1/networks/load-balancers')) return false
      const body = request.postDataJSON() as { listeners?: Array<{ port?: number; target_port?: number }> }
      return body.listeners?.[0]?.port === 443 && body.listeners?.[0]?.target_port === 8443
    })
    await page.getByRole('button', { name: '确定' }).click()
    await created
  })
})
