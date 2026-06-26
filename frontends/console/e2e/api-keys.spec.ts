import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('API Key 管理', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('列表可见并可创建新密钥', async ({ page }) => {
    await page.goto('/settings/api-keys')
    await expect(page.getByRole('heading', { name: 'API Key' })).toBeVisible()
    await expect(page.getByText('ci-bot')).toBeVisible()

    await page.getByRole('button', { name: '创建 API Key' }).click()
    await page.getByPlaceholder('例如 ci-deploy').fill('deploy-bot')
    await page.getByRole('button', { name: '确定' }).click()

    const saveDialog = page.getByRole('dialog', { name: '请保存密钥' })
    await expect(saveDialog).toBeVisible()
    await expect(saveDialog.locator('textarea')).toHaveValue('ani_sk_e2e_secret')
  })
})
