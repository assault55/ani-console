import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('镜像 Registry', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
    await page.goto('/registry')
  })

  test('三级导航：项目 → 仓库 → 制品', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '镜像 Registry' })).toBeVisible()
    await page.getByRole('button', { name: 'ani' }).click()
    await expect(page.getByText('仓库 · ani')).toBeVisible()
    await expect(page.getByText('项目扫描报告')).toBeVisible()
    await page.getByRole('button', { name: 'web' }).click()
    await expect(page.getByText('制品 · web')).toBeVisible()
    await expect(page.getByText('sha256:e2eabc')).toBeVisible()
    await expect(page.getByRole('button', { name: '设置权限' })).toBeVisible()
  })

  test('Pull Secret Kubernetes Apply：选择模式、填写 namespace 并展示结果', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '镜像 Registry' })).toBeVisible()
    await page.getByRole('button', { name: 'ani' }).click()
    await page.getByRole('button', { name: 'web' }).click()
    await expect(page.getByText('制品 · web')).toBeVisible()

    await page.getByRole('button', { name: 'Pull Secret' }).click()
    const pullSecretDialog = page.getByRole('dialog', { name: '创建 Pull Secret' })
    await expect(pullSecretDialog).toBeVisible()

    await pullSecretDialog.getByText('创建并应用到 Kubernetes Namespace').click()
    await pullSecretDialog.getByPlaceholder('例如 default').fill('e2e-ns')
    await pullSecretDialog.getByRole('button', { name: '确定' }).click()

    await expect(pullSecretDialog).toBeHidden()

    const resultDialog = page.getByRole('dialog', { name: 'Pull Secret 已应用到 Kubernetes' })
    await expect(resultDialog).toBeVisible()
    await expect(resultDialog.getByText('e2e-ns')).toBeVisible()
    await expect(resultDialog.getByText('kubernetes.io/dockerconfigjson')).toBeVisible()
    await resultDialog.getByRole('button', { name: '关闭' }).click()
    await expect(resultDialog).toBeHidden()
  })
})
