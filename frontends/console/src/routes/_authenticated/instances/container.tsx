import { createFileRoute } from '@tanstack/react-router'
import { InstancesListPage } from './index'

export const Route = createFileRoute('/_authenticated/instances/container')({
  component: ContainerInstancesPage,
})

function ContainerInstancesPage() {
  return <InstancesListPage kindFilter="container" lockKind title="容器实例" subtitle="标准容器工作负载" />
}
