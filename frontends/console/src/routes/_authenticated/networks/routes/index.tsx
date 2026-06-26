import { createFileRoute } from '@tanstack/react-router'
import { Form, Input, Select } from '@arco-design/web-react'
import { useState } from 'react'
import { SimpleResourceCrud } from '@/components/crud/SimpleResourceCrud'
import { coreApi } from '@/api/client'
import { newIdempotencyKey } from '@/lib/idempotency'
import { listOrThrow } from '@/lib/api-list'
import { formatDateTime } from '@/lib/format'

export const Route = createFileRoute('/_authenticated/networks/routes/')({
  component: NetworkRoutesPage,
})

function NetworkRoutesPage() {
  const [vpcId, setVpcId] = useState('')
  const [destinationCidr, setDestinationCidr] = useState('0.0.0.0/0')
  const [nextHopType, setNextHopType] = useState<'gateway' | 'instance' | 'nat'>('gateway')
  const [nextHopId, setNextHopId] = useState('')
  const [description, setDescription] = useState('')

  return (
    <SimpleResourceCrud
      title="路由"
      subtitle="VPC 路由表条目（无单条 GET 详情 API）"
      queryKey="network-routes"
      emptyDescription="暂无路由条目，点击右上角创建"
      list={() => listOrThrow(() => coreApi.GET('/networks/routes', { params: { query: { limit: 50 } } }))}
      onCreate={async () => {}}
      createForm={{
        content: (
          <Form layout="vertical">
            <Form.Item label="VPC ID" required>
              <Input value={vpcId} onChange={setVpcId} />
            </Form.Item>
            <Form.Item label="目标网段" required>
              <Input value={destinationCidr} onChange={setDestinationCidr} placeholder="0.0.0.0/0" />
            </Form.Item>
            <Form.Item label="下一跳类型" required>
              <Select value={nextHopType} onChange={setNextHopType}>
                <Select.Option value="gateway">gateway</Select.Option>
                <Select.Option value="instance">instance</Select.Option>
                <Select.Option value="nat">nat</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="下一跳 ID" required>
              <Input value={nextHopId} onChange={setNextHopId} />
            </Form.Item>
            <Form.Item label="描述">
              <Input value={description} onChange={setDescription} />
            </Form.Item>
          </Form>
        ),
        onSubmit: async () => {
          const { error } = await coreApi.POST('/networks/routes', {
            body: {
              vpc_id: vpcId,
              destination_cidr: destinationCidr,
              next_hop_type: nextHopType,
              next_hop_id: nextHopId,
              description: description || undefined,
              idempotency_key: newIdempotencyKey(),
            },
          })
          if (error) throw error
        },
        onReset: () => {
          setVpcId('')
          setDestinationCidr('0.0.0.0/0')
          setNextHopType('gateway')
          setNextHopId('')
          setDescription('')
        },
      }}
      columns={[
        { title: 'ID', dataIndex: 'id' },
        { title: '目标网段', dataIndex: 'destination_cidr' },
        { title: '下一跳类型', dataIndex: 'next_hop_type' },
        { title: '下一跳', dataIndex: 'next_hop_id' },
        { title: 'VPC', dataIndex: 'vpc_id' },
        { title: '创建时间', render: (_, r) => formatDateTime(r.created_at as string) },
      ]}
    />
  )
}
