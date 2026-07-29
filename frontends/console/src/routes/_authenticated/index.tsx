import { createFileRoute, Link } from '@tanstack/react-router'
import { Button, Card, Empty, Grid, Spin, Table } from '@arco-design/web-react'
import { useQuery } from '@tanstack/react-query'
import { coreApi } from '@/api/client'
import { CoreLineBarChart } from '@/components/charts/CoreLineBarChart'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { PageHeader } from '@/components/shell/AppShell'
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert'
import { StatusTag } from '@/components/shell/StatusTag'
import { formatDateTime } from '@/lib/format'
import { aggregateUsageByPeriod } from '@/lib/metering'
import type { components } from '@/api/core-schema'
import { AliIcon } from '@/components/icons/AliIcon'



type GpuOccupancy = components['schemas']['GPUOccupancyStats']
type InstanceOperation = components['schemas']['InstanceOperation']

/** Arco 品牌色，与 Token 主色对齐 */
const CHART_COLOR = '#0079D3'

function gpuOccupancyExtra(o: GpuOccupancy | undefined): string {
  if (!o) return '已用 0 / 可用 0'
  const fault = o.fault > 0 ? ` / 故障 ${o.fault}` : ''
  return `已用 ${o.in_use} / 可用 ${o.available}${fault}`
}

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})

function DashboardPage() {
  const instances = useQuery({
    queryKey: ['dashboard', 'instances'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/instances', { params: { query: { limit: 5 } } })
      if (error) throw error
      return data
    },
  })
  const gpu = useQuery({
    queryKey: ['dashboard', 'gpu'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/gpu-inventory/occupancy')
      if (error) throw error
      return data
    },
  })
  const alerts = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/observability/alert-rules', { params: { query: { limit: 100 } } })
      if (error) throw error
      return data
    },
  })
  const usage = useQuery({
    queryKey: ['dashboard', 'usage'],
    queryFn: async () => {
      const end = new Date()
      const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000)
      const { data, error } = await coreApi.GET('/metering/usage', {
        params: {
          query: {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            group_by: 'day',
          },
        },
      })
      if (error) throw error
      return data
    },
  })

  const metricsLoading = instances.isLoading || gpu.isLoading
  const metricsError = instances.error || gpu.error
  const occupancy = gpu.data
  const alertTotal = alerts.data?.total
  const usageRaw = usage.data?.items ?? []
  const usageItems = aggregateUsageByPeriod(usageRaw)
  const usageSum = usageItems.reduce((acc, i) => acc + i.total_quantity, 0)
  const instanceItems = instances.data?.items ?? []

  const chartOption = {
    color: [CHART_COLOR],
    grid: { left: 40, right: 16, top: 24, bottom: 32 },
    xAxis: { type: 'category' as const, data: usageItems.map((i) => i.period ?? '') },
    yAxis: { type: 'value' as const },
    series: [{ type: 'line' as const, smooth: true, data: usageItems.map((i) => i.total_quantity ?? 0) }],
  }

  return (
    <div className="space-y-5">
      <PageHeader title="概览" subtitle="租户资源与健康摘要" />
      {metricsError ? <ApiErrorAlert error={metricsError} title="核心指标加载失败" /> : null}

      {metricsLoading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : (
        <Grid.Row gutter={16}>
          <Grid.Col xs={24} sm={12} md={6}>
            <MetricCard
              title="GPU 总量"
              value={occupancy?.total ?? '—'}
              extra={gpuOccupancyExtra(occupancy)}
            />
          </Grid.Col>
          <Grid.Col xs={24} sm={12} md={6}>
            <MetricCard
              title="实例"
              value={instances.data?.total ?? instanceItems.length}
            />
          </Grid.Col>
          <Grid.Col xs={24} sm={12} md={6}>
            <MetricCard title="告警规则" value={alerts.isError ? '—' : (alertTotal ?? 0)} />
          </Grid.Col>
          <Grid.Col xs={24} sm={12} md={6}>
            <MetricCard title="近 7 日总用量" value={usage.isError ? '—' : usageSum} />
          </Grid.Col>
        </Grid.Row>
      )}

      <Grid.Row gutter={16}>
        <Grid.Col xs={24} lg={14}>
          <Card title="近 7 日用量趋势">
            {usage.isLoading ? (
              <div className="flex justify-center py-16">
                <Spin />
              </div>
            ) : usage.isError ? (
              <ApiErrorAlert error={usage.error} title="用量数据加载失败" />
            ) : usageItems.length > 0 ? (
              <CoreLineBarChart option={chartOption} className="h-[280px] w-full" />
            ) : (
              <Empty description="暂无用量数据" />
            )}
          </Card>
        </Grid.Col>
        <Grid.Col xs={24} lg={10}>
          <Card
            title="最近实例"
            extra={
              <Link to="/instances">
                <Button type="text" size="small">
                  查看全部
                </Button>
              </Link>
            }
          >
            {instances.isLoading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : instanceItems.length === 0 ? (
              <Empty description="暂无实例" />
            ) : (
              <Table
                data={instanceItems}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '名称',
                    render: (_, r) => (
                      <Link to="/instances/$instanceId" params={{ instanceId: r.id }} className="text-inherit">
                        {r.name}
                      </Link>
                    ),
                  },
                  { title: '状态', render: (_, r) => <StatusTag status={r.state ?? (r as { status?: string }).status} /> },
                  { title: '创建', render: (_, r) => formatDateTime(r.created_at) },
                ]}
              />
            )}
          </Card>
          <RecentOperations instanceId={instanceItems[0]?.id} />
        </Grid.Col>
      </Grid.Row>
    </div>
  )
}

function RecentOperations({ instanceId }: { instanceId?: string }) {
  const ops = useQuery({
    queryKey: ['dashboard-ops', instanceId],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/instances/{instance_id}/operations', {
        params: { path: { instance_id: instanceId! }, query: { limit: 5 } },
      })
      if (error) throw error
      return data
    },
    enabled: !!instanceId,
  })

  if (!instanceId) return null
  const items = (ops.data?.items ?? []) as InstanceOperation[]

  return (
    <Card title="最近操作" className="mt-4">
      {ops.isLoading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : ops.isError ? (
        <ApiErrorAlert error={ops.error} title="操作记录加载失败" />
      ) : items.length === 0 ? (
        <Empty description="暂无操作记录" />
      ) : (
        <Table
          data={items}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '操作', dataIndex: 'operation' },
            { title: '状态', render: (_, r) => <StatusTag status={r.status} /> },
            {
              title: '',
              render: (_, r) => (
                <Link to="/instance-operations/$operationId" params={{ operationId: r.id }}>
                  <Button type="text" size="small">
                    详情
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      )}
    </Card>
  )
}
