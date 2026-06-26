import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('镜像 Registry', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/registry')
  })

  test('三级导航：项目 → 仓库 → 制品', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '镜像 Registry' })).toBeVisible()
    await page.getByRole('button', { name: 'ani' }).click()
    await expect(page.getByText('仓库 · ani')).toBeVisible()
    await expect(page.getByText('项目扫描报告')).toBeVisible()
    await page.getByRole('button', { name: 'web' }).click()
    await expect(page.getByText('制品 · web')).toBeVisible()
    await expect(page.getByText('sha256:e2eabc')).toBeVisible()
    await expect(page.getByRole('button', { name: '设置权限' })).toBeVisible()
  })
})
