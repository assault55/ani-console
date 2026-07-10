import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { suggestImageSizeGib, uploadImageFile } from './image-upload'

const mocks = vi.hoisted(() => ({
  corePost: vi.fn(),
  coreGet: vi.fn(),
  xhrOpen: vi.fn(),
  xhrSend: vi.fn(),
  xhrSetRequestHeader: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  coreApi: {
    POST: mocks.corePost,
    GET: mocks.coreGet,
  },
}))

vi.mock('@/lib/idempotency', () => ({
  newIdempotencyKey: () => 'idem-fixed-1',
}))

class MockXHR {
  static instances: MockXHR[] = []
  status = 200
  responseText = ''
  upload = {
    onprogress: null as ((event: ProgressEvent) => void) | null,
  }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null
  open = mocks.xhrOpen
  setRequestHeader = mocks.xhrSetRequestHeader
  abort = vi.fn()

  constructor() {
    MockXHR.instances.push(this)
  }

  send(body?: Document | XMLHttpRequestBodyInit | null) {
    mocks.xhrSend.call(this, body)
  }
}

function installDefaultXhrSend() {
  mocks.xhrSend.mockImplementation(function (this: MockXHR) {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded: 100,
      total: 100,
    } as ProgressEvent)
    queueMicrotask(() => this.onload?.())
  })
}

describe('suggestImageSizeGib', () => {
  it('rounds up file size to GiB and adds one GiB headroom', () => {
    expect(suggestImageSizeGib(0)).toBe(1)
    expect(suggestImageSizeGib(1)).toBe(2)
    expect(suggestImageSizeGib(2.5 * 1024 ** 3)).toBe(4)
    expect(suggestImageSizeGib(5 * 1024 ** 3)).toBe(6)
    expect(suggestImageSizeGib(18.5 * 1024 ** 3)).toBe(20)
  })
})

