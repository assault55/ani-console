import { describe, expect, it } from 'vitest'
import { createMockVmInstanceDataSource } from './data-source'
import type { VmInstance, VmInstanceQuery } from './types'

const seed: VmInstance[] = [
  {
    id: 'vm-1',
    name: 'alpha',
    status: 'running',
    spec: '2C 4G',
    image: 'Ubuntu',
    privateIp: '10.0.0.1',
    node: 'worker-a',
    terminationProtected: false,
    createdAt: '2026-01-01 10:00:00',
  },
  {
    id: 'vm-2',
    name: 'beta',
    status: 'stopped',
    spec: '4C 8G',
    image: 'Rocky',
    privateIp: '10.0.0.2',
    node: 'worker-b',
    terminationProtected: true,
    createdAt: '2026-01-02 10:00:00',
  },
  {
    id: 'vm-3',
    name: 'gamma',
    status: 'error',
    spec: '8C 16G',
    image: 'Debian',
    privateIp: '10.0.0.3',
    node: 'worker-c',
    terminationProtected: false,
    createdAt: '2026-01-03 10:00:00',
  },
]

const defaultQuery: VmInstanceQuery = {
  status: 'all',
  searchField: 'name',
  keyword: '',
  page: 1,
  pageSize: 10,
}

describe('mock VM instance data source', () => {
  it('returns status counts independently from the active filter', async () => {
    const source = createMockVmInstanceDataSource(seed)
    const result = await source.list({ ...defaultQuery, status: 'stopped' })

    expect(result.items.map((item) => item.id)).toEqual(['vm-2'])
    expect(result.statusCounts).toEqual({ all: 3, running: 1, stopped: 1, error: 1 })
  })

  it('supports search, sorting and server-style pagination', async () => {
    const source = createMockVmInstanceDataSource(seed)
    const result = await source.list({
      ...defaultQuery,
      searchField: 'id',
      keyword: 'vm-',
      pageSize: 2,
      sortField: 'createdAt',
      sortDirection: 'desc',
    })

    expect(result.total).toBe(3)
    expect(result.items.map((item) => item.id)).toEqual(['vm-3', 'vm-2'])
  })

  it('changes only instances compatible with the requested power action', async () => {
    const source = createMockVmInstanceDataSource(seed)
    await source.changePowerState(['vm-1', 'vm-2', 'vm-3'], 'start')
    const afterStart = await source.list(defaultQuery)

    expect(afterStart.items.every((item) => item.status === 'running')).toBe(true)

    await source.changePowerState(['vm-2'], 'stop')
    const afterStop = await source.list(defaultQuery)
    expect(afterStop.items.find((item) => item.id === 'vm-2')?.status).toBe('stopped')
    expect(afterStop.items.find((item) => item.id === 'vm-1')?.status).toBe('running')
  })
})
