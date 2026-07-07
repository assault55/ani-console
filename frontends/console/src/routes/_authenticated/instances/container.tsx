import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { InstancesListPage } from './index'

export const Route = createFileRoute('/_authenticated/instances/container')({
  component: ContainerInstancesPage,
})

function ContainerInstancesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (pathname !== '/instances/container') return <Outlet />
  return <InstancesListPage kindFilter="container" lockKind title="容器实例" subtitle="标准容器工作负载" />
}
