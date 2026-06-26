import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'

test.describe('认证门禁', () => {
  test('未登录访问概览会重定向到登录页', async ({ page }) => {
    await installCoreApiMocks(page)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('登录 ANI Console')).toBeVisible()
  })

  test('登录页展示 OIDC 入口', async ({ page }) => {
    await installCoreApiMocks(page)
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'OIDC 登录' })).toBeVisible()
  })
})
