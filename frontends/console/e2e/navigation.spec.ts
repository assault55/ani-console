import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('顶栏与侧栏导航', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '概览' })).toBeVisible({ timeout: 15000 })
  })

  test('可进入 VM 实例列表', async ({ page }) => {
    await page.getByText('算力与实例', { exact: true }).click()
    await page.getByRole('link', { name: 'VM 实例' }).click()
    await expect(page).toHaveURL(/\/instances\/vm/)
    await expect(page.getByRole('heading', { name: 'VM 实例' })).toBeVisible()
    await expect(page.getByText('e2e-vm')).toBeVisible()
  })

  test('VM 实例详情保持 VM 实例菜单选中', async ({ page }) => {
    await page.route('**/api/v1/instances/inst-1/lifecycle', async (route) => {
      await route.fulfill({ status: 202, json: { task_id: 'task-delete-vm' } })
    })
    await page.getByText('算力与实例', { exact: true }).click()
    await page.getByRole('link', { name: 'VM 实例' }).click()
    await expect(page).toHaveURL(/\/instances\/vm/)
    await page.getByRole('link', { name: 'e2e-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/vm\/inst-1/)
    await expect(page.locator('[data-component="sidebar"] .arco-menu-selected').getByRole('link', { name: 'VM 实例' })).toBeVisible()
    await page.getByRole('button', { name: '删除' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page).toHaveURL(/\/instances\/vm$/)
  })

  test('容器实例详情保持容器实例菜单选中', async ({ page }) => {
    await page.route('**/api/v1/instances/inst-1/lifecycle', async (route) => {
      await route.fulfill({ status: 202, json: { task_id: 'task-delete-container' } })
    })
    await page.getByText('算力与实例', { exact: true }).click()
    await page.getByRole('link', { name: '容器实例', exact: true }).click()
    await expect(page).toHaveURL(/\/instances\/container/)
    await page.getByRole('link', { name: 'e2e-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/container\/inst-1/)
    await expect(page.locator('[data-component="sidebar"] .arco-menu-selected').getByRole('link', { name: '容器实例', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '删除' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page).toHaveURL(/\/instances\/container$/)
  })

  test('容器实例创建使用独立页面', async ({ page }) => {
    await page.getByText('算力与实例', { exact: true }).click()
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
      await page.getByText('算力与实例', { exact: true }).click()
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

  test('可进入可启动镜像列表', async ({ page }) => {
    await page.getByText('存储', { exact: true }).click()
    await page.getByRole('link', { name: '可启动镜像' }).click()
    await expect(page).toHaveURL(/\/images/)
    await expect(page.getByRole('heading', { name: '可启动镜像' })).toBeVisible()
    await expect(page.getByText('ubuntu-24.04.iso')).toBeVisible()
  })

  test('可进入网络管理 VPC', async ({ page }) => {
    await page.getByText('网络管理', { exact: true }).click()
    await page.getByRole('link', { name: 'VPC' }).click()
    await expect(page).toHaveURL(/\/networks\/vpcs/)
    await expect(page.getByRole('heading', { name: 'VPC' })).toBeVisible()
  })

  test('可进入 K8s 集群', async ({ page }) => {
    await page.getByText('集群', { exact: true }).click()
    await expect(page).toHaveURL(/\/k8s-clusters/)
    await expect(page.getByRole('heading', { name: 'K8s 集群' })).toBeVisible()
    await expect(page.getByText('dev-cluster')).toBeVisible()
  })

  test('可进入镜像 Registry', async ({ page }) => {
    await page.getByText('镜像 Registry', { exact: true }).click()
    await expect(page).toHaveURL(/\/registry/)
    await expect(page.getByRole('heading', { name: '镜像 Registry' })).toBeVisible()
  })

  test('可进入监控与告警', async ({ page }) => {
    await page.getByText('监控与告警', { exact: true }).click()
    await expect(page).toHaveURL(/\/observability/)
    await expect(page.getByRole('heading', { name: '监控与告警' })).toBeVisible()
  })

  test('可进入用量', async ({ page }) => {
    await page.getByText('用量', { exact: true }).click()
    await expect(page).toHaveURL(/\/usage/)
    await expect(page.getByRole('heading', { name: '用量' })).toBeVisible()
  })

  test('首页不渲染左侧栏', async ({ page }) => {
    await expect(page.locator('[data-component="sidebar"]')).toHaveCount(0)
  })

  test('其它一级菜单激活时仍渲染左侧栏', async ({ page }) => {
    await page.getByText('集群', { exact: true }).click()
    await expect(page).toHaveURL(/\/k8s-clusters/)
    await expect(page.locator('[data-component="sidebar"]')).toBeVisible()
  })

  test('侧栏可横向折叠并在悬浮时显示叶子名称和分组菜单', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/demo/a-1')

    const sidebar = page.locator('[data-component="sidebar"]')
    const content = page.locator('.arco-layout-content')
    const collapseButton = sidebar.getByRole('button', { name: '收起侧栏' })
    const expandedMetrics = await Promise.all([
      sidebar.evaluate((element) => element.getBoundingClientRect().width),
      content.evaluate((element) => element.getBoundingClientRect().left),
      collapseButton.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        iconSize: getComputedStyle(element.querySelector('.ali-icon')!).fontSize,
        iconClass: element.querySelector('.ali-icon')?.className,
      })),
    ])

    expect(expandedMetrics[0]).toBe(184)
    expect(expandedMetrics[2]).toEqual({
      height: 44,
      iconSize: '16px',
      iconClass: 'iconfont icon-collapse ali-icon',
    })

    await collapseButton.click()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')
    await expect(sidebar).toHaveCSS('width', '56px')

    const expandButton = sidebar.getByRole('button', { name: '展开侧栏' })
    const collapsedMetrics = await Promise.all([
      content.evaluate((element) => element.getBoundingClientRect().left),
      expandButton.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        iconSize: getComputedStyle(element.querySelector('.ali-icon')!).fontSize,
        iconClass: element.querySelector('.ali-icon')?.className,
      })),
      sidebar.locator('[data-menu-key="/demo/leaf"] .sidebar-menu-label-text').evaluate(
        (element) => getComputedStyle(element).display,
      ),
    ])

    expect(expandedMetrics[1] - collapsedMetrics[0]).toBe(128)
    expect(collapsedMetrics[1]).toEqual({
      height: 44,
      iconSize: '16px',
      iconClass: 'iconfont icon-spread ali-icon',
    })
    expect(collapsedMetrics[2]).toBe('none')

    const independentLeaf = sidebar.locator('[data-menu-key="/demo/leaf"]')
    await independentLeaf.hover()
    const leafTooltip = page.locator('.sidebar-menu-leaf-tooltip')
    await expect(leafTooltip).toBeVisible()
    await expect(leafTooltip.getByText('独立叶子页', { exact: true })).toBeVisible()

    const groupA = sidebar.locator('[data-menu-key="demo-group-a"]')
    await groupA.hover()
    const popup = page.locator('.sidebar-menu-popup-trigger .arco-dropdown-menu')
    await expect(popup).toBeVisible()
    const popupTitle = popup.locator('.sidebar-menu-popup-title')
    await expect(popupTitle).toHaveText('分组 A')
    await expect(popupTitle).toHaveCSS('font-size', '12px')
    await expect(popup.getByRole('link', { name: '页面 A-1' })).toBeVisible()

    await expandButton.click()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false')
    await expect(sidebar).toHaveCSS('width', '184px')
  })

  test('演示菜单：顶部菜单自动访问并展开第一个深层叶子', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.getByText('演示菜单', { exact: true }).click()
    await expect(page).toHaveURL(/\/demo\/a-1/)
    await expect(page.locator('[data-component="sidebar"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: '页面 A-1' })).toBeVisible()
    await expect(page.locator('[data-menu-key="demo-group-a"] > .arco-menu-inline-header')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('[data-menu-key="/demo/a-1"]')).toHaveClass(/arco-menu-selected/)
  })

  test('演示菜单：分组无选中态且同层级缩进和所有行高一致', async ({ page }) => {
    await page.goto('/demo/a-1')
    const sidebar = page.locator('[data-component="sidebar"]')
    const independentLeaf = sidebar.locator('[data-menu-key="/demo/leaf"]')
    const groupA = sidebar.locator('[data-menu-key="demo-group-a"] > .arco-menu-inline-header')
    const pageA1 = sidebar.locator('[data-menu-key="/demo/a-1"]')
    const groupB = sidebar.locator('[data-menu-key="demo-group-b"] > .arco-menu-inline-header')
    const theme = await page.locator('body').evaluate((element) => {
      const styles = getComputedStyle(element)
      const readRgbToken = (name: string) =>
        styles.getPropertyValue(name).split(',').map((value) => Math.round(Number(value.trim())))

      return {
        hover: readRgbToken('--arcoblue-5'),
        primary: readRgbToken('--arcoblue-6'),
        active: readRgbToken('--arcoblue-7'),
      }
    })
    const topNavColor = await page
      .locator('.topnav-menu .arco-menu-item.arco-menu-selected')
      .evaluate((element) => getComputedStyle(element).color)

    const metrics = await Promise.all(
      [groupA, pageA1, groupB].map((row) =>
        row.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          left: element.getBoundingClientRect().left,
          backgroundColor: getComputedStyle(element).backgroundColor,
          iconColor: element.querySelector('.sidebar-menu-label-icon > *')
            ? getComputedStyle(element.querySelector('.sidebar-menu-label-icon > *')!).color
            : null,
          suffixColor: element.querySelector('.arco-menu-icon-suffix')
            ? getComputedStyle(element.querySelector('.arco-menu-icon-suffix')!).color
            : null,
          color: getComputedStyle(element).color,
          fontWeight: getComputedStyle(element).fontWeight,
        })),
      ),
    )
    const alignmentOffsets = await Promise.all(
      [independentLeaf, groupA].map((row) =>
        row.evaluate((element) => {
          const rowRect = element.getBoundingClientRect()
          const rowCenter = rowRect.top + rowRect.height / 2
          const centerOffset = (target: Element | null) => {
            if (!target) return null
            const rect = target.getBoundingClientRect()
            return Math.round((rect.top + rect.height / 2 - rowCenter) * 1000) / 1000
          }

          return {
            icon: centerOffset(element.querySelector('.sidebar-menu-label-icon > *')),
            label: centerOffset(element.querySelector('.sidebar-menu-label > span:last-child')),
            suffix: centerOffset(element.querySelector('.arco-menu-icon-suffix')),
          }
        }),
      ),
    )
    expect(metrics.map(({ height }) => height)).toEqual([44, 44, 44])
    expect(alignmentOffsets).toEqual([
      { icon: 0, label: 0, suffix: null },
      { icon: 0, label: 0, suffix: 0 },
    ])
    const iconFont = await independentLeaf.locator('.ali-icon').evaluate((element) => ({
      family: getComputedStyle(element).fontFamily,
      content: getComputedStyle(element, '::before').content,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }))
    expect(iconFont.family).toContain('iconfont')
    expect(iconFont.content).not.toBe('none')
    expect(iconFont.width).toBeGreaterThan(0)
    expect(iconFont.height).toBeGreaterThan(0)
    expect(theme).toEqual({ hover: [7, 149, 255], primary: [0, 121, 211], active: [0, 92, 160] })
    expect(topNavColor).toBe('rgb(0, 121, 211)')
    expect(metrics[1].left).toBe(metrics[2].left)
    expect(metrics[0].backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(metrics[0].fontWeight).toBe('400')
    expect(metrics[0].iconColor).toBe('rgb(134, 144, 156)')
    expect(metrics[0].suffixColor).toBe('rgb(134, 144, 156)')
    expect(metrics[1].backgroundColor).toBe('rgba(0, 121, 211, 0.08)')
    expect(metrics[1].color).toBe('rgb(0, 121, 211)')
    expect(metrics[1].fontWeight).toBe('700')
    expect(metrics[2].backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(metrics[2].fontWeight).toBe('400')
  })

  test('演示菜单：嵌套分组与同级叶子使用相同缩进', async ({ page }) => {
    await page.goto('/demo/b-i-1')
    const sidebar = page.locator('[data-component="sidebar"]')
    const rows = [
      { row: sidebar.locator('[data-menu-key="/demo/a-1"]'), kind: 'leaf' },
      { row: sidebar.locator('[data-menu-key="demo-group-b"] > .arco-menu-inline-header'), kind: 'group' },
      { row: sidebar.locator('[data-menu-key="/demo/b-1"]'), kind: 'leaf' },
      { row: sidebar.locator('[data-menu-key="demo-group-b-i"] > .arco-menu-inline-header'), kind: 'group' },
      { row: sidebar.locator('[data-menu-key="/demo/b-i-1"]'), kind: 'leaf' },
    ] as const

    const positions = await Promise.all(
      rows.map(({ row, kind }) =>
        row.evaluate((element, rowKind) => {
          const content = rowKind === 'leaf'
            ? element.querySelector(':scope > a, :scope > .arco-menu-item-inner > a')
            : Array.from(element.children).find((child) =>
                (child.textContent ?? '').trim()
                && !child.classList.contains('arco-menu-icon-suffix')
              )
          if (!content) throw new Error('Menu row content not found')

          const rowRect = element.getBoundingClientRect()
          const contentRect = content.getBoundingClientRect()
          return {
            left: contentRect.left,
            centerOffset: contentRect.top + contentRect.height / 2
              - (rowRect.top + rowRect.height / 2),
          }
        }, kind),
      ),
    )

    expect(positions.map(({ centerOffset }) => centerOffset)).toEqual([0, 0, 0, 0, 0])
    expect(positions[1].left).toBe(positions[0].left)
    expect(positions[3].left).toBe(positions[2].left)
    expect(positions[4].left - positions[3].left).toBe(20)
  })

  test('演示菜单：深层叶子在各级分组展开后可进入', async ({ page }) => {
    await page.goto('/demo/a-1')

    // 当前叶子的祖先分组 A 已自动展开
    // 展开分组 B
    await page.locator('[data-component="sidebar"]').getByText('分组 B', { exact: true }).click()
    // 展开子分组 B-i
    await page.locator('[data-component="sidebar"]').getByText('子分组 B-i', { exact: true }).click()
    await page.locator('[data-component="sidebar"]').getByRole('link', { name: '页面 B-i-2' }).click()
    await expect(page).toHaveURL(/\/demo\/b-i-2/)
    await expect(page.getByRole('heading', { name: '页面 B-i-2' })).toBeVisible()
  })

  test('演示菜单：再次点击分组标题收起子项', async ({ page }) => {
    await page.goto('/demo/a-1')
    const sidebar = page.locator('[data-component="sidebar"]')
    await expect(sidebar.getByRole('link', { name: '页面 A-1' })).toBeVisible()
    // 点击已自动展开的分组标题将其收起
    await sidebar.getByText('分组 A', { exact: true }).click()
    await expect(sidebar.getByRole('link', { name: '页面 A-1' })).toHaveCount(0)
  })
})
