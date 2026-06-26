import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('Sandbox 模板', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('列表展示模板数据', async ({ page }) => {
    await page.goto('/sandbox-templates')
    await expect(page.getByRole('heading', { name: 'Sandbox 模板' })).toBeVisible()
    await expect(page.getByText('python-3.11')).toBeVisible()
    await expect(page.getByText('python', { exact: true })).toBeVisible()
  })
})
