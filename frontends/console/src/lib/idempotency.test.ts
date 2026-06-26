import { describe, expect, it } from 'vitest'
import { newIdempotencyKey } from './idempotency'

describe('idempotency', () => {
  it('generates uuid-like keys', () => {
    const k = newIdempotencyKey()
    expect(k).toMatch(/^[0-9a-f-]{36}$/i)
  })
})
