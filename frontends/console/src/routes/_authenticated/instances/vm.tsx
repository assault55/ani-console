import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { InstancesListPage } from './index'

export const Route = createFileRoute('/_authenticated/instances/vm')({
  component: VmInstancesPage,
})

function VmInstancesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (pathname !== '/instances/vm') return <Outlet />
  return <InstancesListPage kindFilter="vm" lockKind title="VM 实例" subtitle="KubeVirt 虚拟机实例" />
}
