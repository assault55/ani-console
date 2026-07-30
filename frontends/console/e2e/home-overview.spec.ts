import { expect, test } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('首页概览', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/')
    await expect(page.getByTestId('home-overview-page')).toBeVisible()
  })

  test('按设计稿展示三段布局和跨行任务中心', async ({ page }) => {
    await expect(page.getByText('实例总数')).toBeVisible()
    await expect(page.getByText('console001')).toBeVisible()
    await expect(page.getByText('TOP5云主机CPU负载')).toBeVisible()

    const dimensions = await page.evaluate(() => {
      const rect = (testId: string) => document.querySelector(`[data-testid="${testId}"]`)?.getBoundingClientRect()
      return {
        top: rect('home-top-row')?.height,
        middle: rect('home-middle-row')?.height,
        bottom: rect('home-bottom-grid')?.height,
        tasks: rect('tasks-panel')?.height,
      }
    })

    expect(dimensions).toEqual({ top: 320, middle: 320, bottom: 656, tasks: 656 })
  })

  test('支持趋势周期、告警等级和任务状态切换', async ({ page }) => {
    const primaryTrend = page.getByTestId('trend-card-primary')
    await primaryTrend.getByRole('button', { name: '1 天' }).click()
    await expect(primaryTrend.getByRole('button', { name: '1 天' })).toHaveAttribute('aria-pressed', 'true')
    await expect(primaryTrend.getByText('今日')).toBeVisible()

    const alerts = page.getByTestId('alerts-panel')
    await alerts.getByRole('tab', { name: '警告 1' }).click()
    await expect(alerts.getByText('主存储可用容量 > 1 MB')).toBeVisible()
    await expect(alerts.getByText('主存储可用物理容量百分比 < 1%')).toHaveCount(0)

    const tasks = page.getByTestId('tasks-panel')
    await tasks.getByRole('tab', { name: '当前任务 2' }).click()
    await expect(tasks.getByText('部署推理 bert-base')).toBeVisible()
    await expect(tasks.getByText('物理机修改物理规格配置')).toBeVisible()
    await expect(tasks.getByText('创建云主机 demo-vm-01')).toHaveCount(0)
  })

  test('快捷创建可以进入现有云主机创建页', async ({ page }) => {
    await page.getByRole('button', { name: '快捷创建' }).click()
    await page.getByRole('link', { name: '创建云主机' }).click()
    await expect(page).toHaveURL(/\/instances\/vm\/create$/)
  })
})
