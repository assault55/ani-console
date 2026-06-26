import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('侧栏导航', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '概览' })).toBeVisible({ timeout: 15000 })
  })

  test('可进入实例列表', async ({ page }) => {
    await page.getByText('算力与实例').click()
    await page.getByRole('link', { name: '实例' }).click()
    await expect(page).toHaveURL(/\/instances/)
    await expect(page.getByRole('heading', { name: '实例' })).toBeVisible()
    await expect(page.getByText('e2e-vm')).toBeVisible()
  })

  test('可进入块存储列表', async ({ page }) => {
    await page.getByText('存储与网络').click()
    await page.getByRole('link', { name: '块存储' }).click()
    await expect(page).toHaveURL(/\/volumes/)
    await expect(page.getByRole('heading', { name: '块存储卷' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'data-vol' })).toBeVisible()
  })

  test('可进入 K8s 集群', async ({ page }) => {
    await page.getByRole('link', { name: 'K8s 集群' }).first().click()
    await expect(page).toHaveURL(/\/k8s-clusters/)
    await expect(page.getByRole('heading', { name: 'K8s 集群' })).toBeVisible()
    await expect(page.getByText('dev-cluster')).toBeVisible()
  })
})
