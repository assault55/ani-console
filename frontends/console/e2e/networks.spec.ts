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
    await page.getByRole('button', { name: 'prod-vpc' }).click()
    await expect(page.getByText('VPC详情 · prod-vpc')).toBeVisible()
    await expect(page.getByText('10.0.0.0/16')).toBeVisible()
  })

  test('路由列表展示条目', async ({ page }) => {
    await page.goto('/networks/routes')
    await expect(page.getByRole('heading', { name: '路由' })).toBeVisible()
    await expect(page.getByText('0.0.0.0/0')).toBeVisible()
    await expect(page.getByText('igw-1')).toBeVisible()
  })
})
