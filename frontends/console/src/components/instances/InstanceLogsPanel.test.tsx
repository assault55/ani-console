import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstanceLogsPanel } from './InstanceLogsPanel'

const mocks = vi.hoisted(() => ({
  coreGet: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  CORE_API_BASE: '/api/v1',
  coreApi: {
    GET: mocks.coreGet,
  },
}))

type Listener = (event: MessageEvent<string>) => void

class MockEventSource {
  static instances: MockEventSource[] = []

  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  listeners = new Map<string, Listener[]>()
  closed = false

  constructor(
    public url: string,
    public init?: EventSourceInit,
  ) {
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }

  close() {
    this.closed = true
  }

  emitLog(data: unknown) {
    for (const listener of this.listeners.get('log') ?? []) {
      listener({ data: typeof data === 'string' ? data : JSON.stringify(data) } as MessageEvent<string>)
    }
  }
}

describe('InstanceLogsPanel', () => {
  beforeEach(() => {
    MockEventSource.instances = []
    mocks.coreGet.mockResolvedValue({
      data: '2026-07-06T16:30:00Z info main history ready',
    })
    vi.stubGlobal('EventSource', MockEventSource)
  })

  afterEach(() => {
    mocks.coreGet.mockReset()
    vi.unstubAllGlobals()
  })

  it('creates EventSource with Core follow path and appends text log events', async () => {
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))

    expect(MockEventSource.instances[0].url).toBe('/api/v1/instances/inst-1/logs?follow=true&tail_lines=100&level=info')
    expect(MockEventSource.instances[0].url).not.toContain('pod')
    expect(MockEventSource.instances[0].init).toEqual({ withCredentials: true })

    act(() => {
      MockEventSource.instances[0].emitLog('2026-07-06T16:31:00Z info main stream ready')
    })

    await screen.findByText(/stream ready/)
  })

  it('reconnects when level changes', async () => {
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))

    fireEvent.click(screen.getByTestId('instance-log-level-select'))
    fireEvent.click(await screen.findByText('debug'))

    await waitFor(() => expect(MockEventSource.instances).toHaveLength(2))
    expect(MockEventSource.instances[0].closed).toBe(true)
    expect(MockEventSource.instances[1].url).toBe('/api/v1/instances/inst-1/logs?follow=true&tail_lines=100&level=debug')
  })

  it('closes EventSource on unmount', async () => {
    const view = render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))

    view.unmount()

    expect(MockEventSource.instances[0].closed).toBe(true)
  })

  it('shows reconnecting state on EventSource error', async () => {
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))

    act(() => {
      MockEventSource.instances[0].onerror?.()
    })

    await screen.findByText('日志流连接中断，正在重连')
  })
})
