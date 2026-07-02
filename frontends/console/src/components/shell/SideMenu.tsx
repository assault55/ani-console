import { useEffect, useMemo, useState } from 'react'
import { Menu } from '@arco-design/web-react'
import {
  IconApps,
  IconCloud,
  IconDashboard,
  IconExperiment,
  IconFile,
  IconLock,
  IconNav,
  IconSafe,
  IconSettings,
  IconStorage,
} from '@arco-design/web-react/icon'
import { Link, useRouterState } from '@tanstack/react-router'
import { matchSideMenuKey, openSubMenuKeysForPath } from '@/lib/side-menu-match'

const menuItems = [
  { key: '/', label: '概览', icon: <IconDashboard /> },
  {
    key: 'compute',
    label: '算力与实例',
    icon: <IconCloud />,
    children: [
      { key: '/instances/container', label: '容器实例' },
      { key: '/instances/vm', label: 'VM 实例' },
      { key: '/instances/gpu', label: 'GPU 容器实例' },
      { key: '/instances/sandbox', label: 'Sandbox 实例' },
      { key: '/gpu-inventory', label: 'GPU 清单' },
      { key: '/sandbox-templates', label: 'Sandbox 模板' },
    ],
  },
  { key: '/k8s-clusters', label: 'K8s 集群', icon: <IconApps /> },
  {
    key: 'storage-network',
    label: '存储与网络',
    icon: <IconStorage />,
    children: [
      { key: '/volumes', label: '块存储' },
      { key: '/filesystems', label: '文件存储' },
      { key: '/objects', label: '对象存储' },
      { key: '/vector-stores', label: '向量存储' },
      { key: '/networks/vpcs', label: 'VPC' },
      { key: '/networks/subnets', label: '子网' },
      { key: '/networks/security-groups', label: '安全组' },
      { key: '/networks/load-balancers', label: '负载均衡' },
      { key: '/networks/routes', label: '路由' },
    ],
  },
  { key: '/registry', label: '镜像 Registry', icon: <IconFile /> },
  { key: '/observability', label: '监控与告警', icon: <IconExperiment /> },
  { key: '/usage', label: '用量', icon: <IconNav /> },
  {
    key: 'security',
    label: '安全',
    icon: <IconLock />,
    children: [
      { key: '/encryption', label: '加密密钥' },
      { key: '/secrets', label: '密钥管理' },
    ],
  },
  {
    key: 'settings',
    label: '设置',
    icon: <IconSettings />,
    children: [
      { key: '/settings', label: '通用设置' },
      { key: '/settings/api-keys', label: 'API Key' },
    ],
  },
  {
    key: 'reserved',
    label: '预留',
    icon: <IconSafe />,
    children: [
      { key: '/bare-metal', label: '裸金属' },
      { key: '/notifications', label: '通知' },
      { key: '/audit', label: '审计' },
    ],
  },
] as const

function flattenKeys(items: typeof menuItems, acc: string[] = []): string[] {
  for (const item of items) {
    if ('children' in item && item.children) {
      for (const child of item.children) acc.push(child.key)
    } else if (item.key.startsWith('/')) {
      acc.push(item.key)
    }
  }
  return acc
}

const routeKeys = flattenKeys(menuItems)

function MenuLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {label}
    </span>
  )
}

export function SideMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const selected = useMemo(() => matchSideMenuKey(pathname, routeKeys), [pathname])
  const routeOpenKeys = useMemo(() => openSubMenuKeysForPath(pathname), [pathname])
  const [openKeys, setOpenKeys] = useState<string[]>(routeOpenKeys)

  useEffect(() => {
    setOpenKeys((prev) => [...new Set([...prev, ...routeOpenKeys])])
  }, [routeOpenKeys])

  return (
    <Menu
      className="h-full border-none pt-2"
      selectedKeys={selected}
      openKeys={openKeys}
      onClickSubMenu={(_, keys) => setOpenKeys(keys as string[])}
      style={{ width: '100%' }}
    >
      {menuItems.map((item) => {
        if ('children' in item && item.children) {
          return (
            <Menu.SubMenu key={item.key} title={<MenuLabel icon={item.icon} label={item.label} />}>
              {item.children.map((child) => (
                <Menu.Item key={child.key}>
                  <Link to={child.key as string} className="block text-inherit no-underline">
                    {child.label}
                  </Link>
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          )
        }
        return (
          <Menu.Item key={item.key}>
            <Link to={item.key as string} className="block text-inherit no-underline">
              <MenuLabel icon={item.icon} label={item.label} />
            </Link>
          </Menu.Item>
        )
      })}
    </Menu>
  )
}
