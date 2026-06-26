import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('安全与密钥', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('加密密钥与 Secret 详情', async ({ page }) => {
    await page.goto('/encryption')
    await expect(page.getByRole('heading', { name: '加密密钥' })).toBeVisible()
    await expect(page.getByText('main-key')).toBeVisible()

    await page.goto('/secrets')
    await page.getByRole('link', { name: 'app-secret' }).click()
    await expect(page).toHaveURL(/\/secrets\/sec-1/)
    await expect(page.getByRole('heading', { name: 'app-secret' })).toBeVisible()
  })
})
