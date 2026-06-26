import { createFileRoute } from '@tanstack/react-router'
import { Form, Input } from '@arco-design/web-react'
import { useState } from 'react'
import { SimpleResourceCrud } from '@/components/crud/SimpleResourceCrud'
import { StatusTag } from '@/components/shell/StatusTag'
import { coreApi } from '@/api/client'
import { newIdempotencyKey } from '@/lib/idempotency'
import { listOrThrow } from '@/lib/api-list'
import { formatDateTime } from '@/lib/format'

export const Route = createFileRoute('/_authenticated/networks/subnets/')({
  component: SubnetsPage,
})

function SubnetsPage() {
  const [name, setName] = useState('')
  const [vpcId, setVpcId] = useState('')
  const [cidr, setCidr] = useState('10.0.1.0/24')
  const [gateway, setGateway] = useState('')

  return (
    <SimpleResourceCrud
      title="子网"
      queryKey="network-subnets"
      emptyDescription="暂无子网，点击右上角创建"
      showState
      list={() => listOrThrow(() => coreApi.GET('/networks/subnets', { params: { query: { limit: 50 } } }))}
      onCreate={async () => {}}
      createForm={{
        content: (
          <Form layout="vertical">
            <Form.Item label="名称" required>
              <Input value={name} onChange={setName} />
            </Form.Item>
            <Form.Item label="VPC ID" required>
              <Input value={vpcId} onChange={setVpcId} />
            </Form.Item>
            <Form.Item label="CIDR">
              <Input value={cidr} onChange={setCidr} placeholder="10.0.1.0/24" />
            </Form.Item>
            <Form.Item label="网关">
              <Input value={gateway} onChange={setGateway} placeholder="可选" />
            </Form.Item>
          </Form>
        ),
        onSubmit: async () => {
          const { error } = await coreApi.POST('/networks/subnets', {
            body: {
              name,
              vpc_id: vpcId,
              cidr,
              gateway: gateway || undefined,
              idempotency_key: newIdempotencyKey(),
            },
          })
          if (error) throw error
        },
        onReset: () => {
          setName('')
          setVpcId('')
          setCidr('10.0.1.0/24')
          setGateway('')
        },
      }}
      onDelete={async (id) => {
        const { error } = await coreApi.DELETE('/networks/subnets/{subnet_id}', { params: { path: { subnet_id: id } } })
        if (error) throw error
      }}
      detail={{
        fetch: async (id) => {
          const { data, error } = await coreApi.GET('/networks/subnets/{subnet_id}', {
            params: { path: { subnet_id: id } },
          })
          if (error) throw error
          return data as Record<string, unknown>
        },
        buildFields: (r) => [
          { label: 'ID', value: String(r.id) },
          { label: '名称', value: String(r.name) },
          { label: 'VPC', value: String(r.vpc_id) },
          { label: 'CIDR', value: String(r.cidr) },
          { label: '网关', value: String(r.gateway ?? '—') },
          { label: '状态', value: <StatusTag status={r.state as string} /> },
          { label: '创建时间', value: formatDateTime(r.created_at as string) },
        ],
      }}
    />
  )
}
