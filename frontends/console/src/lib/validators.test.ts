import { describe, expect, it } from 'vitest'
import {
  assertIntegerRange,
  assertMaxLength,
  assertNonEmpty,
  isValidScope,
  optionalIsoDateTime,
  parseScopeList,
} from './validators'

describe('validators', () => {
  it('validates api key scopes', () => {
    expect(isValidScope('scope:instances:*')).toBe(true)
    expect(isValidScope('scope:k8s-clusters:read')).toBe(true)
    expect(isValidScope('*')).toBe(false)
    expect(isValidScope('scope:Bad:read')).toBe(false)
  })

  it('parses comma and newline separated scopes', () => {
    expect(parseScopeList('scope:instances:read, scope:objects:*\nscope:secrets:read')).toEqual([
      'scope:instances:read',
      'scope:objects:*',
      'scope:secrets:read',
    ])
  })

  it('checks required strings and max length', () => {
    expect(assertNonEmpty(' name ', '名称')).toBe('name')
    expect(() => assertNonEmpty(' ', '名称')).toThrow('名称不能为空')
    expect(assertMaxLength('abc', 3, '名称')).toBe('abc')
    expect(() => assertMaxLength('abcd', 3, '名称')).toThrow('名称不能超过 3 个字符')
  })

  it('checks integer ranges', () => {
    expect(assertIntegerRange(60, 1, 10000, '速率限制')).toBe(60)
    expect(() => assertIntegerRange(0, 1, 10000, '速率限制')).toThrow('速率限制必须在 1-10000 之间')
    expect(() => assertIntegerRange(1.5, 1, 10000, '速率限制')).toThrow('速率限制必须是整数')
  })

  it('normalizes optional date time', () => {
    expect(optionalIsoDateTime('')).toBeUndefined()
    expect(optionalIsoDateTime('2026-06-26T08:00:00Z')).toBe('2026-06-26T08:00:00.000Z')
    expect(() => optionalIsoDateTime('not-a-date')).toThrow('过期时间必须是有效的日期时间')
  })
})
