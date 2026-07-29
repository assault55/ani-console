import { describe, expect, it } from 'vitest'
import {
  activeTopNavKeyForPath,
  matchSideMenuKey,
  openSubMenuKeysForPath,
  sidebarItemsForTopNavKey,
} from './side-menu-match'
import { firstLeafPath, type MenuItem } from './menu-items'

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

  it('opens colony for K8s cluster route', () => {
    expect(openSubMenuKeysForPath('/k8s-clusters')).toEqual(['colony'])
  })
})

describe('activeTopNavKeyForPath', () => {
  it('returns "/" for homepage', () => {
    expect(activeTopNavKeyForPath('/')).toBe('/')
  })

  it('returns "compute" for /instances/vm', () => {
    expect(activeTopNavKeyForPath('/instances/vm')).toBe('compute')
  })

  it('returns "storage" for /volumes', () => {
    expect(activeTopNavKeyForPath('/volumes')).toBe('storage')
  })

  it('returns "colony" for K8s cluster route', () => {
    expect(activeTopNavKeyForPath('/k8s-clusters')).toBe('colony')
  })

  it('returns "registry" for /registry', () => {
    expect(activeTopNavKeyForPath('/registry')).toBe('registry')
  })

  it('returns "observability" for /observability', () => {
    expect(activeTopNavKeyForPath('/observability')).toBe('observability')
  })

  it('returns "usage" for /usage', () => {
    expect(activeTopNavKeyForPath('/usage')).toBe('usage')
  })

  it('returns "settings" for /settings/api-keys', () => {
    expect(activeTopNavKeyForPath('/settings/api-keys')).toBe('settings')
  })

  it('returns "demo" for /demo/b-i-1', () => {
    expect(activeTopNavKeyForPath('/demo/b-i-1')).toBe('demo')
  })

  it('falls back to "/" for unknown paths', () => {
    expect(activeTopNavKeyForPath('/unknown')).toBe('/')
  })
})

describe('sidebarItemsForTopNavKey', () => {
  it('returns 6 children for "compute"', () => {
    expect(sidebarItemsForTopNavKey('compute')?.length).toBe(6)
  })

  it('returns 1 child for "colony"', () => {
    expect(sidebarItemsForTopNavKey('colony')?.length).toBe(1)
  })

  it('returns 1 child for "registry"', () => {
    expect(sidebarItemsForTopNavKey('registry')?.length).toBe(1)
  })

  it('returns the remaining second-level group for "demo"', () => {
    expect(sidebarItemsForTopNavKey('demo')?.length).toBe(1)
  })

  it('places demo group B under group A at the same level as A leaves', () => {
    const demo = sidebarItemsForTopNavKey('demo')
    const groupA = demo?.find((i) => i.key === 'demo-group-a')
    const groupB = groupA?.children?.find((i) => i.key === 'demo-group-b')
    expect(groupB?.children?.length).toBe(2)
  })

  it('returns null for unknown key', () => {
    expect(sidebarItemsForTopNavKey('does-not-exist')).toBeNull()
  })
})

describe('firstLeafPath', () => {
  it('returns a directly accessible menu path', () => {
    expect(firstLeafPath({ key: '/direct', label: 'Direct' })).toBe('/direct')
  })

  it('recursively finds the first accessible leaf in menu order', () => {
    const nested: MenuItem = {
      key: 'root-group',
      label: 'Root',
      children: [
        {
          key: 'nested-group',
          label: 'Nested',
          children: [{ key: '/first-page', label: 'First page' }],
        },
        { key: '/second-page', label: 'Second page' },
      ],
    }
    expect(firstLeafPath(nested)).toBe('/first-page')
  })

  it('returns null when no accessible leaf exists', () => {
    expect(firstLeafPath({ key: 'empty-group', label: 'Empty', children: [] })).toBeNull()
  })
})
