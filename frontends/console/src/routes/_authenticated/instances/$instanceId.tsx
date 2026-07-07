import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Table,
} from '@arco-design/web-react'
import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { coreApi } from '@/api/client'
import { PageHeader } from '@/components/shell/AppShell'
import { StatusTag } from '@/components/shell/StatusTag'
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert'
import { InstanceLogsPanel } from '@/components/instances/InstanceLogsPanel'
import { formatDateTime } from '@/lib/format'
import { showApiError } from '@/api/helpers'
import { newIdempotencyKey } from '@/lib/idempotency'
import { getInstanceDisplayIp, getInstanceNetworkValue } from '@/lib/instance-network'
import type { components } from '@/api/core-schema'

export const Route = createFileRoute('/_authenticated/instances/$instanceId')({
  component: InstanceDetailPage,
})

const INSTANCE_DETAIL_POLL_MS = 3000

function getErrorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return ''
}

function TabQueryBody<T>({
  query,
  emptyDescription,
  children,
}: {
  query: UseQueryResult<T>
  emptyDescription: string
  children: (data: T) => React.ReactNode
}) {
  if (query.isFetching && !query.data) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    )
  }
  if (query.isError) return <ApiErrorAlert error={query.error} />
  if (!query.data) return <Empty description={emptyDescription} />
  return <>{children(query.data)}</>
}

function InstanceDetailPage() {
  const { instanceId } = Route.useParams()
  return <InstanceDetailContent instanceId={instanceId} returnTo="/instances" />
}

