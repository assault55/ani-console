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

  test('可进入 VM 实例列表', async ({ page }) => {
    await page.getByText('算力与实例').click()
    await page.getByRole('link', { name: 'VM 实例' }).click()
    await expect(page).toHaveURL(/\/instances\/vm/)
    await expect(page.getByRole('heading', { name: 'VM 实例' })).toBeVisible()
    await expect(page.getByText('e2e-vm')).toBeVisible()
  })

  test('VM 实例详情保持 VM 实例菜单选中', async ({ page }) => {
    await page.route('**/api/v1/instances/inst-1/lifecycle', async (route) => {
      await route.fulfill({ status: 202, json: { task_id: 'task-delete-vm' } })
    })
    await page.getByText('算力与实例').click()
    await page.getByRole('link', { name: 'VM 实例' }).click()
    await expect(page).toHaveURL(/\/instances\/vm/)
    await page.getByRole('link', { name: 'e2e-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/vm\/inst-1/)
    await expect(page.locator('.arco-menu-selected').getByRole('link', { name: 'VM 实例' })).toBeVisible()
    await page.getByRole('button', { name: '删除' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page).toHaveURL(/\/instances\/vm$/)
  })

  test('容器实例详情保持容器实例菜单选中', async ({ page }) => {
    await page.route('**/api/v1/instances/inst-1/lifecycle', async (route) => {
      await route.fulfill({ status: 202, json: { task_id: 'task-delete-container' } })
    })
    await page.getByText('算力与实例').click()
    await page.getByRole('link', { name: '容器实例', exact: true }).click()
    await expect(page).toHaveURL(/\/instances\/container/)
    await page.getByRole('link', { name: 'e2e-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/container\/inst-1/)
    await expect(page.locator('.arco-menu-selected').getByRole('link', { name: '容器实例', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '删除' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page).toHaveURL(/\/instances\/container$/)
  })

  test('容器实例创建使用独立页面', async ({ page }) => {
    await page.getByText('算力与实例').click()
    await page.getByRole('link', { name: '容器实例', exact: true }).click()
    await expect(page).toHaveURL(/\/instances\/container/)
    await page.getByRole('button', { name: '创建实例' }).click()
    await expect(page).toHaveURL(/\/instances\/container\/create/)
    await expect(page.getByRole('heading', { name: '创建容器实例' })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('类型化实例创建均使用独立页面', async ({ page }) => {
    const cases = [
      { link: 'VM 实例', url: /\/instances\/vm\/create/, heading: '创建 VM 实例' },
      { link: 'GPU 容器实例', url: /\/instances\/gpu\/create/, heading: '创建 GPU 容器实例' },
      { link: 'Sandbox 实例', url: /\/instances\/sandbox\/create/, heading: '创建 Sandbox 实例' },
    ]

    for (const item of cases) {
      await page.goto('/')
      await page.getByText('算力与实例').click()
      await page.getByRole('link', { name: item.link }).click()
      await page.getByRole('button', { name: '创建实例' }).click()
      await expect(page).toHaveURL(item.url)
      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
  })

  test('可进入块存储列表', async ({ page }) => {
    await page.getByText('存储', { exact: true }).click()
    await page.getByRole('link', { name: '块存储' }).click()
    await expect(page).toHaveURL(/\/volumes/)
    await expect(page.getByRole('heading', { name: '块存储卷' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'data-vol' })).toBeVisible()
  })

  test('可进入网络管理 VPC', async ({ page }) => {
    await page.getByText('网络管理', { exact: true }).click()
    await page.getByRole('link', { name: 'VPC' }).click()
    await expect(page).toHaveURL(/\/networks\/vpcs/)
    await expect(page.getByRole('heading', { name: 'VPC' })).toBeVisible()
  })

  test('可进入 K8s 集群', async ({ page }) => {
    await page.getByRole('link', { name: 'K8s 集群' }).first().click()
    await expect(page).toHaveURL(/\/k8s-clusters/)
    await expect(page.getByRole('heading', { name: 'K8s 集群' })).toBeVisible()
    await expect(page.getByText('dev-cluster')).toBeVisible()
  })
})
