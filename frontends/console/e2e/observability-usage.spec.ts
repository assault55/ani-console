import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('监控与用量', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('告警规则、用量、操作详情可展示', async ({ page }) => {
    await page.goto('/observability')
    await expect(page.getByRole('heading', { name: '监控与告警' })).toBeVisible()
    await page.getByText('告警规则', { exact: true }).click()
    await expect(page.getByText('cpu-high')).toBeVisible()

    await page.goto('/usage')
    await expect(page.getByRole('heading', { name: '用量' })).toBeVisible()
    await expect(page.getByText('总用量')).toBeVisible()

    await page.goto('/instance-operations/op-1')
    await expect(page.getByRole('heading', { name: '操作 op-1' })).toBeVisible()
    await expect(page.getByText('admission_check')).toBeVisible()
  })
})
