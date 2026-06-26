import { createFileRoute } from '@tanstack/react-router'
import { Form, Input, Select } from '@arco-design/web-react'
import { useState } from 'react'
import { networkListenersTable, SimpleResourceCrud } from '@/components/crud/SimpleResourceCrud'
import { StatusTag } from '@/components/shell/StatusTag'
import { coreApi } from '@/api/client'
import { newIdempotencyKey } from '@/lib/idempotency'
import { listOrThrow } from '@/lib/api-list'
import { formatDateTime } from '@/lib/format'
import type { components } from '@/api/core-schema'

type LoadBalancerListener = components['schemas']['NetworkLoadBalancerListener']

export const Route = createFileRoute('/_authenticated/networks/load-balancers/')({
  component: LoadBalancersPage,
})

function parseListenersJson(value: string): LoadBalancerListener[] | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = JSON.parse(trimmed) as unknown
  if (!Array.isArray(parsed)) throw new Error('监听器必须是 JSON 数组')
  return parsed as LoadBalancerListener[]
}

function LoadBalancersPage() {
  const [name, setName] = useState('')
  const [vpcId, setVpcId] = useState('')
  const [subnetId, setSubnetId] = useState('')
  const [scheme, setScheme] = useState<'internal' | 'public'>('internal')
  const [listenersJson, setListenersJson] = useState('')

  return (
    <SimpleResourceCrud
      title="负载均衡"
      queryKey="network-lb"
      emptyDescription="暂无负载均衡，点击右上角创建"
      showState
      list={() => listOrThrow(() => coreApi.GET('/networks/load-balancers', { params: { query: { limit: 50 } } }))}
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
            <Form.Item label="Subnet ID">
              <Input value={subnetId} onChange={setSubnetId} />
            </Form.Item>
            <Form.Item label="类型">
              <Select value={scheme} onChange={setScheme}>
                <Select.Option value="internal">internal</Select.Option>
                <Select.Option value="public">public</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="监听器 JSON">
              <Input.TextArea
                value={listenersJson}
                onChange={setListenersJson}
                autoSize={{ minRows: 3, maxRows: 8 }}
                placeholder='[{"protocol":"tcp","port":80,"target_port":8080}]'
              />
            </Form.Item>
          </Form>
        ),
        onSubmit: async () => {
          const { error } = await coreApi.POST('/networks/load-balancers', {
            body: {
              name,
              vpc_id: vpcId,
              subnet_id: subnetId || undefined,
              scheme,
              listeners: parseListenersJson(listenersJson),
              idempotency_key: newIdempotencyKey(),
            },
          })
          if (error) throw error
        },
        onReset: () => {
          setName('')
          setVpcId('')
          setSubnetId('')
          setScheme('internal')
          setListenersJson('')
        },
      }}
      onDelete={async (id) => {
        const { error } = await coreApi.DELETE('/networks/load-balancers/{load_balancer_id}', {
          params: { path: { load_balancer_id: id } },
        })
        if (error) throw error
      }}
      detail={{
        fetch: async (id) => {
          const { data, error } = await coreApi.GET('/networks/load-balancers/{load_balancer_id}', {
            params: { path: { load_balancer_id: id } },
          })
          if (error) throw error
          return data as Record<string, unknown>
        },
        buildFields: (r) => [
          { label: 'ID', value: String(r.id) },
          { label: '名称', value: String(r.name) },
          { label: 'VPC', value: String(r.vpc_id) },
          { label: '子网', value: String(r.subnet_id ?? '—') },
          { label: '类型', value: String(r.scheme) },
          { label: 'VIP', value: String(r.vip ?? '—') },
          { label: '状态', value: <StatusTag status={r.state as string} /> },
          { label: '创建时间', value: formatDateTime(r.created_at as string) },
        ],
        extraContent: (r) => networkListenersTable(r.listeners as Record<string, unknown>[] | undefined),
      }}
    />
  )
}
