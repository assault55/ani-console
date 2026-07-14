import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'

async function seedAuthStorageOnce(page: Page) {
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.setItem(
      'ani-console-auth',
      JSON.stringify({
        state: {
          tokens: {
            access_token: 'e2e-access-token',
            refresh_token: 'e2e-refresh-token',
            expires_in: 3600,
            token_type: 'Bearer',
          },
        },
        version: 0,
      }),
    )
  })
}

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

  test('接口返回 401 且刷新失败时自动跳转登录页', async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuthStorageOnce(page)
    await page.route('**/api/v1/branding', async (route) => {
      await route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED', message: 'token expired' } })
    })
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED', message: 'refresh expired' } })
    })

    await page.goto('/instances/sandbox')

    await expect(page).toHaveURL(/\/login\?redirect=%2Finstances%2Fsandbox/)
    await expect(page.getByText('登录 ANI Console')).toBeVisible()
  })
})
