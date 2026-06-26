import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, InputNumber, Modal, Select, Switch } from '@arco-design/web-react'
import { useState } from 'react'
import { coreApi } from '@/api/client'
import { newIdempotencyKey } from '@/lib/idempotency'
import { PageHeader } from '@/components/shell/AppShell'
import { CursorTable } from '@/components/tables/CursorTable'
import { StatusTag } from '@/components/shell/StatusTag'
import { formatDateTime } from '@/lib/format'
import { showApiError } from '@/api/helpers'
import { AsyncTaskPoller } from '@/components/feedback/AsyncTaskPoller'
import type { components } from '@/api/core-schema'

export const Route = createFileRoute('/_authenticated/instances/')({
  component: InstancesListPage,
})

type Instance = components['schemas']['InstanceRecord']
type CreateInstanceRequest = components['schemas']['CreateInstanceRequest']
type InstanceKind = CreateInstanceRequest['kind']

type InstanceFormState = {
  name: string
  kind: InstanceKind
  image: string
  cpu: string
  memory: string
  auto_start: boolean
  boot_image: string
  ssh_username: string
  ssh_key_ref: string
  termination_protection: boolean
  gpu_vendor: string
  gpu_model: string
  gpu_count: number
  replicas: number
  sandbox_runtime_class: string
  sandbox_session_timeout: string
  sandbox_network_egress_policy: components['schemas']['SandboxNetworkEgressPolicy']
}

const defaultInstanceForm: InstanceFormState = {
  name: '',
  kind: 'container',
  image: '',
  cpu: '2',
  memory: '4Gi',
  auto_start: true,
  boot_image: '',
  ssh_username: 'ubuntu',
  ssh_key_ref: '',
  termination_protection: false,
  gpu_vendor: '',
  gpu_model: '',
  gpu_count: 1,
  replicas: 1,
  sandbox_runtime_class: 'sandbox-kata',
  sandbox_session_timeout: '30m',
  sandbox_network_egress_policy: 'deny_all',
}

