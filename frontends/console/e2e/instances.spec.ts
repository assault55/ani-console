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
    await expect(page.getByText('vpc-1')).toBeVisible()
    await expect(page.getByText('subnet-1')).toBeVisible()
    await expect(page.getByText('10.0.1.10')).toBeVisible()
    await page.getByRole('link', { name: 'e2e-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/inst-1/)
    await expect(page.getByRole('heading', { name: 'e2e-vm' })).toBeVisible()
    await expect(page.getByRole('button', { name: '控制台' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '终端' })).toBeVisible()
    await expect(page.getByText('subnet-1')).toBeVisible()
    await expect(page.getByText('10.0.1.10')).toBeVisible()
    await page.getByRole('tab', { name: '日志' }).click()
    await expect(page.getByText('container ready')).toBeVisible()
    await expect(page.getByText('stdout')).toBeVisible()
  })

  test('创建实例时提交所选 VPC 子网和固定 IP', async ({ page }) => {
    let createBody: Record<string, unknown> | undefined
    await page.route('**/api/v1/instances', async (route, request) => {
      if (request.method() !== 'POST') {
        await route.fallback()
        return
      }
      createBody = request.postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        headers: { Location: '/api/v1/tasks/task-network-instance' },
        json: { instance: { id: 'inst-2', name: 'web-a', state: 'pending' } },
      })
    })

    await page.goto('/instances')
    await page.getByRole('button', { name: '创建实例' }).click()
    await page.locator('.arco-modal input').first().fill('web-a')
    await page.getByTestId('instance-vpc-select').click()
    await page.getByRole('option', { name: 'prod-vpc' }).click()
    await page.getByTestId('instance-subnet-select').click()
    await page.getByRole('option', { name: 'app-subnet' }).click()
    const privateIpInputs = page.getByTestId('instance-private-ip-input').getByRole('spinbutton')
    await privateIpInputs.nth(0).fill('10')
    await privateIpInputs.nth(1).fill('0')
    await privateIpInputs.nth(2).fill('1')
    await privateIpInputs.nth(3).fill('10')
    await page.getByRole('dialog').getByRole('button', { name: '创建实例' }).click()

    expect(createBody?.network).toEqual({
      vpc_id: 'vpc-1',
      subnet_id: 'subnet-1',
      private_ip: '10.0.1.10',
    })
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
