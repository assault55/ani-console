import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InstanceVncConsole } from './InstanceVncConsole'

const mocks = vi.hoisted(() => ({
  corePost: vi.fn(),
  rfbInstances: [] as MockRfb[],
}))

vi.mock('@/api/client', () => ({
  coreApi: {
    POST: mocks.corePost,
  },
}))

vi.mock('@novnc/novnc', () => ({
  default: class MockRfb {
    scaleViewport = false
    resizeSession = false
    background = ''
    disconnect = vi.fn()

    constructor(
      public target: HTMLElement,
      public url: string,
      public options?: Record<string, unknown>,
    ) {
      mocks.rfbInstances.push(this)
    }

    addEventListener() {}
    removeEventListener() {}
  },
}))

class MockRfb {
  scaleViewport = false
  resizeSession = false
  background = ''
  disconnect = vi.fn()
  constructor(
    public target: HTMLElement,
    public url: string,
    public options?: Record<string, unknown>,
  ) {}
  addEventListener() {}
  removeEventListener() {}
}

describe('InstanceVncConsole', () => {
  afterEach(() => {
    mocks.corePost.mockReset()
    mocks.rfbInstances = []
  })

  it('creates a noVNC RFB session from the Core console URL', async () => {
    mocks.corePost.mockResolvedValue({
      data: {
        session_id: 'console-1',
        protocol: 'vnc',
        connect_url: 'wss://console.example/vnc?token=short-ticket',
        url: 'wss://console.example/vnc?token=short-ticket',
        expires_at: '2026-07-08T10:00:00Z',
      },
      error: undefined,
    })

    render(<InstanceVncConsole instanceId="inst-vm-1" />)

    await waitFor(() => expect(mocks.rfbInstances).toHaveLength(1))
    expect(mocks.corePost).toHaveBeenCalledWith('/instances/{instance_id}/console', {
      params: { path: { instance_id: 'inst-vm-1' } },
      body: { protocol: 'vnc' },
    })
    expect(mocks.rfbInstances[0]?.url).toBe('wss://console.example/vnc?token=short-ticket')
    expect(mocks.rfbInstances[0]?.scaleViewport).toBe(true)
    expect(mocks.rfbInstances[0]?.resizeSession).toBe(true)
  })

  it('disconnects the RFB session on unmount', async () => {
    mocks.corePost.mockResolvedValue({
      data: {
        session_id: 'console-1',
        protocol: 'vnc',
        connect_url: 'wss://console.example/vnc?token=short-ticket',
        url: 'wss://console.example/vnc?token=short-ticket',
        expires_at: '2026-07-08T10:00:00Z',
      },
      error: undefined,
    })

    const view = render(<InstanceVncConsole instanceId="inst-vm-1" />)

    await waitFor(() => expect(mocks.rfbInstances).toHaveLength(1))
    view.unmount()

    expect(mocks.rfbInstances[0]?.disconnect).toHaveBeenCalledTimes(1)
  })
})