describe('uploadImageFile', () => {
  beforeEach(() => {
    installDefaultXhrSend()
  })

  afterEach(() => {
    vi.useRealTimers()
    mocks.corePost.mockReset()
    mocks.coreGet.mockReset()
    mocks.xhrOpen.mockReset()
    mocks.xhrSend.mockReset()
    mocks.xhrSetRequestHeader.mockReset()
    MockXHR.instances = []
    vi.unstubAllGlobals()
  })

  it('creates an iso upload session without storage_class and uploads raw bytes with session token', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('XMLHttpRequest', MockXHR as unknown as typeof XMLHttpRequest)

    const readyImage = {
      id: 'img-1',
      tenant_id: 'tenant-1',
      name: 'ubuntu.iso',
      format: 'iso' as const,
      size_gib: 5,
      state: 'ready' as const,
      created_at: '2026-07-09T00:00:00Z',
      updated_at: '2026-07-09T00:01:00Z',
    }

    mocks.corePost.mockResolvedValue({
      data: {
        image: { ...readyImage, state: 'uploading' },
        upload_url: 'https://upload.example/v1beta1/upload',
        token: 'upload-ticket',
        expires_at: '2099-01-01T00:00:00Z',
        method: 'POST',
      },
      error: undefined,
    })
    mocks.coreGet
      .mockResolvedValueOnce({ data: { ...readyImage, state: 'uploading' }, error: undefined })
      .mockResolvedValueOnce({ data: readyImage, error: undefined })

    const file = new File([new Uint8Array([1, 2, 3])], 'ubuntu.iso', {
      type: 'application/x-iso9660-image',
    })
    const onProgress = vi.fn()

    const promise = uploadImageFile({ file, sizeGib: 5, onProgress })
    await vi.advanceTimersByTimeAsync(3000)
    const result = await promise

    expect(mocks.corePost).toHaveBeenCalledWith('/images/uploads', {
      body: {
        idempotency_key: 'idem-fixed-1',
        name: 'ubuntu.iso',
        format: 'iso',
        size_gib: 5,
        content_type: 'application/x-iso9660-image',
      },
      headers: {
        'Idempotency-Key': 'idem-fixed-1',
      },
    })
    expect(mocks.xhrOpen).toHaveBeenCalledWith('POST', 'https://upload.example/v1beta1/upload')
    expect(mocks.xhrSetRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer upload-ticket')
    expect(mocks.xhrSetRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream')
    expect(mocks.xhrSend).toHaveBeenCalledWith(file)
    expect(file instanceof FormData).toBe(false)
    expect(onProgress).toHaveBeenCalledWith({ phase: 'uploading', percent: 99, loadedBytes: 100, totalBytes: 100 })
    expect(onProgress).toHaveBeenCalledWith({
      phase: 'processing',
      percent: 100,
      message: '发送完成，平台入库中…',
    })
    expect(mocks.coreGet).toHaveBeenCalledWith('/images/{image_id}', {
      params: { path: { image_id: 'img-1' } },
    })
    expect(result).toEqual(readyImage)
  })

  it('waits for image state uploading before sending raw bytes', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('XMLHttpRequest', MockXHR as unknown as typeof XMLHttpRequest)

    const uploadReadyImage = {
      id: 'img-gated',
      tenant_id: 'tenant-1',
      name: 'ubuntu.iso',
      format: 'iso' as const,
      size_gib: 5,
      state: 'uploading' as const,
      created_at: '2026-07-09T00:00:00Z',
      updated_at: '2026-07-09T00:01:00Z',
    }
    const readyImage = { ...uploadReadyImage, state: 'ready' as const }

    mocks.corePost.mockResolvedValue({
      data: {
        image: { ...uploadReadyImage, state: 'pending' },
        upload_url: 'https://upload.example/v1beta1/upload',
        token: 'upload-ticket',
        expires_at: '2099-01-01T00:00:00Z',
        method: 'POST',
      },
      error: undefined,
    })
    mocks.coreGet
      .mockResolvedValueOnce({ data: { ...uploadReadyImage, state: 'pending' }, error: undefined })
      .mockResolvedValueOnce({ data: uploadReadyImage, error: undefined })
      .mockResolvedValueOnce({ data: readyImage, error: undefined })

    const onProgress = vi.fn()
    const promise = uploadImageFile({
      file: new File([new Uint8Array([1])], 'ubuntu.iso'),
      sizeGib: 5,
      onProgress,
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(onProgress).toHaveBeenCalledWith({
      phase: 'preparing',
      percent: 0,
      message: '正在准备存储（等待上传服务就绪）…',
    })
    expect(mocks.xhrSend).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(5000)
    await promise

    expect(mocks.xhrSend).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith({ phase: 'uploading', percent: 0 })
    expect(onProgress).toHaveBeenCalledWith({
      phase: 'processing',
      percent: 100,
      message: '发送完成，平台入库中…',
    })
    vi.useRealTimers()
  })

  it('computes size_gib from file size when not provided', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('XMLHttpRequest', MockXHR as unknown as typeof XMLHttpRequest)

    const readyImage = {
      id: 'img-big',
      tenant_id: 'tenant-1',
      name: 'openeuler.iso',
      format: 'iso' as const,
      size_gib: 20,
      state: 'ready' as const,
      created_at: '2026-07-09T00:00:00Z',
      updated_at: '2026-07-09T00:01:00Z',
    }

    mocks.corePost.mockResolvedValue({
      data: {
        image: { ...readyImage, state: 'uploading' },
        upload_url: 'https://upload.example/v1beta1/upload',
        token: 'upload-ticket',
        expires_at: '2099-01-01T00:00:00Z',
        method: 'POST',
      },
      error: undefined,
    })
    mocks.coreGet
      .mockResolvedValueOnce({ data: { ...readyImage, state: 'uploading' }, error: undefined })
      .mockResolvedValueOnce({ data: readyImage, error: undefined })

    const bytes = 18.5 * 1024 ** 3
    const file = new File([new Uint8Array(0)], 'openeuler.iso')
    Object.defineProperty(file, 'size', { value: bytes })

    const promise = uploadImageFile({ file })
    await vi.advanceTimersByTimeAsync(3000)
    await promise

    expect(mocks.corePost).toHaveBeenCalledWith(
      '/images/uploads',
      expect.objectContaining({
        body: expect.objectContaining({ size_gib: 20, format: 'iso' }),
      }),
    )
  })

  it('rejects when the upload session is already expired', async () => {
    vi.stubGlobal('XMLHttpRequest', MockXHR as unknown as typeof XMLHttpRequest)

    mocks.corePost.mockResolvedValue({
      data: {
        image: {
          id: 'img-expired',
          tenant_id: 'tenant-1',
          name: 'old.iso',
          format: 'iso',
          size_gib: 2,
          state: 'uploading',
          created_at: '2026-07-09T00:00:00Z',
          updated_at: '2026-07-09T00:00:00Z',
        },
        upload_url: 'https://upload.example/expired',
        token: 'stale',
        expires_at: '2020-01-01T00:00:00Z',
        method: 'POST',
      },
      error: undefined,
    })

    const file = new File([new Uint8Array([1])], 'old.iso')
    await expect(uploadImageFile({ file })).rejects.toThrow(/过期/)
    expect(mocks.xhrSend).not.toHaveBeenCalled()
  })

  it('surfaces HTTP status when direct upload fails after browser progress completes', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('XMLHttpRequest', MockXHR as unknown as typeof XMLHttpRequest)

    mocks.corePost.mockResolvedValue({
      data: {
        image: {
          id: 'img-fail',
          tenant_id: 'tenant-1',
          name: 'big.iso',
          format: 'iso',
          size_gib: 30,
          state: 'uploading',
          created_at: '2026-07-09T00:00:00Z',
          updated_at: '2026-07-09T00:00:00Z',
        },
        upload_url: 'https://upload.example/fail',
        token: 'upload-ticket',
        expires_at: '2099-01-01T00:00:00Z',
        method: 'POST',
      },
      error: undefined,
    })
    mocks.coreGet.mockResolvedValue({
      data: {
        id: 'img-fail',
        tenant_id: 'tenant-1',
        name: 'big.iso',
        format: 'iso',
        size_gib: 30,
        state: 'uploading',
        created_at: '2026-07-09T00:00:00Z',
        updated_at: '2026-07-09T00:00:00Z',
      },
      error: undefined,
    })

    mocks.xhrSend.mockImplementation(function (this: MockXHR) {
      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: 100,
        total: 100,
      } as ProgressEvent)
      this.status = 500
      this.responseText = 'upload proxy rejected'
      queueMicrotask(() => this.onload?.())
    })

    const file = new File([new Uint8Array([1])], 'big.iso')
    const onProgress = vi.fn()
    const promise = expect(uploadImageFile({ file, onProgress })).rejects.toThrow(/upload proxy rejected|上传失败 HTTP 500/)
    await vi.advanceTimersByTimeAsync(3000)
    await promise
    expect(onProgress).toHaveBeenCalledWith({ phase: 'uploading', percent: 99, loadedBytes: 100, totalBytes: 100 })
    expect(mocks.coreGet).toHaveBeenCalledWith('/images/{image_id}', {
      params: { path: { image_id: 'img-fail' } },
    })
  })

  it('retries direct upload when upload proxy returns 503', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('XMLHttpRequest', MockXHR as unknown as typeof XMLHttpRequest)

    const readyImage = {
      id: 'img-retry',
      tenant_id: 'tenant-1',
      name: 'retry.iso',
      format: 'iso' as const,
      size_gib: 5,
      state: 'ready' as const,
      created_at: '2026-07-09T00:00:00Z',
      updated_at: '2026-07-09T00:01:00Z',
    }

    mocks.corePost.mockResolvedValue({
      data: {
        image: { ...readyImage, state: 'uploading' },
        upload_url: 'https://upload.example/retry',
        token: 'upload-ticket',
        expires_at: '2099-01-01T00:00:00Z',
        method: 'POST',
      },
      error: undefined,
    })
    mocks.coreGet
      .mockResolvedValueOnce({ data: { ...readyImage, state: 'uploading' }, error: undefined })
      .mockResolvedValueOnce({ data: readyImage, error: undefined })

    mocks.xhrSend.mockImplementation(function (this: MockXHR) {
      if (mocks.xhrSend.mock.calls.length === 1) {
        this.status = 503
        this.responseText = 'upload service is not ready'
        queueMicrotask(() => this.onload?.())
        return
      }
      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: 50,
        total: 100,
      } as ProgressEvent)
      queueMicrotask(() => this.onload?.())
    })

    const file = new File([new Uint8Array([1])], 'retry.iso')
    const onProgress = vi.fn()
    const promise = uploadImageFile({ file, onProgress })

    await Promise.resolve()
    await Promise.resolve()
    expect(mocks.xhrSend).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.xhrSend).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith({
      phase: 'uploading',
      percent: 0,
      message: '上传服务尚未就绪，正在重试…',
    })

    await vi.advanceTimersByTimeAsync(5000)
    await promise

    expect(mocks.xhrSend).toHaveBeenCalledTimes(2)
    expect(mocks.xhrSend).toHaveBeenNthCalledWith(1, file)
    expect(mocks.xhrSend).toHaveBeenNthCalledWith(2, file)
    expect(onProgress).toHaveBeenCalledWith({ phase: 'uploading', percent: 50, loadedBytes: 50, totalBytes: 100 })
    vi.useRealTimers()
  })
})
