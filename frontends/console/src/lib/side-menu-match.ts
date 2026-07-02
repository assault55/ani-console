/** 根据当前 pathname 计算侧栏 Menu selectedKeys（最长前缀匹配）。 */
export function matchSideMenuKey(pathname: string, routeKeys: string[]): string[] {
  const exact = routeKeys.find((k) => k === pathname)
  if (exact) return [exact]
  const prefix = routeKeys
    .filter((k) => k !== '/' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return prefix ? [prefix] : ['/']
}

const PATH_SUBMENU: { prefix: string; key: string }[] = [
  { prefix: '/instances', key: 'compute' },
  { prefix: '/instances/container', key: 'compute' },
  { prefix: '/instances/vm', key: 'compute' },
  { prefix: '/instances/gpu', key: 'compute' },
  { prefix: '/instances/sandbox', key: 'compute' },
  { prefix: '/gpu-inventory', key: 'compute' },
  { prefix: '/sandbox-templates', key: 'compute' },
  { prefix: '/volumes', key: 'storage-network' },
  { prefix: '/filesystems', key: 'storage-network' },
  { prefix: '/objects', key: 'storage-network' },
  { prefix: '/vector-stores', key: 'storage-network' },
  { prefix: '/networks', key: 'storage-network' },
  { prefix: '/encryption', key: 'security' },
  { prefix: '/secrets', key: 'security' },
  { prefix: '/settings', key: 'settings' },
  { prefix: '/bare-metal', key: 'reserved' },
  { prefix: '/notifications', key: 'reserved' },
  { prefix: '/audit', key: 'reserved' },
]

/** 当前路由应展开的 SubMenu keys（页面模板 2.0 §3 侧栏分组）。 */
export function openSubMenuKeysForPath(pathname: string): string[] {
  const hit = PATH_SUBMENU.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return hit ? [hit.key] : []
}
