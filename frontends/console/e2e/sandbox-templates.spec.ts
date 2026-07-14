import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('Sandbox 模板', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('列表展示模板数据', async ({ page }) => {
    await page.goto('/sandbox-templates')
    await expect(page.getByRole('heading', { name: 'Sandbox 模板' })).toBeVisible()
    await expect(page.getByText('python-3.11')).toBeVisible()
    await expect(page.getByText('node-20')).toBeVisible()
    await expect(page.getByText('python', { exact: true })).toBeVisible()
  })

  test('使用内置模板预填 Sandbox 创建表单', async ({ page }) => {
    let createBody: Record<string, unknown> | undefined
    await page.route('**/api/v1/instances', async (route, request) => {
      if (request.method() !== 'POST') {
        await route.fallback()
        return
      }
      createBody = request.postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        json: { instance: { id: 'inst-template-1', name: 'sandbox-from-template', state: 'pending' } },
      })
    })

    await page.goto('/sandbox-templates')
    await page.getByRole('button', { name: '使用模板' }).first().click()

    await expect(page).toHaveURL(/\/instances\/sandbox\/create\?template_id=st-1/)
    await expect(page.getByText('已使用模板 python-3.11 预填镜像与资源规格。')).toBeVisible()
    await expect(page.getByTestId('instance-image-input')).toHaveValue('docker.changqingyun.cn/mirror/python:3.11-slim')

    await page.getByTestId('instance-name-input').fill('sandbox-from-template')
    await page.getByRole('button', { name: '创建实例' }).click()

    await expect.poll(() => createBody?.image).toBe('docker.changqingyun.cn/mirror/python:3.11-slim')
    expect(createBody?.cpu).toBe('2')
    expect(createBody?.memory).toBe('4Gi')
    expect(createBody?.kind).toBe('sandbox')
  })
})
