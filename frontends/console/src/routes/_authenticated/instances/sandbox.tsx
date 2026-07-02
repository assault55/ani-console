import { createFileRoute } from '@tanstack/react-router'
import { InstancesListPage } from './index'

export const Route = createFileRoute('/_authenticated/instances/sandbox')({
  component: SandboxInstancesPage,
})

function SandboxInstancesPage() {
  return <InstancesListPage kindFilter="sandbox" lockKind title="Sandbox 实例" subtitle="隔离会话与出口策略" />
}
