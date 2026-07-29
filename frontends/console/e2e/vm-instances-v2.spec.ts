import { expect, test } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('云主机 VM 新列表页', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/instances/vm')
    await expect(page.getByRole('heading', { name: '云主机 VM' })).toBeVisible()
  })

  test('展示列表并保持约定的区域高度', async ({ page }) => {
    const table = page.getByRole('table', { name: '云主机 VM 列表' })
    await expect(table.locator('tbody tr')).toHaveCount(6)
    await expect(page.getByText('demo-resource-01')).toBeVisible()

    const heights = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h1')).find((item) => item.textContent === '云主机 VM')
      const header = heading?.closest('header')
      const tabs = document.querySelector('[role="tablist"]')
      const headerRow = document.querySelector('table[aria-label="云主机 VM 列表"] thead tr')
      const firstRow = document.querySelector('table[aria-label="云主机 VM 列表"] tbody tr')
      return [header, tabs, headerRow, firstRow].map((element) => element?.getBoundingClientRect().height)
    })

    expect(heights).toEqual([80, 56, 40, 56])
  })

  test('支持状态筛选和名称搜索', async ({ page }) => {
    const tableRows = page.getByRole('table', { name: '云主机 VM 列表' }).locator('tbody tr')

    await page.getByRole('tab', { name: '已停止 2' }).click()
    await expect(tableRows).toHaveCount(2)
    await expect(page.getByText('demo-resource-03')).toBeVisible()

    await page.getByRole('tab', { name: '全部 6' }).click()
    await page.getByLabel('搜索内容').fill('demo-resource-04')
    await expect(tableRows).toHaveCount(1)
    await expect(page.getByText('demo-resource-04')).toBeVisible()
  })

  test('勾选实例后可执行停止并更新状态数量', async ({ page }) => {
    await page.getByLabel('选择数据 vm_2krt5t').check()
    const stopButton = page.getByRole('button', { name: '停止', exact: true }).first()
    await expect(stopButton).toBeEnabled()
    await stopButton.click()

    await expect(page.getByText('停止操作已提交')).toBeVisible()
    await expect(page.getByRole('tab', { name: '运行中 2' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '已停止 3' })).toBeVisible()
    await expect(page.getByLabel('选择数据 vm_2krt5t')).not.toBeChecked()
  })

  test('隐藏数据列后仍保留行操作', async ({ page }) => {
    await page.getByRole('button', { name: '列设置' }).click()
    const settings = page.getByLabel('列设置')
    await settings.getByText('创建时间').click()
    await expect(page.getByRole('columnheader', { name: /创建时间/ })).toHaveCount(0)

    const firstRow = page.getByRole('table', { name: '云主机 VM 列表' }).locator('tbody tr').first()
    await firstRow.hover()
    await expect(firstRow.getByRole('button', { name: '停止', exact: true })).toBeVisible()
    await expect(firstRow.getByRole('button', { name: /更多/ })).toBeVisible()
  })

  test('创建按钮进入现有创建页', async ({ page }) => {
    await page.getByRole('button', { name: '创建云主机' }).click()
    await expect(page).toHaveURL(/\/instances\/vm\/create$/)
  })
})
