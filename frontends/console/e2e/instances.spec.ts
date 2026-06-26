import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('实例与算力', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('实例列表可进入详情', async ({ page }) => {
    await page.goto('/instances')
    await expect(page.getByRole('heading', { name: '实例' })).toBeVisible()
    await page.getByRole('link', { name: 'e2e-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/inst-1/)
    await expect(page.getByRole('heading', { name: 'e2e-vm' })).toBeVisible()
    await expect(page.getByRole('button', { name: '控制台' })).toBeVisible()
  })

  test('GPU 清单页展示指标', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '概览' })).toBeVisible({ timeout: 15000 })
    await page.getByText('算力与实例').click()
    await page.getByRole('link', { name: 'GPU 清单' }).click()
    await expect(page).toHaveURL(/\/gpu-inventory/)
    await expect(page.getByRole('heading', { name: 'GPU 清单' })).toBeVisible()
    await expect(page.getByText('GPU 总量')).toBeVisible()
  })
})
