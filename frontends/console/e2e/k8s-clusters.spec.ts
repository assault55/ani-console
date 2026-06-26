import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('K8s 集群', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/k8s-clusters')
  })

  test('列表可进入详情并展示节点池', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'K8s 集群' })).toBeVisible()
    await page.getByRole('button', { name: 'dev-cluster' }).click()
    await expect(page.getByRole('heading', { name: 'dev-cluster' })).toBeVisible()
    await expect(page.getByText('节点池', { exact: true })).toBeVisible()
    await expect(page.getByText('default-pool')).toBeVisible()
    await expect(page.getByRole('button', { name: '下载 Kubeconfig' })).toBeVisible()
  })
})
