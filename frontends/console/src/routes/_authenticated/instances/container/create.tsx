import { Button, Card } from '@arco-design/web-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/shell/AppShell'
import { InstanceCreateForm } from '../index'

export const Route = createFileRoute('/_authenticated/instances/container/create')({
  component: ContainerInstanceCreatePage,
})

function ContainerInstanceCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <PageHeader
        title="创建容器实例"
        subtitle="按页面分区填写镜像、规格与网络配置，避免在弹窗中堆叠过多信息。"
        extra={
          <Button type="text" onClick={() => navigate({ to: '/instances/container' })}>
            返回列表
          </Button>
        }
      />
      <Card>
        <InstanceCreateForm
          kindFilter="container"
          lockKind
          onCancel={() => navigate({ to: '/instances/container' })}
          onCreated={() => navigate({ to: '/instances/container' })}
        />
      </Card>
    </div>
  )
}
