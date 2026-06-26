import { createFileRoute } from '@tanstack/react-router'
import { Form, Input } from '@arco-design/web-react'
import { useState } from 'react'
import { networkRulesTable, SimpleResourceCrud } from '@/components/crud/SimpleResourceCrud'
import { StatusTag } from '@/components/shell/StatusTag'
import { coreApi } from '@/api/client'
import { newIdempotencyKey } from '@/lib/idempotency'
import { listOrThrow } from '@/lib/api-list'
import { formatDateTime } from '@/lib/format'
import type { components } from '@/api/core-schema'

type SecurityGroupRule = components['schemas']['NetworkSecurityGroupRule']

export const Route = createFileRoute('/_authenticated/networks/security-groups/')({
  component: SecurityGroupsPage,
})

function parseRulesJson(value: string): SecurityGroupRule[] | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = JSON.parse(trimmed) as unknown
  if (!Array.isArray(parsed)) throw new Error('规则必须是 JSON 数组')
  return parsed as SecurityGroupRule[]
}

function SecurityGroupsPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rulesJson, setRulesJson] = useState('')

  return (
    <SimpleResourceCrud
      title="安全组"
      queryKey="network-sg"
      emptyDescription="暂无安全组，点击右上角创建"
      showState
      list={() => listOrThrow(() => coreApi.GET('/networks/security-groups', { params: { query: { limit: 50 } } }))}
      onCreate={async () => {}}
      createForm={{
        content: (
          <Form layout="vertical">
            <Form.Item label="名称" required>
              <Input value={name} onChange={setName} />
            </Form.Item>
            <Form.Item label="描述">
              <Input value={description} onChange={setDescription} />
            </Form.Item>
            <Form.Item label="规则 JSON">
              <Input.TextArea
                value={rulesJson}
                onChange={setRulesJson}
                autoSize={{ minRows: 3, maxRows: 8 }}
                placeholder='[{"direction":"ingress","protocol":"tcp","port_range":"80","cidr":"0.0.0.0/0","action":"allow"}]'
              />
            </Form.Item>
          </Form>
        ),
        onSubmit: async () => {
          const { error } = await coreApi.POST('/networks/security-groups', {
            body: {
              name,
              description: description || undefined,
              rules: parseRulesJson(rulesJson),
              idempotency_key: newIdempotencyKey(),
            },
          })
          if (error) throw error
        },
        onReset: () => {
          setName('')
          setDescription('')
          setRulesJson('')
        },
      }}
      onDelete={async (id) => {
        const { error } = await coreApi.DELETE('/networks/security-groups/{security_group_id}', {
          params: { path: { security_group_id: id } },
        })
        if (error) throw error
      }}
      detail={{
        fetch: async (id) => {
          const { data, error } = await coreApi.GET('/networks/security-groups/{security_group_id}', {
            params: { path: { security_group_id: id } },
          })
          if (error) throw error
          return data as Record<string, unknown>
        },
        buildFields: (r) => [
          { label: 'ID', value: String(r.id) },
          { label: '名称', value: String(r.name) },
          { label: '描述', value: String(r.description ?? '—') },
          { label: '状态', value: <StatusTag status={r.state as string} /> },
          { label: '创建时间', value: formatDateTime(r.created_at as string) },
        ],
        extraContent: (r) => networkRulesTable(r.rules as Record<string, unknown>[] | undefined),
      }}
    />
  )
}
