import { StrictMode } from 'react'
import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstanceTerminal } from './InstanceTerminal'

const mocks = vi.hoisted(() => ({
  corePost: vi.fn(),
  focus: vi.fn(),
  write: vi.fn(),
  writeln: vi.fn(),
  sent: [] as string[],
  emitData: undefined as undefined | ((data: string) => void),
  emitResize: undefined as undefined | ((size: { cols: number; rows: number }) => void),
  socket: undefined as undefined | MockWebSocket,
}))

vi.mock('@/api/client', () => ({
  coreApi: {
    POST: mocks.corePost,
  },
}))

vi.mock('@/lib/idempotency', () => ({
  newIdempotencyKey: () => 'idem-1',
}))

vi.mock('@xterm/xterm', () => ({
  Terminal: class MockTerminal {
    cols = 80
    rows = 24
    loadAddon() {}
    open() {}
    focus = mocks.focus
    write = mocks.write
    writeln = mocks.writeln
    dispose() {}
    onData(callback: (data: string) => void) {
      mocks.emitData = callback
      return { dispose() {} }
    }
    onResize(callback: (size: { cols: number; rows: number }) => void) {
      mocks.emitResize = callback
      return { dispose() {} }
    }
  },
}))

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class MockFitAddon {
    fit() {}
  },
}))

class MockResizeObserver {
  observe() {}
  disconnect() {}
}

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  readyState = MockWebSocket.OPEN
  binaryType: BinaryType = 'blob'
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null

  constructor(public url: string | URL) {
    mocks.socket = this
    setTimeout(() => this.onopen?.(new Event('open')), 0)
  }

  send(data: string) {
    mocks.sent.push(data)
  }
  emit(data: string | ArrayBuffer | Blob) {
    this.onmessage?.(new MessageEvent('message', { data }))
  }
  close() {}
}

describe('InstanceTerminal', () => {
  const mockExecSession = (wsUrl: string) => {
    mocks.corePost.mockResolvedValue({
      data: {
        id: 'exec-1',
        instance_id: 'inst-1',
        ws_url: wsUrl,
        token: 'short-ticket',
        expires_at: '2026-07-07T08:10:00Z',
        dev_profile: { real_provider: false, profile: 'CORE-DEV-PROFILE-A' },
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    })
  }

  beforeEach(() => {
    mockExecSession('ws://terminal.example/instances/inst-1/exec/exec-1?token=short-ticket')
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.stubGlobal('WebSocket', MockWebSocket)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(860)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(420)
  })

  afterEach(() => {
    mocks.corePost.mockReset()
    mocks.focus.mockReset()
    mocks.write.mockReset()
    mocks.writeln.mockReset()
    mocks.sent = []
    mocks.emitData = undefined
    mocks.emitResize = undefined
    mocks.socket = undefined
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('creates one Core exec session when mounted under StrictMode', async () => {
    render(
      <StrictMode>
        <InstanceTerminal instanceId="inst-1" />
      </StrictMode>,
    )

    await waitFor(() => expect(mocks.socket).toBeDefined())
    expect(mocks.corePost).toHaveBeenCalledTimes(1)
    expect(mocks.corePost).toHaveBeenCalledWith('/instances/{instance_id}/exec', expect.any(Object))
    expect(String(mocks.socket?.url)).toBe('ws://terminal.example/instances/inst-1/exec/exec-1?token=short-ticket')
  })

  it('focuses terminal input when the terminal area is pressed', async () => {
    const view = render(<InstanceTerminal instanceId="inst-1" />)

    await waitFor(() => expect(mocks.socket).toBeDefined())
    mocks.focus.mockClear()

    view.getByTestId('instance-terminal-output').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    expect(mocks.focus).toHaveBeenCalledTimes(1)
  })

  it('sends stdin and resize using KubeCloud terminal frames', async () => {
    mockExecSession(
      'ws://terminal.example/kapis/clusters/host/terminal.kubercloud.com/v1alpha2/namespaces/default/pods/pod-1/exec?container=main&shell=sh',
    )
    render(<InstanceTerminal instanceId="inst-1" />)

    await waitFor(() => expect(mocks.socket).toBeDefined())
    mocks.sent = []

    mocks.emitData?.('a')
    mocks.emitResize?.({ cols: 100, rows: 32 })

    expect(mocks.sent).toEqual([
      JSON.stringify({ Op: 'stdin', Data: 'a' }),
      JSON.stringify({ Op: 'resize', Cols: 100, Rows: 32 }),
    ])
  })

  it('uses KubeCloud frames even when Core returns an instance exec url', async () => {
    render(<InstanceTerminal instanceId="inst-1" />)

    await waitFor(() => expect(mocks.socket).toBeDefined())
    mocks.sent = []

    mocks.emitData?.('a')
    mocks.emitResize?.({ cols: 100, rows: 32 })

    expect(mocks.sent).toEqual([
      JSON.stringify({ Op: 'stdin', Data: 'a' }),
      JSON.stringify({ Op: 'resize', Cols: 100, Rows: 32 }),
    ])
  })

  it('sends stdin from focused terminal container when xterm data events do not fire', async () => {
    mockExecSession(
      'ws://terminal.example/kapis/clusters/host/terminal.kubercloud.com/v1alpha2/namespaces/default/pods/pod-1/exec?container=main&shell=sh',
    )
    const view = render(<InstanceTerminal instanceId="inst-1" />)

    await waitFor(() => expect(mocks.socket).toBeDefined())
    mocks.sent = []

    view.getByTestId('instance-terminal-output').dispatchEvent(new KeyboardEvent('keydown', { key: 'l', bubbles: true }))
    view.getByTestId('instance-terminal-output').dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }))
    view.getByTestId('instance-terminal-output').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(mocks.sent).toEqual([
      JSON.stringify({ Op: 'stdin', Data: 'l' }),
      JSON.stringify({ Op: 'stdin', Data: 's' }),
      JSON.stringify({ Op: 'stdin', Data: '\r' }),
    ])
  })

  it('renders Data from KubeCloud stdout frames and keeps plain output compatible', async () => {
    render(<InstanceTerminal instanceId="inst-1" />)

    await waitFor(() => expect(mocks.socket).toBeDefined())

    mocks.socket?.emit(JSON.stringify({ Data: 'json-output\n' }))
    mocks.socket?.emit('plain-output\n')

    expect(mocks.write).toHaveBeenCalledWith('json-output\n')
    expect(mocks.write).toHaveBeenCalledWith('plain-output\n')
  })
})
