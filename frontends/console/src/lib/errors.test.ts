import { describe, expect, it } from 'vitest'
import { getErrorMessage, parseApiError } from './errors'

describe('errors', () => {
  it('parses api error body', () => {
    expect(parseApiError({ message: 'bad', code: 'X' }).code).toBe('X')
  })

  it('falls back for unknown errors', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback')
  })
})