function optionalTrimmed(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function buildCreateInstanceBody(form: InstanceFormState): CreateInstanceRequest {
  const body: CreateInstanceRequest = {
    idempotency_key: newIdempotencyKey(),
    name: form.name.trim(),
    kind: form.kind,
    instance_type: form.kind,
    cpu: optionalTrimmed(form.cpu),
    memory: optionalTrimmed(form.memory),
    auto_start: form.auto_start,
    ssh_username: form.kind === 'vm' ? optionalTrimmed(form.ssh_username) ?? null : null,
    termination_protection: form.termination_protection,
    replicas: form.replicas,
  }

  if (form.kind === 'container' || form.kind === 'gpu_container') {
    body.image = optionalTrimmed(form.image) ?? null
  }

  if (form.kind === 'vm') {
    body.boot_image = optionalTrimmed(form.boot_image) ?? null
    body.ssh_key_ref = optionalTrimmed(form.ssh_key_ref) ?? null
  }

  if (form.kind === 'gpu_container') {
    body.gpu = {
      vendor: optionalTrimmed(form.gpu_vendor),
      model: optionalTrimmed(form.gpu_model),
      count: form.gpu_count,
    }
  }

  if (form.kind === 'sandbox') {
    body.sandbox_config = {
      runtime_class: form.sandbox_runtime_class,
      session_timeout: form.sandbox_session_timeout,
      network_egress_policy: form.sandbox_network_egress_policy,
    }
  }

  return body
}

function InstancesListPage() {
  const qc = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [form, setForm] = useState<InstanceFormState>(defaultInstanceForm)

  const { data, isLoading, error } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/instances', { params: { query: { limit: 50 } } })
      if (error) throw error
      return data
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      const { error, response } = await coreApi.POST('/instances', { body: buildCreateInstanceBody(form) })
      if (error) throw error
      const loc = response.headers.get('Location')
      const tid = loc?.match(/tasks\/([^/]+)/)?.[1]
      if (tid) setTaskId(tid)
    },
    onSuccess: () => {
      setVisible(false)
      setForm(defaultInstanceForm)
      qc.invalidateQueries({ queryKey: ['instances'] })
    },
    onError: (e) => showApiError(e),
  })

  const items = (data?.items ?? []) as Instance[]

  return (
    <div className="space-y-4">
      <PageHeader
        title="实例"
        subtitle="VM / 容器 / GPU 容器 / Sandbox"
        extra={
          <Button type="primary" onClick={() => setVisible(true)}>
            创建实例
          </Button>
        }
      />
      {taskId ? <AsyncTaskPoller taskId={taskId} onComplete={() => setTaskId(null)} /> : null}
      <CursorTable<Instance>
        columns={[
          {
            title: '名称',
            render: (_, r) => (
              <Link to="/instances/$instanceId" params={{ instanceId: r.id }} className="text-inherit">
                {r.name ?? r.id}
              </Link>
            ),
          },
          { title: '类型', dataIndex: 'kind' },
          { title: '状态', render: (_, r) => <StatusTag status={r.state} /> },
          { title: '创建时间', render: (_, r) => formatDateTime(r.created_at) },
        ]}
        data={{ items, next_cursor: data?.next_cursor }}
        loading={isLoading}
        error={error}
        rowKey="id"
        emptyDescription="暂无实例，点击右上角创建"
      />
      <Modal
        visible={visible}
        title="创建实例"
        onCancel={() => setVisible(false)}
        onOk={() => create.mutateAsync()}
        confirmLoading={create.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          </Form.Item>
          <Form.Item label="类型">
            <Select value={form.kind} onChange={(v) => setForm((f) => ({ ...f, kind: v }))}>
              <Select.Option value="vm">VM</Select.Option>
              <Select.Option value="container">容器</Select.Option>
              <Select.Option value="gpu_container">GPU 容器</Select.Option>
              <Select.Option value="sandbox">Sandbox</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="CPU">
            <Input value={form.cpu} onChange={(v) => setForm((f) => ({ ...f, cpu: v }))} placeholder="2" />
          </Form.Item>
          <Form.Item label="内存">
            <Input value={form.memory} onChange={(v) => setForm((f) => ({ ...f, memory: v }))} placeholder="4Gi" />
          </Form.Item>
          {(form.kind === 'container' || form.kind === 'gpu_container') ? (
            <>
              <Form.Item label="镜像" required>
                <Input value={form.image} onChange={(v) => setForm((f) => ({ ...f, image: v }))} />
              </Form.Item>
              <Form.Item label="副本数">
                <InputNumber
                  value={form.replicas}
                  min={1}
                  precision={0}
                  onChange={(v) => setForm((f) => ({ ...f, replicas: Number(v ?? 1) }))}
                />
              </Form.Item>
            </>
          ) : null}
          {form.kind === 'vm' ? (
            <>
              <Form.Item label="Boot Image" required>
                <Input value={form.boot_image} onChange={(v) => setForm((f) => ({ ...f, boot_image: v }))} />
              </Form.Item>
              <Form.Item label="SSH 用户名">
                <Input value={form.ssh_username} onChange={(v) => setForm((f) => ({ ...f, ssh_username: v }))} />
              </Form.Item>
              <Form.Item label="SSH Key Ref">
                <Input value={form.ssh_key_ref} onChange={(v) => setForm((f) => ({ ...f, ssh_key_ref: v }))} />
              </Form.Item>
            </>
          ) : null}
          {form.kind === 'gpu_container' ? (
            <>
              <Form.Item label="GPU 厂商">
                <Input value={form.gpu_vendor} onChange={(v) => setForm((f) => ({ ...f, gpu_vendor: v }))} />
              </Form.Item>
              <Form.Item label="GPU 型号">
                <Input value={form.gpu_model} onChange={(v) => setForm((f) => ({ ...f, gpu_model: v }))} />
              </Form.Item>
              <Form.Item label="GPU 数量">
                <InputNumber
                  value={form.gpu_count}
                  min={1}
                  precision={0}
                  onChange={(v) => setForm((f) => ({ ...f, gpu_count: Number(v ?? 1) }))}
                />
              </Form.Item>
            </>
          ) : null}
          {form.kind === 'sandbox' ? (
            <>
              <Form.Item label="Runtime Class" required>
                <Input
                  value={form.sandbox_runtime_class}
                  onChange={(v) => setForm((f) => ({ ...f, sandbox_runtime_class: v }))}
                />
              </Form.Item>
              <Form.Item label="Session Timeout" required>
                <Input
                  value={form.sandbox_session_timeout}
                  onChange={(v) => setForm((f) => ({ ...f, sandbox_session_timeout: v }))}
                  placeholder="30m"
                />
              </Form.Item>
              <Form.Item label="网络出口策略">
                <Select
                  value={form.sandbox_network_egress_policy}
                  onChange={(v) => setForm((f) => ({ ...f, sandbox_network_egress_policy: v }))}
                >
                  <Select.Option value="deny_all">deny_all</Select.Option>
                  <Select.Option value="allowlist">allowlist</Select.Option>
                  <Select.Option value="internet">internet</Select.Option>
                </Select>
              </Form.Item>
            </>
          ) : null}
          <Form.Item label="自动启动">
            <Switch checked={form.auto_start} onChange={(v) => setForm((f) => ({ ...f, auto_start: v }))} />
          </Form.Item>
          <Form.Item label="终止保护">
            <Switch
              checked={form.termination_protection}
              onChange={(v) => setForm((f) => ({ ...f, termination_protection: v }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
