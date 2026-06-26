import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('占位页面', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('裸金属/通知/审计页面展示占位说明', async ({ page }) => {
    await page.goto('/bare-metal')
    await expect(page.getByRole('heading', { name: '裸金属' })).toBeVisible()
    await expect(page.getByText('API 契约尚未定义对应接口，页面已预留路由骨架')).toBeVisible()

    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible()

    await page.goto('/audit')
    await expect(page.getByRole('heading', { name: '审计' })).toBeVisible()
  })
})
