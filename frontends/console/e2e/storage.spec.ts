import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('存储详情', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/volumes')
  })

  test('块存储卷详情与快照列表', async ({ page }) => {
    await page.getByRole('link', { name: 'data-vol' }).click()
    await expect(page).toHaveURL(/\/volumes\/vol-1/)
    await expect(page.getByRole('heading', { name: 'data-vol' })).toBeVisible()
    await expect(page.getByText('块存储卷详情')).toBeVisible()
    await expect(page.getByText('快照', { exact: true })).toBeVisible()
    await expect(page.getByText('snap-a')).toBeVisible()
    await expect(page.getByRole('button', { name: '创建快照' })).toBeVisible()
  })

  test('文件系统详情与挂载目标', async ({ page }) => {
    // 已在 /volumes，存储一级菜单激活，侧栏直接显示子项；点「文件存储」叶子跳转
    await page.getByRole('link', { name: '文件存储' }).click()
    await page.getByRole('link', { name: 'shared-fs' }).click()
    await expect(page).toHaveURL(/\/filesystems\/fs-1/)
    await expect(page.getByRole('heading', { name: 'shared-fs' })).toBeVisible()
    await expect(page.getByText('挂载目标')).toBeVisible()
    await expect(page.getByText('vpc-1')).toBeVisible()
  })

  test('对象存储桶与对象列表', async ({ page }) => {
    await page.getByRole('link', { name: '对象存储' }).click()
    await expect(page).toHaveURL(/\/objects/)
    await expect(page.getByRole('heading', { name: '对象存储' })).toBeVisible()
    await page.getByRole('link', { name: 'e2e-bucket' }).click()
    await expect(page).toHaveURL(/\/objects\/bucket-1/)
    await expect(page.getByRole('heading', { name: 'e2e-bucket' })).toBeVisible()
    await expect(page.getByText('存储桶详情')).toBeVisible()
    await page.getByRole('button', { name: 'readme.txt' }).click()
    await expect(page).toHaveURL(/\/objects\/bucket-1\/obj-1/)
    await expect(page.getByRole('heading', { name: 'readme.txt' })).toBeVisible()
    await expect(page.getByText('对象详情')).toBeVisible()
  })
})
