import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('概览 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('展示核心指标与最近实例', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '概览' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('GPU 总量')).toBeVisible()
    await expect(page.getByText('8', { exact: true })).toBeVisible()
    await expect(page.getByText('最近实例')).toBeVisible()
    await expect(page.getByText('e2e-vm')).toBeVisible()
    await expect(page.getByText('最近操作')).toBeVisible()
  })
})
