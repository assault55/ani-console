import { describe, expect, it } from 'vitest'
import { matchSideMenuKey, openSubMenuKeysForPath } from './side-menu-match'

const KEYS = ['/', '/instances/container', '/volumes', '/volumes/detail', '/k8s-clusters', '/networks/vpcs']

describe('matchSideMenuKey', () => {
  it('matches instance list to compute group', () => {
    expect(matchSideMenuKey('/instances', KEYS)).toEqual(['compute'])
  })

  it('matches longest prefix for nested routes', () => {
    expect(matchSideMenuKey('/volumes/vol-1', KEYS)).toEqual(['/volumes'])
  })

  it('matches network child route', () => {
    expect(matchSideMenuKey('/networks/vpcs', KEYS)).toEqual(['/networks/vpcs'])
  })

  it('matches instance detail to compute group', () => {
    expect(matchSideMenuKey('/instances/inst-1', KEYS)).toEqual(['compute'])
  })

  it('matches typed instance detail to its list route', () => {
    expect(matchSideMenuKey('/instances/container/inst-1', KEYS)).toEqual(['/instances/container'])
  })

  it('falls back to dashboard', () => {
    expect(matchSideMenuKey('/unknown', KEYS)).toEqual(['/'])
  })
})

describe('openSubMenuKeysForPath', () => {
  it('opens network management for network routes', () => {
    expect(openSubMenuKeysForPath('/networks/vpcs')).toEqual(['network-management'])
  })

  it('opens storage for storage routes', () => {
    expect(openSubMenuKeysForPath('/volumes')).toEqual(['storage'])
  })

  it('opens compute for instance detail', () => {
    expect(openSubMenuKeysForPath('/instances/inst-1')).toEqual(['compute'])
  })

  it('returns empty for top-level routes', () => {
    expect(openSubMenuKeysForPath('/k8s-clusters')).toEqual([])
  })
})
