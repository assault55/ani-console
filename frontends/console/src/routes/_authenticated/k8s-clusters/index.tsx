import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Tabs,
} from '@arco-design/web-react'
import { useState } from 'react'
import { coreApi } from '@/api/client'
import { PageHeader } from '@/components/shell/AppShell'
import { StatusTag } from '@/components/shell/StatusTag'
import { CursorTable } from '@/components/tables/CursorTable'
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert'
import { newIdempotencyKey } from '@/lib/idempotency'
import { showApiError } from '@/api/helpers'
import { AsyncTaskPoller } from '@/components/feedback/AsyncTaskPoller'
import { listOrThrow } from '@/lib/api-list'
import { formatDateTime } from '@/lib/format'
import type { components } from '@/api/core-schema'

type Cluster = components['schemas']['K8sCluster']
type NodePool = components['schemas']['K8sClusterNodePool']
type NodePoolGPU = components['schemas']['K8sClusterNodePoolGPU']
type ProxyMethod = components['schemas']['K8sClusterProxyRequest']['method']

export const Route = createFileRoute('/_authenticated/k8s-clusters/')({
  component: K8sClustersPage,
})

function K8sClustersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (selectedId) {
    return <ClusterDetail clusterId={selectedId} onBack={() => setSelectedId(null)} />
  }

  return <ClusterList onSelect={setSelectedId} />
}

function buildGpu(vendor: string, model: string, count: number, resourceName: string): NodePoolGPU | undefined {
  const gpu: NodePoolGPU = {
    vendor: vendor.trim() || undefined,
    model: model.trim() || undefined,
    count: count > 0 ? count : undefined,
    resource_name: resourceName.trim() || undefined,
  }
  return gpu.vendor || gpu.model || gpu.count || gpu.resource_name ? gpu : undefined
}

