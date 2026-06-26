import type { Page } from '@playwright/test'

const AUTH_STORAGE_KEY = 'ani-console-auth'

/** 在页面加载前注入 zustand persist 登录态，避免 E2E 依赖真实 OIDC。 */
export async function seedAuth(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
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
  }, AUTH_STORAGE_KEY)
}
