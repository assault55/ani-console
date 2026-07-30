import { expect, test, type Page } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

async function expectFixedShell(page: Page) {
  const shell = page.locator('[data-component="app-shell"]')
  const topnav = page.locator('[data-component="topnav"]')
  const scrollRegion = page.locator('[data-component="page-scroll-region"]')

  await expect(shell).toBeVisible()
  await expect(scrollRegion).toBeVisible()

  const before = await topnav.boundingBox()
  expect(before?.y).toBe(0)

  await scrollRegion.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })

  const state = await page.evaluate(() => {
    const documentScroller = document.scrollingElement
    const region = document.querySelector<HTMLElement>('[data-component="page-scroll-region"]')
    return {
      windowScrollY: window.scrollY,
      documentClientHeight: documentScroller?.clientHeight,
      documentScrollHeight: documentScroller?.scrollHeight,
      regionClientHeight: region?.clientHeight,
      regionScrollHeight: region?.scrollHeight,
      regionScrollTop: region?.scrollTop,
    }
  })

  const after = await topnav.boundingBox()
  expect(after?.y).toBe(0)
  expect(state.windowScrollY).toBe(0)
  expect(state.documentScrollHeight).toBe(state.documentClientHeight)
  expect(state.regionScrollHeight).toBeGreaterThan(state.regionClientHeight ?? 0)
  expect(state.regionScrollTop).toBeGreaterThan(0)
}

async function expectFixedSidebar(page: Page) {
  const sidebar = page.locator('[data-component="sidebar"]')
  const menuRegion = page.locator('[data-component="sidebar-scroll-region"]')
  const collapseButton = sidebar.getByRole('button', { name: '收起侧栏' })
  const viewportHeight = page.viewportSize()?.height ?? 0

  const sidebarBox = await sidebar.boundingBox()
  const collapseBox = await collapseButton.boundingBox()
  expect(sidebarBox?.y).toBe(56)
  expect(sidebarBox?.height).toBe(viewportHeight - 56)
  expect(collapseBox?.y).toBe(viewportHeight - 44)

  const overflowY = await menuRegion.evaluate((element) => getComputedStyle(element).overflowY)
  expect(overflowY).toBe('auto')
}

test.describe('应用壳层滚动区域', () => {
  test.use({ viewport: { width: 1440, height: 600 } })

  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('首页只滚动内容，顶部菜单保持固定', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-overview-page')).toBeVisible()
    await expectFixedShell(page)
  })

  test('创建表单页的顶部和侧栏固定，右侧内容独立滚动', async ({ page }) => {
    await page.goto('/instances/container/create')
    await expect(page.getByRole('heading', { name: '创建容器实例' })).toBeVisible()
    await expectFixedShell(page)
    await expectFixedSidebar(page)
  })

  test('普通表格页的顶部和侧栏固定，右侧内容独立滚动', async ({ page }) => {
    await page.goto('/instances/vm')
    await expect(page.getByRole('heading', { name: '云主机 VM' })).toBeVisible()
    await expectFixedShell(page)
    await expectFixedSidebar(page)
  })

  test('侧栏菜单超出可用高度时只滚动菜单列表', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 320 })
    await page.goto('/instances/vm')
    await expect(page.getByRole('heading', { name: '云主机 VM' })).toBeVisible()

    const menuRegion = page.locator('[data-component="sidebar-scroll-region"]')
    const collapseButton = page.getByRole('button', { name: '收起侧栏' })
    const before = await collapseButton.boundingBox()

    const menuState = await menuRegion.evaluate((element) => {
      element.scrollTop = element.scrollHeight
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      }
    })

    const after = await collapseButton.boundingBox()
    expect(menuState.scrollHeight).toBeGreaterThan(menuState.clientHeight)
    expect(menuState.scrollTop).toBeGreaterThan(0)
    expect(after?.y).toBe(before?.y)
    expect(after?.y).toBe(276)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
})
