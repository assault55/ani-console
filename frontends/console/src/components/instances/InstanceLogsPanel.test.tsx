import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstanceLogsPanel } from './InstanceLogsPanel'

const mocks = vi.hoisted(() => ({
  coreGet: vi.fn(),
  getAccessToken: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  CORE_API_BASE: '/api/v1',
  coreApi: {
    GET: mocks.coreGet,
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: {
    getState: () => ({
      getAccessToken: mocks.getAccessToken,
    }),
  },
}))

type FetchCall = {
  url: string
  init: RequestInit
}

function createSseResponse(chunks: string[], init?: ResponseInit): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      },
    }),
    {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      ...init,
    },
  )
}

function installFetchMock(responseFactory: () => Response | Promise<Response>) {
  const calls: FetchCall[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} })
    return responseFactory()
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}

describe('InstanceLogsPanel', () => {
  beforeEach(() => {
    mocks.getAccessToken.mockReturnValue('unit-access-token')
    mocks.coreGet.mockResolvedValue({
      data: '2026-07-06T16:30:00Z info main history ready',
    })
  })

  afterEach(() => {
    mocks.coreGet.mockReset()
    mocks.getAccessToken.mockReset()
    vi.unstubAllGlobals()
  })

  it('loads history without creating a live stream by default', async () => {
    const { fetchMock } = installFetchMock(() => createSseResponse([]))
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mocks.coreGet).toHaveBeenCalledWith('/instances/{instance_id}/logs', {
      params: { path: { instance_id: 'inst-1' }, query: { follow: false, limit: 100, level: 'info' } },
      parseAs: 'text',
    })
  })

  it('starts live fetch stream with Authorization header and appends SSE log data', async () => {
    const { calls } = installFetchMock(() =>
      createSseResponse([
        'event: log\n',
        'data: {"message":"2026-07-06T16:31:00Z info main stream ready"}\n\n',
      ]),
    )
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    fireEvent.click(screen.getByRole('button', { name: '开启实时' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].url).toBe('/api/v1/instances/inst-1/logs?follow=true&tail_lines=100&level=info')
    expect(calls[0].url).not.toContain('unit-access-token')
    expect(new Headers(calls[0].init.headers).get('Authorization')).toBe('Bearer unit-access-token')
    await screen.findByText(/stream ready/)
  })

  it('stops live fetch stream from the live button', async () => {
    const { calls } = installFetchMock(() => createSseResponse([]))
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    fireEvent.click(screen.getByRole('button', { name: '开启实时' }))
    await waitFor(() => expect(calls).toHaveLength(1))

    fireEvent.click(screen.getByRole('button', { name: '停止实时' }))
    expect(calls[0].init.signal).toBeInstanceOf(AbortSignal)
    expect((calls[0].init.signal as AbortSignal).aborted).toBe(true)
  })

  it('aborts the old live fetch stream when level changes', async () => {
    const { calls } = installFetchMock(() => createSseResponse([]))
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    fireEvent.click(screen.getByRole('button', { name: '开启实时' }))
    await waitFor(() => expect(calls).toHaveLength(1))

    fireEvent.click(screen.getByTestId('instance-log-level-select'))
    fireEvent.click(await screen.findByText('debug'))

    await waitFor(() => expect(calls).toHaveLength(2))
    expect((calls[0].init.signal as AbortSignal).aborted).toBe(true)
    expect(calls[1].url).toBe('/api/v1/instances/inst-1/logs?follow=true&tail_lines=100&level=debug')
  })

  it('does not keep duplicate active streams under StrictMode', async () => {
    const { calls } = installFetchMock(() => createSseResponse([]))
    render(
      <StrictMode>
        <InstanceLogsPanel instanceId="inst-1" active />
      </StrictMode>,
    )

    await screen.findByText(/history ready/)
    fireEvent.click(screen.getByRole('button', { name: '开启实时' }))
    await waitFor(() => expect(calls.length).toBeGreaterThan(0))

    expect(calls.filter((call) => !(call.init.signal as AbortSignal).aborted)).toHaveLength(1)
  })

  it('shows auth error when live fetch returns 401', async () => {
    installFetchMock(() => new Response('missing bearer', { status: 401 }))
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    fireEvent.click(screen.getByRole('button', { name: '开启实时' }))

    await screen.findByText('登录已过期或实时日志请求未带鉴权')
  })

  it('shows backend error text when live fetch returns non-2xx', async () => {
    installFetchMock(() => new Response('backend stream failed', { status: 500 }))
    render(<InstanceLogsPanel instanceId="inst-1" active />)

    await screen.findByText(/history ready/)
    fireEvent.click(screen.getByRole('button', { name: '开启实时' }))

    await screen.findByText('backend stream failed')
  })
})
