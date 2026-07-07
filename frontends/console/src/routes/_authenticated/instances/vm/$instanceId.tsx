import { createFileRoute } from '@tanstack/react-router'
import { InstanceDetailContent } from '../$instanceId'

export const Route = createFileRoute('/_authenticated/instances/vm/$instanceId')({
  component: VmInstanceDetailPage,
})

function VmInstanceDetailPage() {
  const { instanceId } = Route.useParams()
  return <InstanceDetailContent instanceId={instanceId} returnTo="/instances/vm" />
}
