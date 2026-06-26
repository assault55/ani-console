import { describe, expect, it } from 'vitest'
import { matchSideMenuKey, openSubMenuKeysForPath } from './side-menu-match'

const KEYS = ['/', '/instances', '/volumes', '/volumes/detail', '/k8s-clusters']

describe('matchSideMenuKey', () => {
  it('matches exact path', () => {
    expect(matchSideMenuKey('/instances', KEYS)).toEqual(['/instances'])
  })

  it('matches longest prefix for nested routes', () => {
    expect(matchSideMenuKey('/volumes/vol-1', KEYS)).toEqual(['/volumes'])
  })

  it('falls back to dashboard', () => {
    expect(matchSideMenuKey('/unknown', KEYS)).toEqual(['/'])
  })
})

describe('openSubMenuKeysForPath', () => {
  it('opens storage-network for network routes', () => {
    expect(openSubMenuKeysForPath('/networks/vpcs')).toEqual(['storage-network'])
  })

  it('opens compute for instance detail', () => {
    expect(openSubMenuKeysForPath('/instances/inst-1')).toEqual(['compute'])
  })

  it('returns empty for top-level routes', () => {
    expect(openSubMenuKeysForPath('/k8s-clusters')).toEqual([])
  })
})
