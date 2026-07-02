import { createFileRoute } from '@tanstack/react-router'
import { InstancesListPage } from './index'

export const Route = createFileRoute('/_authenticated/instances/vm')({
  component: VmInstancesPage,
})

function VmInstancesPage() {
  return <InstancesListPage kindFilter="vm" lockKind title="VM 实例" subtitle="KubeVirt 虚拟机实例" />
}