function ClusterList({ onSelect }: { onSelect: (id: string) => void }) {
  const qc = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.36.0')
  const [taskId, setTaskId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['k8s-clusters'],
    queryFn: () => listOrThrow(() => coreApi.GET('/k8s-clusters', { params: { query: { limit: 50 } } })),
  })

  const createCluster = useMutation({
    mutationFn: async () => {
      const { response, error } = await coreApi.POST('/k8s-clusters', {
        body: { name, version: version || undefined, idempotency_key: newIdempotencyKey() },
      })
      if (error) throw error
      const loc = response.headers.get('Location')
      const tid = loc?.match(/tasks\/([^/]+)/)?.[1]
      if (tid) setTaskId(tid)
    },
    onSuccess: () => {
      setVisible(false)
      setName('')
      setVersion('1.36.0')
      qc.invalidateQueries({ queryKey: ['k8s-clusters'] })
    },
    onError: (e) => showApiError(e),
  })

  const items = (data?.items ?? []) as Cluster[]

  return (
    <div className="space-y-4">
      <PageHeader
        title="K8s 集群"
        subtitle="租户 Kubernetes 集群管理"
        extra={
          <Button type="primary" onClick={() => setVisible(true)}>
            创建集群
          </Button>
        }
      />
      {taskId ? <AsyncTaskPoller taskId={taskId} onComplete={() => setTaskId(null)} /> : null}
      <CursorTable<Cluster>
        columns={[
          {
            title: '名称',
            render: (_, r) => (
              <Button type="text" onClick={() => onSelect(r.id!)}>
                {r.name ?? r.id}
              </Button>
            ),
          },
          { title: '版本', dataIndex: 'version' },
          { title: '状态', render: (_, r) => <StatusTag status={r.state} /> },
          { title: '创建时间', render: (_, r) => formatDateTime(r.created_at) },
        ]}
        data={{ items, next_cursor: data?.next_cursor }}
        loading={isLoading}
        error={error}
        rowKey="id"
        emptyDescription="暂无 K8s 集群，点击右上角创建"
      />
      <Modal
        visible={visible}
        title="创建集群"
        onCancel={() => setVisible(false)}
        onOk={() => createCluster.mutateAsync()}
        confirmLoading={createCluster.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input value={name} onChange={setName} placeholder="集群名称" />
          </Form.Item>
          <Form.Item label="版本">
            <Input value={version} onChange={setVersion} placeholder="1.36.0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function ClusterDetail({ clusterId, onBack }: { clusterId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [taskId, setTaskId] = useState<string | null>(null)
  const [proxyMethod, setProxyMethod] = useState<ProxyMethod>('GET')
  const [proxyPath, setProxyPath] = useState('/api/v1/namespaces')
  const [proxyQueryJson, setProxyQueryJson] = useState('{}')
  const [proxyBodyJson, setProxyBodyJson] = useState('')
  const [proxyResult, setProxyResult] = useState<unknown>(null)
  const [poolVisible, setPoolVisible] = useState(false)
  const [poolName, setPoolName] = useState('')
  const [poolNodeCount, setPoolNodeCount] = useState(1)
  const [poolInstanceType, setPoolInstanceType] = useState('standard')
  const [poolGpuVendor, setPoolGpuVendor] = useState('')
  const [poolGpuModel, setPoolGpuModel] = useState('')
  const [poolGpuCount, setPoolGpuCount] = useState(0)
  const [poolGpuResourceName, setPoolGpuResourceName] = useState('')
  const [upgradeVersion, setUpgradeVersion] = useState('')
  const [poolDetail, setPoolDetail] = useState<NodePool | null>(null)
  const [editPool, setEditPool] = useState<NodePool | null>(null)
  const [editNodeCount, setEditNodeCount] = useState(1)
  const [editInstanceType, setEditInstanceType] = useState('')
  const [editGpuVendor, setEditGpuVendor] = useState('')
  const [editGpuModel, setEditGpuModel] = useState('')
  const [editGpuCount, setEditGpuCount] = useState(0)
  const [editGpuResourceName, setEditGpuResourceName] = useState('')

  const detail = useQuery({
    queryKey: ['k8s-cluster', clusterId],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/k8s-clusters/{cluster_id}', {
        params: { path: { cluster_id: clusterId } },
      })
      if (error) throw error
      return data
    },
  })

  const nodePools = useQuery({
    queryKey: ['k8s-node-pools', clusterId],
    queryFn: () =>
      listOrThrow(() =>
        coreApi.GET('/k8s-clusters/{cluster_id}/node-pools', { params: { path: { cluster_id: clusterId } } }),
      ),
  })

  const workloads = useQuery({
    queryKey: ['k8s-workloads', clusterId],
    queryFn: () =>
      listOrThrow(() =>
        coreApi.GET('/k8s-clusters/{cluster_id}/workloads', { params: { path: { cluster_id: clusterId } } }),
      ),
  })

  const proxyApi = useMutation({
    mutationFn: async () => {
      const query = proxyQueryJson.trim() ? JSON.parse(proxyQueryJson) : undefined
      const body = proxyBodyJson.trim() ? JSON.parse(proxyBodyJson) : undefined
      const { data, error } = await coreApi.POST('/k8s-clusters/{cluster_id}/proxy', {
        params: { path: { cluster_id: clusterId } },
        body: { method: proxyMethod, path: proxyPath, query, body, idempotency_key: newIdempotencyKey() },
      })
      if (error) throw error
      setProxyResult(data)
    },
    onError: (e) => showApiError(e),
  })

  const createPool = useMutation({
    mutationFn: async () => {
      const { error } = await coreApi.POST('/k8s-clusters/{cluster_id}/node-pools', {
        params: { path: { cluster_id: clusterId } },
        body: {
          name: poolName,
          instance_type: poolInstanceType,
          node_count: poolNodeCount,
          gpu: buildGpu(poolGpuVendor, poolGpuModel, poolGpuCount, poolGpuResourceName),
          idempotency_key: newIdempotencyKey(),
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      setPoolVisible(false)
      setPoolName('')
      setPoolNodeCount(1)
      setPoolInstanceType('standard')
      setPoolGpuVendor('')
      setPoolGpuModel('')
      setPoolGpuCount(0)
      setPoolGpuResourceName('')
      qc.invalidateQueries({ queryKey: ['k8s-node-pools', clusterId] })
    },
    onError: (e) => showApiError(e),
  })

  const deletePool = useMutation({
    mutationFn: async (poolId: string) => {
      const { error } = await coreApi.DELETE('/k8s-clusters/{cluster_id}/node-pools/{node_pool_id}', {
        params: { path: { cluster_id: clusterId, node_pool_id: poolId } },
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['k8s-node-pools', clusterId] }),
    onError: (e) => showApiError(e),
  })

  const loadPoolDetail = useMutation({
    mutationFn: async (poolId: string) => {
      const { data, error } = await coreApi.GET('/k8s-clusters/{cluster_id}/node-pools/{node_pool_id}', {
        params: { path: { cluster_id: clusterId, node_pool_id: poolId } },
      })
      if (error) throw error
      setPoolDetail(data ?? null)
    },
    onError: (e) => showApiError(e),
  })

  const updatePool = useMutation({
    mutationFn: async () => {
      if (!editPool?.id) throw new Error('缺少节点池 ID')
      const { error } = await coreApi.PATCH('/k8s-clusters/{cluster_id}/node-pools/{node_pool_id}', {
        params: { path: { cluster_id: clusterId, node_pool_id: editPool.id } },
        body: {
          node_count: editNodeCount,
          instance_type: editInstanceType,
          gpu: buildGpu(editGpuVendor, editGpuModel, editGpuCount, editGpuResourceName),
          idempotency_key: newIdempotencyKey(),
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      setEditPool(null)
      qc.invalidateQueries({ queryKey: ['k8s-node-pools', clusterId] })
    },
    onError: (e) => showApiError(e),
  })

  const upgrade = useMutation({
    mutationFn: async (version: string) => {
      const { response, error } = await coreApi.POST('/k8s-clusters/{cluster_id}/upgrade', {
        params: { path: { cluster_id: clusterId } },
        body: { version, idempotency_key: newIdempotencyKey() },
      })
      if (error) throw error
      const loc = response.headers.get('Location')
      const tid = loc?.match(/tasks\/([^/]+)/)?.[1]
      if (tid) setTaskId(tid)
    },
    onError: (e) => showApiError(e),
  })

  const downloadKubeconfig = useMutation({
    mutationFn: async () => {
      const { data, error } = await coreApi.GET('/k8s-clusters/{cluster_id}/kubeconfig', {
        params: { path: { cluster_id: clusterId } },
      })
      if (error) throw error
      const blob = new Blob([(data as { kubeconfig?: string })?.kubeconfig ?? ''], { type: 'text/yaml' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `kubeconfig-${clusterId}.yaml`
      a.click()
    },
    onError: (e) => showApiError(e),
  })

  const deleteCluster = useMutation({
    mutationFn: async () => {
      const { error } = await coreApi.DELETE('/k8s-clusters/{cluster_id}', {
        params: { path: { cluster_id: clusterId } },
      })
      if (error) throw error
    },
    onSuccess: () => {
      onBack()
      qc.invalidateQueries({ queryKey: ['k8s-clusters'] })
    },
    onError: (e) => showApiError(e),
  })

  if (detail.isLoading && !detail.data) {
    return (
      <div className="space-y-5">
        <PageHeader title="K8s 集群详情" subtitle="加载中…" />
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      </div>
    )
  }

  if (detail.error) return <ApiErrorAlert error={detail.error} />

  const c = detail.data
  const poolItems = (nodePools.data?.items ?? []) as NodePool[]
  const workloadItems = (workloads.data?.items ?? []) as Record<string, unknown>[]

  const confirmDeleteCluster = () => {
    Modal.confirm({
      title: '删除集群',
      content: `确定删除「${c?.name ?? clusterId}」？此操作不可恢复。`,
      onOk: () => deleteCluster.mutateAsync(),
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={c?.name ?? clusterId}
        subtitle="K8s 集群详情"
        extra={
          <Space wrap>
            <Button type="primary" loading={downloadKubeconfig.isPending} onClick={() => downloadKubeconfig.mutateAsync()}>
              下载 Kubeconfig
            </Button>
            <Input
              value={upgradeVersion}
              onChange={setUpgradeVersion}
              placeholder="升级版本"
              className="w-[140px]"
            />
            <Button
              type="outline"
              loading={upgrade.isPending}
              onClick={() => upgrade.mutateAsync(upgradeVersion || c?.version || '1.36.0')}
            >
              升级
            </Button>
            <Button type="outline" status="danger" onClick={confirmDeleteCluster}>
              删除
            </Button>
            <Button type="text" onClick={onBack}>
              返回列表
            </Button>
          </Space>
        }
      />
      {taskId ? <AsyncTaskPoller taskId={taskId} onComplete={() => setTaskId(null)} /> : null}
      <Card>
        <Descriptions
          column={{ xs: 1, sm: 2, md: 3 }}
          data={[
            { label: 'ID', value: c?.id ?? clusterId },
            { label: '版本', value: c?.version ?? '—' },
            { label: '状态', value: <StatusTag status={c?.state} /> },
            { label: '创建时间', value: formatDateTime(c?.created_at) },
            { label: '更新时间', value: formatDateTime(c?.updated_at) },
          ]}
        />
      </Card>
      <Tabs>
        <Tabs.TabPane key="pools" title="节点池">
          <div className="space-y-4">
            <Button type="primary" onClick={() => setPoolVisible(true)}>
              创建节点池
            </Button>
            <CursorTable<NodePool>
              columns={[
                { title: '名称', dataIndex: 'name' },
                { title: '节点数', dataIndex: 'node_count' },
                { title: '规格', dataIndex: 'instance_type' },
                { title: '状态', render: (_, r) => <StatusTag status={r.state} /> },
                {
                  title: '操作',
                  render: (_, r) => (
                    <Space>
                      <Button type="text" loading={loadPoolDetail.isPending} onClick={() => loadPoolDetail.mutateAsync(r.id!)}>
                        详情
                      </Button>
                      <Button
                        type="text"
                        onClick={() => {
                          setEditPool(r)
                          setEditNodeCount(r.node_count ?? 1)
                          setEditInstanceType(r.instance_type ?? 'standard')
                          setEditGpuVendor(r.gpu?.vendor ?? '')
                          setEditGpuModel(r.gpu?.model ?? '')
                          setEditGpuCount(r.gpu?.count ?? 0)
                          setEditGpuResourceName(r.gpu?.resource_name ?? '')
                        }}
                      >
                        调整
                      </Button>
                      <Button
                        type="text"
                        status="danger"
                        onClick={() =>
                          Modal.confirm({
                            title: '删除节点池',
                            content: `确定删除节点池「${r.name ?? r.id}」？`,
                            onOk: () => deletePool.mutateAsync(r.id!),
                          })
                        }
                      >
                        删除
                      </Button>
                    </Space>
                  ),
                },
              ]}
              data={{ items: poolItems, next_cursor: nodePools.data?.next_cursor }}
              loading={nodePools.isLoading}
              error={nodePools.error}
              rowKey="id"
              emptyDescription="暂无节点池，点击上方创建"
            />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane key="workloads" title="Workloads">
          <CursorTable<Record<string, unknown>>
            columns={[
              { title: 'ID', dataIndex: 'id' },
              { title: '名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'kind' },
              { title: '命名空间', dataIndex: 'namespace' },
            ]}
            data={{ items: workloadItems, next_cursor: workloads.data?.next_cursor }}
            loading={workloads.isLoading}
            error={workloads.error}
            rowKey="id"
            emptyDescription="暂无 Workload"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="proxy" title="API Proxy">
          <div className="space-y-4">
            <Space wrap>
              <Select value={proxyMethod} onChange={setProxyMethod} className="w-[120px]">
                <Select.Option value="GET">GET</Select.Option>
                <Select.Option value="POST">POST</Select.Option>
                <Select.Option value="PUT">PUT</Select.Option>
                <Select.Option value="PATCH">PATCH</Select.Option>
                <Select.Option value="DELETE">DELETE</Select.Option>
              </Select>
              <Input
                value={proxyPath}
                onChange={setProxyPath}
                placeholder="K8s API 路径"
                className="min-w-[280px]"
              />
              <Button type="primary" loading={proxyApi.isPending} onClick={() => proxyApi.mutateAsync()}>
                执行代理
              </Button>
            </Space>
            <Input.TextArea
              value={proxyQueryJson}
              onChange={setProxyQueryJson}
              placeholder='Query JSON，例如 {"limit":"50"}'
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <Input.TextArea
              value={proxyBodyJson}
              onChange={setProxyBodyJson}
              placeholder="Body JSON，可选"
              autoSize={{ minRows: 3, maxRows: 8 }}
            />
            {proxyResult == null ? (
              <Empty description="输入路径后执行代理请求" />
            ) : (
              <pre className="overflow-auto rounded bg-[var(--color-fill-2)] p-3 text-xs">
                {JSON.stringify(proxyResult, null, 2)}
              </pre>
            )}
          </div>
        </Tabs.TabPane>
      </Tabs>
      <Modal
        visible={poolVisible}
        title="创建节点池"
        onCancel={() => setPoolVisible(false)}
        onOk={() => createPool.mutateAsync()}
        confirmLoading={createPool.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input value={poolName} onChange={setPoolName} placeholder="节点池名称" />
          </Form.Item>
          <Form.Item label="节点数" required>
            <InputNumber value={poolNodeCount} min={1} precision={0} onChange={(value) => setPoolNodeCount(Number(value ?? 1))} />
          </Form.Item>
          <Form.Item label="实例规格" required>
            <Input value={poolInstanceType} onChange={setPoolInstanceType} placeholder="standard" />
          </Form.Item>
          <Form.Item label="GPU 厂商">
            <Input value={poolGpuVendor} onChange={setPoolGpuVendor} />
          </Form.Item>
          <Form.Item label="GPU 型号">
            <Input value={poolGpuModel} onChange={setPoolGpuModel} />
          </Form.Item>
          <Form.Item label="GPU 数量">
            <InputNumber value={poolGpuCount} min={0} precision={0} onChange={(value) => setPoolGpuCount(Number(value ?? 0))} />
          </Form.Item>
          <Form.Item label="GPU Resource Name">
            <Input value={poolGpuResourceName} onChange={setPoolGpuResourceName} placeholder="nvidia.com/gpu" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        visible={!!editPool}
        title="调整节点池"
        onCancel={() => setEditPool(null)}
        onOk={() => updatePool.mutateAsync()}
        confirmLoading={updatePool.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="节点数" required>
            <InputNumber value={editNodeCount} min={0} precision={0} onChange={(value) => setEditNodeCount(Number(value ?? 0))} />
          </Form.Item>
          <Form.Item label="实例规格" required>
            <Input value={editInstanceType} onChange={setEditInstanceType} />
          </Form.Item>
          <Form.Item label="GPU 厂商">
            <Input value={editGpuVendor} onChange={setEditGpuVendor} />
          </Form.Item>
          <Form.Item label="GPU 型号">
            <Input value={editGpuModel} onChange={setEditGpuModel} />
          </Form.Item>
          <Form.Item label="GPU 数量">
            <InputNumber value={editGpuCount} min={0} precision={0} onChange={(value) => setEditGpuCount(Number(value ?? 0))} />
          </Form.Item>
          <Form.Item label="GPU Resource Name">
            <Input value={editGpuResourceName} onChange={setEditGpuResourceName} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal visible={!!poolDetail} title="节点池详情" footer={null} onCancel={() => setPoolDetail(null)}>
        <Descriptions
          column={1}
          data={[
            { label: 'ID', value: poolDetail?.id },
            { label: '名称', value: poolDetail?.name },
            { label: '节点数', value: poolDetail?.node_count },
            { label: '实例规格', value: poolDetail?.instance_type },
            { label: 'GPU', value: poolDetail?.gpu ? JSON.stringify(poolDetail.gpu) : '—' },
            { label: '状态', value: poolDetail?.state },
            { label: '创建时间', value: formatDateTime(poolDetail?.created_at) },
            { label: '更新时间', value: formatDateTime(poolDetail?.updated_at) },
          ]}
        />
      </Modal>
    </div>
  )
}
