import { describe, expect, it } from 'vitest'
import { getInstanceDisplayIp, getInstanceNetworkValue } from './instance-network'

describe('instance network display helpers', () => {
  it('uses top-level private_ip first', () => {
    expect(getInstanceDisplayIp({ private_ip: '10.0.1.10', endpoint: '10.244.0.8' })).toBe('10.0.1.10')
  })

  it('falls back to provider-assigned IP fields when private_ip is absent', () => {
    expect(getInstanceDisplayIp({ network: { private_ip: '10.244.0.8' } })).toBe('10.244.0.8')
    expect(getInstanceDisplayIp({ ip_address: '10.244.0.9' })).toBe('10.244.0.9')
    expect(getInstanceDisplayIp({ endpoint: '10.244.0.10' })).toBe('10.244.0.10')
    expect(getInstanceDisplayIp({ ssh: { host: '10.244.0.11' } })).toBe('10.244.0.11')
  })

  it('falls back to nested network ids for VPC and subnet', () => {
    expect(getInstanceNetworkValue({ network: { vpc_id: 'vpc-1' } }, 'vpc_id')).toBe('vpc-1')
    expect(getInstanceNetworkValue({ network: { subnet_id: 'subnet-1' } }, 'subnet_id')).toBe('subnet-1')
  })

  it('returns dash when no network value exists', () => {
    expect(getInstanceDisplayIp({})).toBe('—')
    expect(getInstanceNetworkValue({}, 'vpc_id')).toBe('—')
  })
})
