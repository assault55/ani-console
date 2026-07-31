import { describe, expect, it, vi } from 'vitest'
import { createContainerInstanceDataSource } from './data-source'
import type { ContainerInstanceQuery, ContainerInstanceRecord } from './types'

const baseRecord: ContainerInstanceRecord = {
  id: 'container-1',
  tenant_id: 'tenant-1',
  name: 'api-service',
  kind: 'container',
  state: 'running',
  provider: 'kubernetes_rest',
  termination_protection: false,
  vpc_id: 'vpc-1',
  subnet_id: 'subnet-1',
  private_ip: '10.0.1.10',
  created_at: '2026-07-28T08:00:00Z',
  updated_at: '2026-07-28T08:00:00Z',
}

const defaultQuery: ContainerInstanceQuery = {
  status: 'all',
  searchField: 'name',
  keyword: '',
  page: 1,
  pageSize: 10,
}

describe('container instance data source', () => {
  it('requests cursor pages and keeps only non-deleted container instances', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [baseRecord], total: 3, next_cursor: 'next-page' })
      .mockResolvedValueOnce({
        items: [
          { ...baseRecord, id: 'container-2', name: 'worker', state: 'stopped' },
          { ...baseRecord, id: 'vm-1', name: 'vm', kind: 'vm' },
          { ...baseRecord, id: 'container-deleted', name: 'deleted', state: 'deleted' },
        ],
        total: 3,
      })
    const source = createContainerInstanceDataSource(fetchPage)
    const result = await source.list(defaultQuery)

    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'next-page')
    expect(result.items.map((item) => item.id)).toEqual(['container-1', 'container-2'])
    expect(result.statusCounts).toEqual({ all: 2, running: 1, stopped: 1, deploying: 0, failed: 0 })
  })

  it('supports status filtering, search, sorting and client pagination', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      items: [
        baseRecord,
        { ...baseRecord, id: 'container-2', name: 'api-worker', state: 'failed', created_at: '2026-07-30T08:00:00Z' },
        { ...baseRecord, id: 'container-3', name: 'batch', state: 'provisioning' },
      ],
      total: 3,
    })
    const source = createContainerInstanceDataSource(fetchPage)
    const result = await source.list({
      ...defaultQuery,
      status: 'failed',
      keyword: 'API',
      sortField: 'createdAt',
      sortDirection: 'desc',
      pageSize: 1,
    })

    expect(result.items.map((item) => item.id)).toEqual(['container-2'])
    expect(result.total).toBe(1)
    expect(result.hasTransitioningInstances).toBe(true)
  })

  it('maps container rollout fields and compatible image/spec fields', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      items: [
        {
          ...baseRecord,
          image: 'demo/app:v1.0.0',
          cpu: '2C',
          memory: '4G',
          node_name: 'worker-a',
          endpoint: 'http://container-1.example:8080',
          container: {
            replicas: 2,
            ready_replicas: 2,
            rollout_status: 'healthy',
          },
        } as ContainerInstanceRecord,
      ],
      total: 1,
    })
    const source = createContainerInstanceDataSource(fetchPage)
    const result = await source.list(defaultQuery)

    expect(result.items[0]).toMatchObject({
      image: 'demo/app:v1.0.0',
      cpuMemory: '2C / 4G',
      replicas: '2/2',
      rolloutStatus: 'healthy',
      node: 'worker-a',
      endpoint: 'http://container-1.example:8080',
    })
  })
})
