import { describe, expect, it } from 'vitest'
import { formatDateTime, formatBytes } from './format'

describe('format', () => {
  it('formatDateTime returns dash for empty', () => {
    expect(formatDateTime(null)).toBe('—')
  })

  it('formatBytes scales units', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
  })
})
