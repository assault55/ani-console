import { describe, expect, it } from 'vitest'
import {
  assertIntegerRange,
  assertMaxLength,
  assertNonEmpty,
  optionalIpv4,
  optionalIpv4Error,
  ipv4CidrError,
  ipv4CidrWithinError,
  optionalIpv4WithinCidrError,
  requireIpv4Cidr,
  requireIpv4CidrWithin,
  subnetFixedOctets,
  suggestGatewayIp,
  suggestSubnetCidr,
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

  it('validates IPv4 CIDR and optional IPv4 values', () => {
    expect(requireIpv4Cidr('10.80.1.0/24', 'CIDR')).toBe('10.80.1.0/24')
    expect(requireIpv4Cidr('0.0.0.0/0', '目标网段')).toBe('0.0.0.0/0')
    expect(() => requireIpv4Cidr('10.80.1.0', 'CIDR')).toThrow('CIDR必须是有效的 IPv4 CIDR')
    expect(() => requireIpv4Cidr('10.80.1.0/33', 'CIDR')).toThrow('CIDR必须是有效的 IPv4 CIDR')
    expect(() => requireIpv4Cidr('999.80.1.0/24', 'CIDR')).toThrow('CIDR必须是有效的 IPv4 CIDR')

    expect(optionalIpv4('', '网关')).toBeUndefined()
    expect(optionalIpv4('10.80.1.1', '网关')).toBe('10.80.1.1')
    expect(() => optionalIpv4('10.80.1.256', '网关')).toThrow('网关必须是有效的 IPv4 地址')
  })

  it('returns IPv4 CIDR form error text', () => {
    expect(ipv4CidrError('10.80.1.0/24', 'CIDR')).toBeUndefined()
    expect(ipv4CidrError('10.80.1./24', 'CIDR')).toBe('CIDR必须是有效的 IPv4 CIDR')
  })

  it('returns optional IPv4 form error text', () => {
    expect(optionalIpv4Error('', '网关')).toBeUndefined()
    expect(optionalIpv4Error('10.80.1.1', '网关')).toBeUndefined()
    expect(optionalIpv4Error('10.80.1.', '网关')).toBe('网关必须是有效的 IPv4 地址')
  })

  it('validates subnet CIDR belongs to selected VPC CIDR', () => {
    expect(requireIpv4CidrWithin('10.72.0.0/25', '10.72.0.0/24', 'CIDR', 'VPC CIDR')).toBe('10.72.0.0/25')
    expect(ipv4CidrWithinError('10.72.0.128/25', '10.72.0.0/24', 'CIDR', 'VPC CIDR')).toBeUndefined()
    expect(ipv4CidrWithinError('10.72.1.0/24', '10.72.0.0/24', 'CIDR', 'VPC CIDR')).toBe(
      'CIDR必须在 VPC CIDR 范围内',
    )
    expect(() => requireIpv4CidrWithin('10.72.0.0/16', '10.72.0.0/24', 'CIDR', 'VPC CIDR')).toThrow(
      'CIDR必须在 VPC CIDR 范围内',
    )
  })

  it('suggests a subnet CIDR from VPC CIDR', () => {
    expect(suggestSubnetCidr('10.72.0.0/24')).toBe('10.72.0.0/25')
    expect(suggestSubnetCidr('10.80.0.0/16')).toBe('10.80.0.0/24')
  })

  it('suggests gateway IP from subnet CIDR', () => {
    expect(suggestGatewayIp('10.72.0.0/25')).toBe('10.72.0.1')
    expect(suggestGatewayIp('10.72.0.128/25')).toBe('10.72.0.129')
  })

  it('marks full octets fixed by parent CIDR', () => {
    expect(subnetFixedOctets('10.72.0.0/24')).toEqual([true, true, true, false])
    expect(subnetFixedOctets('10.80.0.0/16')).toEqual([true, true, false, false])
  })

  it('validates optional gateway belongs to subnet CIDR', () => {
    expect(optionalIpv4WithinCidrError('', '10.72.0.0/25', '网关', 'CIDR')).toBeUndefined()
    expect(optionalIpv4WithinCidrError('10.72.0.1', '10.72.0.0/25', '网关', 'CIDR')).toBeUndefined()
    expect(optionalIpv4WithinCidrError('10.72.0.129', '10.72.0.0/25', '网关', 'CIDR')).toBe(
      '网关必须在 CIDR 范围内',
    )
  })
})
