import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('向量存储', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/vector-stores')
  })

  test('列表可打开详情 Drawer 并检索', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '向量存储' })).toBeVisible()
    await page.getByRole('button', { name: 'embeddings' }).click()
    await expect(page.getByText('向量库详情 · embeddings')).toBeVisible()
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByText('doc-1')).toBeVisible()
    await expect(page.getByText('0.95')).toBeVisible()
  })
})
