import { test, expect } from '@playwright/test'
import { seedAuth } from './support/auth'

test.describe('Mock Server 联调 smoke', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
  })

  test('实例列表可从 Mock Server 加载', async ({ page }) => {
    await page.goto('/instances')
    await expect(page.getByRole('heading', { name: '实例' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'mock-vm' })).toBeVisible()
  })

  test('实例详情可从 Mock Server 加载', async ({ page }) => {
    await page.goto('/instances')
    await page.getByRole('link', { name: 'mock-vm' }).click()
    await expect(page).toHaveURL(/\/instances\/inst-1/)
    await expect(page.getByRole('heading', { name: 'mock-vm' })).toBeVisible()
    await expect(page.getByText('实例详情 · container')).toBeVisible()
  })

  test('API Key 页面可读取并创建密钥', async ({ page }) => {
    await page.goto('/settings/api-keys')
    await expect(page.getByRole('heading', { name: 'API Key' })).toBeVisible()
    await expect(page.getByText('mock-ci')).toBeVisible()

    await page.getByRole('button', { name: '创建 API Key' }).click()
    await page.getByPlaceholder('例如 ci-deploy').fill('mock-deploy')
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page.getByRole('dialog', { name: '请保存密钥' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: '请保存密钥' }).locator('textarea')).toHaveValue('ani_sk_mock_server')
  })

  test('概览页可加载核心指标', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '概览' })).toBeVisible()
    await expect(page.getByText('GPU 总量')).toBeVisible()
    await expect(page.getByText('8', { exact: true })).toBeVisible()
  })

  test('网络 VPC 列表可打开详情 Drawer', async ({ page }) => {
    await page.goto('/networks/vpcs')
    await expect(page.getByRole('heading', { name: 'VPC' })).toBeVisible()
    await page.getByRole('button', { name: 'mock-vpc' }).click()
    await expect(page.getByText('VPC详情 · mock-vpc')).toBeVisible()
    await expect(page.getByText('10.0.0.0/16')).toBeVisible()
  })

  test('块存储详情可加载并展示快照', async ({ page }) => {
    await page.goto('/volumes')
    await expect(page.getByRole('heading', { name: '块存储卷' })).toBeVisible()
    await page.getByRole('link', { name: 'mock-vol' }).click()
    await expect(page).toHaveURL(/\/volumes\/vol-1/)
    await expect(page.getByRole('heading', { name: 'mock-vol' })).toBeVisible()
    await expect(page.getByText('mock-snap')).toBeVisible()
  })

  test('Registry 三级导航可加载并展示制品', async ({ page }) => {
    await page.goto('/registry')
    await expect(page.getByRole('heading', { name: '镜像 Registry' })).toBeVisible()
    await page.getByRole('button', { name: 'mock' }).click()
    await expect(page.getByText('仓库 · mock')).toBeVisible()
    await expect(page.getByText('项目扫描报告')).toBeVisible()
    await page.getByRole('button', { name: 'backend' }).click()
    await expect(page.getByText('制品 · backend')).toBeVisible()
    await expect(page.getByText('sha256:mockabc')).toBeVisible()
  })

  test('Registry 边缘动作：权限、Pull Secret、扫描查询', async ({ page }) => {
    await page.goto('/registry')
    await page.getByRole('button', { name: 'mock' }).click()
    await page.getByRole('button', { name: 'backend' }).click()

    await page.getByRole('button', { name: '设置权限' }).click()
    await expect(page.getByRole('dialog', { name: '仓库权限' })).toBeVisible()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page.getByRole('dialog', { name: '仓库权限' })).toBeHidden()

    await page.getByRole('button', { name: 'Pull Secret' }).click()
    await expect(page.getByRole('dialog', { name: '创建 Pull Secret' })).toBeVisible()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page.getByRole('dialog', { name: '创建 Pull Secret' })).toBeHidden()

    await page.getByPlaceholder('完整镜像引用').fill('mock/backend:v1.0.0')
    await page.getByRole('button', { name: '查询扫描结果' }).click()
    await expect(page.getByText('mock/backend:v1.0.0')).toBeVisible()
  })

  test('Registry 创建项目动作可提交', async ({ page }) => {
    await page.goto('/registry')
    await page.getByRole('button', { name: '创建项目' }).click()
    await expect(page.getByRole('dialog', { name: '创建项目' })).toBeVisible()
    await page.getByPlaceholder('项目名称').fill('mock-new-project')
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page.getByRole('dialog', { name: '创建项目' })).toBeHidden()
  })

  test('文件存储详情可加载并展示挂载目标', async ({ page }) => {
    await page.goto('/filesystems')
    await expect(page.getByRole('heading', { name: '文件存储' })).toBeVisible()
    await page.getByRole('link', { name: 'mock-fs' }).click()
    await expect(page).toHaveURL(/\/filesystems\/fs-1/)
    await expect(page.getByRole('heading', { name: 'mock-fs' })).toBeVisible()
    await expect(page.getByText('挂载目标')).toBeVisible()
    await expect(page.getByText('vpc-1')).toBeVisible()
  })

  test('对象存储可加载桶和对象列表', async ({ page }) => {
    await page.goto('/objects')
    await expect(page.getByRole('heading', { name: '对象存储' })).toBeVisible()
    await page.getByRole('button', { name: 'mock-bucket' }).click()
    await expect(page.getByText('mock.txt')).toBeVisible()
  })
})
