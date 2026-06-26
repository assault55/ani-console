import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Select,
  Space,
  Tabs,
  Typography,
  Upload,
} from '@arco-design/web-react'
import { useState } from 'react'
import { coreApi } from '@/api/client'
import { PageHeader } from '@/components/shell/AppShell'
import { CursorTable } from '@/components/tables/CursorTable'
import { newIdempotencyKey } from '@/lib/idempotency'
import { showApiError } from '@/api/helpers'
import { listOrThrow } from '@/lib/api-list'
import { formatDateTime } from '@/lib/format'
import { bucketNamePattern } from '@/lib/validators'
import type { components } from '@/api/core-schema'

type Bucket = { id: string; name: string }
type StorageObject = components['schemas']['StorageObject']

export const Route = createFileRoute('/_authenticated/objects/')({
  component: ObjectsPage,
})

function ObjectsPage() {
  const qc = useQueryClient()
  const [bucketVisible, setBucketVisible] = useState(false)
  const [bucketName, setBucketName] = useState('')
  const [bucketRegion, setBucketRegion] = useState('')
  const [bucketAccessMode, setBucketAccessMode] = useState<'private' | 'public_read'>('private')
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('buckets')
  const [detailObject, setDetailObject] = useState<StorageObject | null>(null)
  const [objectVisible, setObjectVisible] = useState(false)
  const [objectKey, setObjectKey] = useState('')
  const [objectSizeBytes, setObjectSizeBytes] = useState(0)
  const [objectContentType, setObjectContentType] = useState('application/octet-stream')

  const buckets = useQuery({
    queryKey: ['buckets'],
    queryFn: () => listOrThrow(() => coreApi.GET('/buckets', { params: { query: { limit: 50 } } })),
  })

  const objects = useQuery({
    queryKey: ['objects', selectedBucketId],
    queryFn: () => listOrThrow(() => coreApi.GET('/objects', { params: { query: { limit: 50 } } })),
    enabled: !!selectedBucketId,
  })

  const createBucket = useMutation({
    mutationFn: async () => {
      if (!bucketNamePattern.test(bucketName)) {
        throw new Error('存储桶名称需为 3-63 位小写字母、数字或连字符，且首尾必须是字母或数字')
      }
      const { error } = await coreApi.POST('/buckets', {
        body: {
          name: bucketName,
          region: bucketRegion || undefined,
          access_mode: bucketAccessMode,
          idempotency_key: newIdempotencyKey(),
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      setBucketVisible(false)
      setBucketName('')
      setBucketRegion('')
      setBucketAccessMode('private')
      qc.invalidateQueries({ queryKey: ['buckets'] })
    },
    onError: (e) => showApiError(e),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { data, error } = await coreApi.POST('/objects/upload', {
        body: {
          bucket_id: selectedBucketId!,
          key: file.name,
          content_type: file.type || 'application/octet-stream',
          idempotency_key: newIdempotencyKey(),
        },
      })
      if (error) throw error
      if (data?.upload_url) {
        const uploadResponse = await fetch(data.upload_url, { method: 'PUT', body: file })
        if (!uploadResponse.ok) {
          throw new Error(`对象上传失败：HTTP ${uploadResponse.status}`)
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objects', selectedBucketId] }),
    onError: (e) => showApiError(e),
  })

  const createObject = useMutation({
    mutationFn: async () => {
      const bucket = selectedBucket?.name
      if (!bucket) throw new Error('请先选择存储桶')
      const { error } = await coreApi.POST('/objects', {
        body: {
          bucket,
          key: objectKey,
          size_bytes: objectSizeBytes,
          content_type: objectContentType || 'application/octet-stream',
          idempotency_key: newIdempotencyKey(),
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      setObjectVisible(false)
      setObjectKey('')
      setObjectSizeBytes(0)
      setObjectContentType('application/octet-stream')
      qc.invalidateQueries({ queryKey: ['objects', selectedBucketId] })
    },
    onError: (e) => showApiError(e),
  })

  const downloadObject = useMutation({
    mutationFn: async (objectId: string) => {
      const { data, error } = await coreApi.GET('/objects/{object_id}/download', {
        params: { path: { object_id: objectId } },
      })
      if (error) throw error
      if (data?.download_url) window.open(data.download_url, '_blank')
    },
    onError: (e) => showApiError(e),
  })

  const loadObjectDetail = useMutation({
    mutationFn: async (objectId: string) => {
      const { data, error } = await coreApi.GET('/objects/{object_id}', {
        params: { path: { object_id: objectId } },
      })
      if (error) throw error
      setDetailObject(data ?? null)
    },
    onError: (e) => showApiError(e),
  })

  const deleteObject = useMutation({
    mutationFn: async (objectId: string) => {
      const { error } = await coreApi.DELETE('/objects/{object_id}', { params: { path: { object_id: objectId } } })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objects', selectedBucketId] }),
    onError: (e) => showApiError(e),
  })

  const bucketItems = (buckets.data?.items ?? []) as Bucket[]
  const selectedBucket = bucketItems.find((b) => b.id === selectedBucketId)
  const allObjects = (objects.data?.items ?? []) as StorageObject[]
  const objectItems = selectedBucket?.name
    ? allObjects.filter((item) => !item.bucket || item.bucket === selectedBucket.name)
    : allObjects

  const selectBucket = (id: string) => {
    setSelectedBucketId(id)
    setActiveTab('objects')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="对象存储"
        subtitle="S3 兼容存储桶与对象"
        extra={
          <Button type="primary" onClick={() => setBucketVisible(true)}>
            创建存储桶
          </Button>
        }
      />
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane key="buckets" title="存储桶">
          <CursorTable
            columns={[
              {
                title: '名称',
                render: (_, r) => (
                  <Button type="text" onClick={() => selectBucket(r.id)}>
                    {r.name}
                  </Button>
                ),
              },
            ]}
            data={{ items: bucketItems, next_cursor: buckets.data?.next_cursor }}
            loading={buckets.isLoading}
            error={buckets.error}
            rowKey="id"
            emptyDescription="暂无存储桶，点击右上角创建"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="objects" title="对象" disabled={!selectedBucketId}>
          {!selectedBucketId ? (
            <Empty description="请先在「存储桶」页签选择存储桶" />
          ) : (
            <div className="space-y-4">
              <Typography.Text type="secondary">
                当前存储桶：{selectedBucket?.name ?? selectedBucketId}
              </Typography.Text>
              <Space>
                <Upload
                  showUploadList={false}
                  customRequest={(opt) => {
                    upload.mutate(opt.file as File)
                  }}
                >
                  <Button type="outline" loading={upload.isPending}>
                    上传对象
                  </Button>
                </Upload>
                <Button type="outline" onClick={() => setObjectVisible(true)}>
                  创建对象元数据
                </Button>
              </Space>
              <CursorTable
                columns={[
                  { title: 'Key', dataIndex: 'key' },
                  { title: '大小', dataIndex: 'size_bytes' },
                  { title: '类型', dataIndex: 'content_type' },
                  {
                    title: '操作',
                    render: (_, r) => (
                      <Space>
                        <Button type="text" loading={loadObjectDetail.isPending} onClick={() => loadObjectDetail.mutateAsync(String(r.id))}>
                          详情
                        </Button>
                        <Button type="text" onClick={() => downloadObject.mutateAsync(String(r.id))}>
                          下载
                        </Button>
                        <Button
                          type="text"
                          status="danger"
                          onClick={() =>
                            Modal.confirm({
                              title: '删除对象',
                              content: `确定删除对象「${String(r.key ?? r.id)}」？`,
                              onOk: () => deleteObject.mutateAsync(String(r.id)),
                            })
                          }
                        >
                          删除
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                data={{ items: objectItems, next_cursor: objects.data?.next_cursor }}
                loading={objects.isLoading}
                error={objects.error}
                rowKey="id"
                emptyDescription="当前存储桶暂无对象"
              />
            </div>
          )}
        </Tabs.TabPane>
      </Tabs>
      <Modal
        visible={bucketVisible}
        title="创建存储桶"
        onCancel={() => setBucketVisible(false)}
        onOk={() => createBucket.mutateAsync().catch((e) => Message.error(e instanceof Error ? e.message : '创建失败'))}
        confirmLoading={createBucket.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input value={bucketName} onChange={setBucketName} />
          </Form.Item>
          <Form.Item label="Region">
            <Input value={bucketRegion} onChange={setBucketRegion} placeholder="可选" />
          </Form.Item>
          <Form.Item label="访问模式">
            <Select value={bucketAccessMode} onChange={setBucketAccessMode}>
              <Select.Option value="private">private</Select.Option>
              <Select.Option value="public_read">public_read</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        visible={objectVisible}
        title="创建对象元数据"
        onCancel={() => setObjectVisible(false)}
        onOk={() => createObject.mutateAsync()}
        confirmLoading={createObject.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="Bucket">
            <Input value={selectedBucket?.name ?? ''} disabled />
          </Form.Item>
          <Form.Item label="Key" required>
            <Input value={objectKey} onChange={setObjectKey} />
          </Form.Item>
          <Form.Item label="Size Bytes" required>
            <InputNumber
              value={objectSizeBytes}
              min={0}
              precision={0}
              onChange={(value) => setObjectSizeBytes(Number(value ?? 0))}
            />
          </Form.Item>
          <Form.Item label="Content Type" required>
            <Input value={objectContentType} onChange={setObjectContentType} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal visible={!!detailObject} title="对象详情" footer={null} onCancel={() => setDetailObject(null)}>
        <Descriptions
          column={1}
          data={[
            { label: 'ID', value: detailObject?.id },
            { label: 'Bucket', value: detailObject?.bucket },
            { label: 'Key', value: detailObject?.key },
            { label: '大小', value: detailObject?.size_bytes },
            { label: '类型', value: detailObject?.content_type },
            { label: '状态', value: detailObject?.state },
            { label: '创建时间', value: formatDateTime(detailObject?.created_at) },
            { label: '更新时间', value: formatDateTime(detailObject?.updated_at) },
          ]}
        />
      </Modal>
    </div>
  )
}
