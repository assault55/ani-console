import { createFileRoute } from '@tanstack/react-router'
import { InstanceDetailContent } from '../$instanceId'

export const Route = createFileRoute('/_authenticated/instances/container/$instanceId')({
  component: ContainerInstanceDetailPage,
})

function ContainerInstanceDetailPage() {
  const { instanceId } = Route.useParams()
  return <InstanceDetailContent instanceId={instanceId} returnTo="/instances/container" />
}
