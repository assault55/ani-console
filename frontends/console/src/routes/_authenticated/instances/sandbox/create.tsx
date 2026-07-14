import { Button, Card } from '@arco-design/web-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/shell/AppShell'
import { InstanceCreateForm } from '../index'

export const Route = createFileRoute('/_authenticated/instances/sandbox/create')({
  component: SandboxInstanceCreatePage,
})

function SandboxInstanceCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <PageHeader
        title="创建 Sandbox 实例"
        subtitle="按页面分区填写运行时、会话时长与网络出口策略。"
        extra={
          <Button type="text" onClick={() => navigate({ to: '/instances/sandbox' })}>
            返回列表
          </Button>
        }
      />
      <Card>
        <InstanceCreateForm
          kindFilter="sandbox"
          lockKind
          onCancel={() => navigate({ to: '/instances/sandbox' })}
          onCreated={({ instanceId }) =>
            navigate(instanceId ? { to: '/instances/sandbox/$instanceId', params: { instanceId } } : { to: '/instances/sandbox' })
          }
        />
      </Card>
    </div>
  )
}
