import { beforeEach, describe, expect, it } from 'vitest'
import { getJwtJti, isAuthenticated, useAuthStore } from './auth'

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ tokens: null })
  })

  it('isAuthenticated is false without tokens', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('isAuthenticated is true with access_token', () => {
    useAuthStore.getState().setTokens({
      access_token: 'tok',
      refresh_token: 'ref',
    })
    expect(isAuthenticated()).toBe(true)
    expect(useAuthStore.getState().getAccessToken()).toBe('tok')
  })

  it('clear removes tokens', () => {
    useAuthStore.getState().setTokens({ access_token: 'a', refresh_token: 'b' })
    useAuthStore.getState().clear()
    expect(isAuthenticated()).toBe(false)
  })

  it('reads jti from access token claims', () => {
    const token = `header.${btoa(JSON.stringify({ jti: 'jwt-id-1' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.sig`
    useAuthStore.getState().setTokens({ access_token: token, refresh_token: 'ref' })

    expect(getJwtJti(token)).toBe('jwt-id-1')
    expect(useAuthStore.getState().getAccessTokenJti()).toBe('jwt-id-1')
  })

  it('returns null when access token has no jti', () => {
    const token = `header.${btoa(JSON.stringify({ sub: 'user-1' })).replace(/=+$/, '')}.sig`

    expect(getJwtJti(token)).toBeNull()
  })
})
