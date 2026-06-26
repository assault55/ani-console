import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('认证与设置', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('设置页可进入 API Key 管理', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()
    await page.getByRole('button', { name: '管理 API Key' }).click()
    await expect(page).toHaveURL(/\/settings\/api-keys/)
    await expect(page.getByRole('heading', { name: 'API Key' })).toBeVisible()
    await expect(page.getByRole('button', { name: '创建 API Key' })).toBeVisible()
  })
})