export function InstanceDetailContent({ instanceId, returnTo }: { instanceId: string; returnTo: string }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [consoleVisible, setConsoleVisible] = useState(false)
  const [consoleProtocol, setConsoleProtocol] =
    useState<components['schemas']['CreateInstanceConsoleSessionRequest']['protocol']>('novnc')
  const [execVisible, setExecVisible] = useState(false)
  const [execContainer, setExecContainer] = useState('')
  const [execCommand, setExecCommand] = useState('/bin/sh')
  const [execTty, setExecTty] = useState(true)
  const [execRows, setExecRows] = useState(24)
  const [execCols, setExecCols] = useState(80)
  const [consoleUnavailableReason, setConsoleUnavailableReason] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const detail = useQuery({
    queryKey: ['instance', instanceId],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/instances/{instance_id}', {
        params: { path: { instance_id: instanceId } },
      })
      if (error) throw error
      return data
    },
    refetchInterval: INSTANCE_DETAIL_POLL_MS,
    refetchIntervalInBackground: false,
  })

  const events = useQuery({
    queryKey: ['instance', instanceId, 'events'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/instances/{instance_id}/events', {
        params: { path: { instance_id: instanceId }, query: { limit: 50 } },
      })
      if (error) throw error
      return data
    },
    enabled: false,
  })

  const metrics = useQuery({
    queryKey: ['instance', instanceId, 'metrics'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/instances/{instance_id}/metrics', {
        params: { path: { instance_id: instanceId } },
      })
      if (error) throw error
      return data
    },
    enabled: false,
  })

  const security = useQuery({
    queryKey: ['instance', instanceId, 'security'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/instances/{instance_id}/security-events', {
        params: { path: { instance_id: instanceId }, query: { limit: 50 } },
      })
      if (error) throw error
      return data
    },
    enabled: false,
  })

  const lifecycle = useMutation({
    mutationFn: async (action: 'start' | 'stop' | 'restart' | 'delete') => {
      const { error } = await coreApi.POST('/instances/{instance_id}/lifecycle', {
        params: { path: { instance_id: instanceId } },
        body: { action, idempotency_key: newIdempotencyKey() },
      })
      if (error) throw error
      return action
    },
    onSuccess: (action) => {
      if (action === 'delete') {
        Message.success('实例已删除')
        qc.invalidateQueries({ queryKey: ['instances'] })
        navigate({ to: returnTo })
        return
      }
      qc.invalidateQueries({ queryKey: ['instance', instanceId] })
    },
    onError: (e) => showApiError(e),
  })

  const openConsole = useMutation({
    mutationFn: async () => {
      const { data, error } = await coreApi.POST('/instances/{instance_id}/console', {
        params: { path: { instance_id: instanceId } },
        body: { protocol: consoleProtocol },
      })
      if (error) throw error
      if (data?.url) window.open(data.url, '_blank')
    },
    onSuccess: () => setConsoleVisible(false),
    onError: (e) => {
      const message = getErrorText(e)
      if (message.includes('/vnc') && message.includes('HTTP 406')) {
        setConsoleUnavailableReason('当前集群/网关链路未正确支持 KubeVirt Console/VNC 通道（HTTP 406）')
        setConsoleVisible(false)
        Message.error('当前环境不支持 VNC 表示格式，请改用 serial 或 console 协议后重试。')
        return
      }
      showApiError(e)
    },
  })

  const openExec = useMutation({
    mutationFn: async () => {
      const command = execCommand
        .split('\n')
        .map((part) => part.trim())
        .filter(Boolean)
      const { data, error } = await coreApi.POST('/instances/{instance_id}/exec', {
        params: { path: { instance_id: instanceId } },
        body: {
          idempotency_key: newIdempotencyKey(),
          container: execContainer.trim() || undefined,
          command: command.length ? command : ['/bin/sh'],
          tty: execTty,
          rows: execRows,
          cols: execCols,
        },
      })
      if (error) throw error
      if (data?.ws_url) window.open(data.ws_url, '_blank')
    },
    onSuccess: () => setExecVisible(false),
    onError: (e) => showApiError(e),
  })

  const confirmDelete = () => {
    Modal.confirm({
      title: '删除实例',
      content: '删除后实例资源将不可恢复，确认继续？',
      okButtonProps: { status: 'danger' },
      onOk: () => lifecycle.mutateAsync('delete'),
    })
  }

  if (detail.isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader title="实例详情" subtitle="加载中…" />
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      </div>
    )
  }

  if (detail.error) return <ApiErrorAlert error={detail.error} />

  const inst = detail.data
  const isVmInstance = inst?.kind === 'vm'

  return (
    <div className="space-y-5">
      <PageHeader
        title={inst?.name ?? instanceId}
        subtitle={`实例详情 · ${inst?.kind ?? ''}`}
        extra={
          <Space wrap>
            {isVmInstance ? (
              <Button
                type="primary"
                loading={openConsole.isPending}
                disabled={Boolean(consoleUnavailableReason)}
                onClick={() => setConsoleVisible(true)}
              >
                {consoleUnavailableReason ? '控制台（不可用）' : '控制台'}
              </Button>
            ) : null}
            <Button type="outline" loading={openExec.isPending} onClick={() => setExecVisible(true)}>
              终端
            </Button>
            <Button type="outline" onClick={() => lifecycle.mutateAsync('start')}>
              启动
            </Button>
            <Button type="outline" onClick={() => lifecycle.mutateAsync('stop')}>
              停止
            </Button>
            <Button type="outline" status="danger" onClick={confirmDelete}>
              删除
            </Button>
            <Button type="text" onClick={() => navigate({ to: returnTo })}>
              返回列表
            </Button>
          </Space>
        }
      />
      {isVmInstance && consoleUnavailableReason ? (
        <Card>
          <div className="text-[var(--color-text-2)]">{consoleUnavailableReason}</div>
        </Card>
      ) : null}
      <Card>
        <Descriptions
          column={{ xs: 1, sm: 2, md: 3 }}
          data={[
            { label: 'ID', value: inst?.id },
            { label: '类型', value: inst?.kind },
            { label: '状态', value: <StatusTag status={inst?.state} /> },
            { label: '创建', value: formatDateTime(inst?.created_at) },
            { label: '更新', value: formatDateTime(inst?.updated_at) },
          ]}
        />
      </Card>
      <Tabs
        activeTab={activeTab}
        onChange={(key) => {
          setActiveTab(key)
          if (key === 'events') events.refetch()
          if (key === 'metrics') metrics.refetch()
          if (key === 'security') security.refetch()
        }}
      >
        <Tabs.TabPane key="overview" title="概览">
          <Descriptions
            column={1}
            data={[
              { label: '节点', value: inst?.node_name ?? '—' },
              { label: 'VPC', value: getInstanceNetworkValue(inst, 'vpc_id') },
              { label: '子网', value: getInstanceNetworkValue(inst, 'subnet_id') },
              { label: '内网 IP', value: getInstanceDisplayIp(inst) },
              { label: '终止保护', value: inst?.termination_protection ? '已开启' : '未开启' },
              { label: '状态说明', value: inst?.state_message ?? '—' },
            ]}
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="logs" title="日志">
          <InstanceLogsPanel instanceId={instanceId} active={activeTab === 'logs'} />
        </Tabs.TabPane>
        <Tabs.TabPane key="events" title="事件">
          <TabQueryBody query={events} emptyDescription="暂无事件">
            {(data) => {
              const items = (data as { items?: Record<string, unknown>[] })?.items ?? []
              return items.length === 0 ? (
                <Empty description="暂无事件" />
              ) : (
                <Table data={items} rowKey="id" pagination={false} />
              )
            }}
          </TabQueryBody>
        </Tabs.TabPane>
        <Tabs.TabPane key="metrics" title="指标">
          <TabQueryBody query={metrics} emptyDescription="暂无指标">
            {(data) => (
              <pre className="overflow-auto rounded bg-[var(--color-fill-2)] p-3 text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </TabQueryBody>
        </Tabs.TabPane>
        <Tabs.TabPane key="security" title="安全事件">
          <TabQueryBody query={security} emptyDescription="暂无安全事件">
            {(data) => {
              const items = (data as { items?: Record<string, unknown>[] })?.items ?? []
              return items.length === 0 ? (
                <Empty description="暂无安全事件" />
              ) : (
                <Table data={items} rowKey="id" pagination={false} />
              )
            }}
          </TabQueryBody>
        </Tabs.TabPane>
        <Tabs.TabPane key="ops" title="操作历史">
          <Link to="/instances/$instanceId/operations" params={{ instanceId }}>
            <Button type="outline">查看操作历史</Button>
          </Link>
        </Tabs.TabPane>
      </Tabs>
      {isVmInstance ? (
        <Modal
          visible={consoleVisible}
          title="打开控制台"
          onCancel={() => setConsoleVisible(false)}
          onOk={() => openConsole.mutateAsync()}
          confirmLoading={openConsole.isPending}
        >
          <Form layout="vertical">
            <Form.Item label="协议" required>
              <Select value={consoleProtocol} onChange={setConsoleProtocol}>
                <Select.Option value="console">console</Select.Option>
                <Select.Option value="vnc">vnc</Select.Option>
                <Select.Option value="novnc">novnc</Select.Option>
                <Select.Option value="serial">serial</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      ) : null}
      <Modal
        visible={execVisible}
        title="打开终端"
        onCancel={() => setExecVisible(false)}
        onOk={() => openExec.mutateAsync()}
        confirmLoading={openExec.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="Container">
            <Input value={execContainer} onChange={setExecContainer} placeholder="可选" />
          </Form.Item>
          <Form.Item label="Command" required>
            <Input.TextArea
              value={execCommand}
              onChange={setExecCommand}
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="/bin/sh"
            />
          </Form.Item>
          <Form.Item label="TTY">
            <Switch checked={execTty} onChange={setExecTty} />
          </Form.Item>
          <Form.Item label="Rows">
            <InputNumber value={execRows} min={1} precision={0} onChange={(value) => setExecRows(Number(value ?? 24))} />
          </Form.Item>
          <Form.Item label="Cols">
            <InputNumber value={execCols} min={1} precision={0} onChange={(value) => setExecCols(Number(value ?? 80))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
