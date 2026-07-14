import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expireAuthSession, redirectToLogin } from './client'
import { useAuthStore } from '@/stores/auth'

describe('coreApi auth middleware', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    useAuthStore.setState({ tokens: null })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/instances/sandbox',
        search: '?kind=sandbox',
        hash: '#details',
        assign: vi.fn(),
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
  })

  it('clears auth and redirects to login when auth session expires', () => {
    useAuthStore.getState().setTokens({ access_token: 'expired', refresh_token: '' })

    expireAuthSession()

    expect(useAuthStore.getState().tokens).toBeNull()
    expect(window.location.assign).toHaveBeenCalledWith('/login?redirect=%2Finstances%2Fsandbox%3Fkind%3Dsandbox%23details')
  })

  it('does not redirect again while already on login route', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/login', search: '', hash: '', assign: vi.fn() },
    })

    redirectToLogin()

    expect(window.location.assign).not.toHaveBeenCalled()
  })
})
