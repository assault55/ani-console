import { test, expect } from '@playwright/test'
import { installCoreApiMocks } from './support/api-mock'
import { seedAuth } from './support/auth'

test.describe('可启动镜像', () => {
  test.beforeEach(async ({ page }) => {
    await installCoreApiMocks(page)
    await seedAuth(page)
  })

  test('列表展示镜像并可上传本地 ISO', async ({ page }) => {
    let uploadBody: Record<string, unknown> | undefined
    let uploadIdempotencyHeader: string | undefined
    let directUploadAuth: string | undefined
    let directUploadContentType: string | undefined

    await page.route('**/api/v1/images/uploads', async (route, request) => {
      uploadBody = request.postDataJSON() as Record<string, unknown>
      uploadIdempotencyHeader = request.headers()['idempotency-key']
      await route.fulfill({
        status: 201,
        json: {
          image: {
            id: 'img-upload-1',
            tenant_id: 'tenant-1',
            name: uploadBody.name,
            format: uploadBody.format,
            size_gib: uploadBody.size_gib,
            state: 'uploading',
            created_at: '2026-06-01T08:00:00Z',
            updated_at: '2026-06-01T08:00:00Z',
          },
          upload_url: 'https://upload.example/images/img-upload-1',
          token: 'upload-ticket',
          expires_at: '2099-06-01T08:00:00Z',
          method: 'POST',
        },
      })
    })

    await page.route('https://upload.example/images/img-upload-1', async (route, request) => {
      directUploadAuth = request.headers().authorization
      directUploadContentType = request.headers()['content-type']
      expect(request.postDataBuffer()?.byteLength ?? 0).toBeGreaterThan(0)
      await route.fulfill({ status: 200, body: 'ok' })
    })

    let imageStatusPolls = 0
    await page.route('**/api/v1/images/img-upload-1', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }
      imageStatusPolls += 1
      await route.fulfill({
        status: 200,
        json: {
          id: 'img-upload-1',
          tenant_id: 'tenant-1',
          name: 'new.iso',
          format: 'iso',
          size_gib: 12,
          state: imageStatusPolls === 1 ? 'uploading' : 'ready',
          created_at: '2026-06-01T08:00:00Z',
          updated_at: '2026-06-01T08:05:00Z',
        },
      })
    })

    await page.goto('/images')
    await expect(page.getByRole('heading', { name: '可启动镜像' })).toBeVisible()
    await expect(page.getByText('ubuntu-24.04.iso')).toBeVisible()
    await page.getByRole('button', { name: '上传 ISO' }).click()

    await page.locator('input[type="file"]').setInputFiles({
      name: 'new.iso',
      mimeType: 'application/x-iso9660-image',
      buffer: Buffer.from('iso-bytes'),
    })
    await page.getByTestId('image-upload-name-input').fill('new.iso')
    await page.getByTestId('image-upload-size-input').fill('12')
    await page.getByRole('button', { name: '开始上传' }).click()
    await expect(page.getByTestId('image-upload-phase')).toContainText('正在准备存储')

    await expect.poll(() => uploadBody?.name).toBe('new.iso')
    expect(uploadBody?.format).toBe('iso')
    expect(uploadBody?.size_gib).toBe(12)
    expect(uploadBody).not.toHaveProperty('storage_class')
    expect(uploadIdempotencyHeader).toBeTruthy()
    expect(uploadIdempotencyHeader).toBe(uploadBody?.idempotency_key)
    await expect.poll(() => imageStatusPolls).toBeGreaterThanOrEqual(1)
    await expect.poll(() => directUploadAuth).toBe('Bearer upload-ticket')
    await expect.poll(() => directUploadContentType).toBe('application/octet-stream')
    await expect(page.getByText('镜像「new.iso」已就绪')).toBeVisible()
  })
})
