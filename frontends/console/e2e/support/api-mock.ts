import type { Page, Route } from '@playwright/test'

type MockBody = Record<string, unknown> | unknown[] | null

interface MockRoute {
  method: string
  pattern: RegExp
  body: MockBody | ((match: RegExpMatchArray) => MockBody)
}

const ISO = '2026-06-01T08:00:00Z'

const MOCK_ROUTES: MockRoute[] = [
  { method: 'GET', pattern: /^\/branding$/, body: { platform_name: 'ANI Console' } },
  {
    method: 'GET',
    pattern: /^\/instances$/,
    body: {
      items: [{ id: 'inst-1', name: 'e2e-vm', state: 'running', created_at: ISO }],
      total: 1,
    },
  },
  {
    method: 'GET',
    pattern: /^\/instances\/[^/]+$/,
    body: {
      id: 'inst-1',
      name: 'e2e-vm',
      state: 'running',
      kind: 'container',
      replicas: 1,
      termination_protection: false,
      created_at: ISO,
      updated_at: ISO,
    },
  },
  {
    method: 'GET',
    pattern: /^\/instances\/[^/]+\/operations$/,
    body: { items: [{ id: 'op-1', operation: 'create', status: 'succeeded' }] },
  },
  {
    method: 'GET',
    pattern: /^\/gpu-inventory\/occupancy$/,
    body: { total: 8, in_use: 3, available: 5, fault: 0, dev_profile: { real_provider: false, profile: 'CORE-DEV-PROFILE-A' } },
  },
  {
    method: 'GET',
    pattern: /^\/sandbox-templates$/,
    body: { items: [{ id: 'st-1', name: 'python-3.11', kind: 'python' }] },
  },
  {
    method: 'GET',
    pattern: /^\/auth\/api-keys$/,
    body: {
      items: [
        {
          id: 'key-1',
          name: 'ci-bot',
          key_prefix: 'ani_ci_',
          created_at: ISO,
        },
      ],
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/api-keys$/,
    body: {
      id: 'key-2',
      name: 'new-key',
      key_prefix: 'ani_new_',
      key_value: 'ani_sk_e2e_secret',
      created_at: ISO,
    },
  },
  {
    method: 'GET',
    pattern: /^\/observability\/alert-rules$/,
    body: { items: [{ id: 'rule-1', name: 'cpu-high', enabled: true }], total: 1 },
  },
  {
    method: 'GET',
    pattern: /^\/metering\/usage$/,
    body: {
      items: [
        { period: '2026-06-01', total_quantity: 10, resource_type: 'instance_cpu_seconds', unit: 'seconds' },
        { period: '2026-06-02', total_quantity: 12, resource_type: 'instance_cpu_seconds', unit: 'seconds' },
      ],
      total: 2,
      dev_profile: { real_provider: false, profile: 'CORE-DEV-PROFILE-A' },
    },
  },
  {
    method: 'GET',
    pattern: /^\/volumes$/,
    body: {
      items: [
        {
          id: 'vol-1',
          name: 'data-vol',
          size_gib: 100,
          storage_class: 'default',
          state: 'available',
          created_at: ISO,
          updated_at: ISO,
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/volumes\/[^/]+$/,
    body: { id: 'vol-1', name: 'data-vol', size_gib: 100, storage_class: 'default', state: 'available', created_at: ISO, updated_at: ISO },
  },
  {
    method: 'GET',
    pattern: /^\/volumes\/[^/]+\/snapshots$/,
    body: { items: [{ id: 'snap-1', name: 'snap-a' }] },
  },
  {
    method: 'GET',
    pattern: /^\/filesystems$/,
    body: {
      items: [
        {
          id: 'fs-1',
          name: 'shared-fs',
          protocol: 'nfs',
          size_gib: 200,
          endpoint: 'nfs.example.local:/export/shared-fs',
          state: 'available',
          created_at: ISO,
          updated_at: ISO,
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/filesystems\/[^/]+$/,
    body: {
      id: 'fs-1',
      name: 'shared-fs',
      protocol: 'nfs',
      size_gib: 200,
      endpoint: 'nfs.example.local:/export/shared-fs',
      state: 'available',
      created_at: ISO,
      updated_at: ISO,
    },
  },
  {
    method: 'GET',
    pattern: /^\/filesystems\/[^/]+\/mount-targets$/,
    body: { items: [{ id: 'mt-1', vpc_id: 'vpc-1', subnet_id: 'subnet-1' }] },
  },
  {
    method: 'GET',
    pattern: /^\/buckets$/,
    body: {
      items: [
        {
          id: 'bucket-1',
          name: 'e2e-bucket',
          access_mode: 'private',
          object_count: 1,
          created_at: ISO,
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/objects\/[^/]+$/,
    body: (match) => {
      const objectId = match[0].slice('/objects/'.length)
      return {
        id: objectId,
        tenant_id: 'tenant-1',
        bucket: 'e2e-bucket',
        key: 'readme.txt',
        size_bytes: 1024,
        content_type: 'text/plain',
        state: 'available',
        created_at: ISO,
        updated_at: ISO,
      }
    },
  },
  {
    method: 'GET',
    pattern: /^\/objects\/[^/]+\/download$/,
    body: { download_url: 'https://example.com/e2e-download', expires_at: ISO },
  },
  {
    method: 'GET',
    pattern: /^\/objects$/,
    body: {
      items: [
        {
          id: 'obj-1',
          bucket: 'e2e-bucket',
          key: 'readme.txt',
          size_bytes: 1024,
          content_type: 'text/plain',
          state: 'available',
          created_at: ISO,
          updated_at: ISO,
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/networks\/vpcs$/,
    body: { items: [{ id: 'vpc-1', name: 'prod-vpc', cidr: '10.0.0.0/16', state: 'available', created_at: ISO }] },
  },
  {
    method: 'GET',
    pattern: /^\/networks\/vpcs\/[^/]+$/,
    body: {
      id: 'vpc-1',
      name: 'prod-vpc',
      cidr: '10.0.0.0/16',
      state: 'available',
      created_at: ISO,
      updated_at: ISO,
    },
  },
  {
    method: 'GET',
    pattern: /^\/networks\/subnets$/,
    body: { items: [{ id: 'subnet-1', name: 'app-subnet', vpc_id: 'vpc-1', state: 'available', created_at: ISO }] },
  },
  {
    method: 'GET',
    pattern: /^\/networks\/security-groups$/,
    body: { items: [{ id: 'sg-1', name: 'web-sg', state: 'available', created_at: ISO }] },
  },
  {
    method: 'GET',
    pattern: /^\/networks\/load-balancers$/,
    body: { items: [{ id: 'lb-1', name: 'api-lb', state: 'available', created_at: ISO }] },
  },
  {
    method: 'GET',
    pattern: /^\/networks\/routes$/,
    body: {
      items: [
        {
          id: 'route-1',
          vpc_id: 'vpc-1',
          destination_cidr: '0.0.0.0/0',
          next_hop_type: 'gateway',
          next_hop_id: 'igw-1',
          created_at: ISO,
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/vector-stores$/,
    body: {
      items: [
        {
          id: 'vs-1',
          name: 'embeddings',
          dimension: 128,
          metric: 'cosine',
          state: 'ready',
          created_at: ISO,
          updated_at: ISO,
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/vector-stores\/[^/]+$/,
    body: {
      id: 'vs-1',
      name: 'embeddings',
      dimension: 128,
      metric: 'cosine',
      state: 'ready',
      created_at: ISO,
      updated_at: ISO,
    },
  },
  {
    method: 'POST',
    pattern: /^\/vector-stores\/[^/]+\/search$/,
    body: {
      items: [{ id: 'doc-1', score: 0.95, metadata: { source: 'e2e' } }],
      total: 1,
    },
  },

  {
    method: 'GET',
    pattern: /^\/encryption\/keys$/,
    body: { items: [{ id: 'key-1', name: 'main-key', state: 'active', created_at: ISO }] },
  },
  {
    method: 'GET',
    pattern: /^\/observability\/query$/,
    body: { result: [{ metric: { __name__: 'up' }, value: [1717300000, '1'] }] },
  },
  {
    method: 'GET',
    pattern: /^\/instance-operations\/[^/]+$/,
    body: {
      id: 'op-1',
      instance_id: 'inst-1',
      tenant_id: 't-1',
      operation: 'create',
      status: 'succeeded',
      requested_by: 'admin',
      retry_eligible: false,
      created_at: ISO,
      steps: [{ step_name: 'admission_check', status: 'succeeded', started_at: ISO, completed_at: ISO, message: 'ok' }],
    },
  },
  {
    method: 'GET',
    pattern: /^\/secrets$/,
    body: { items: [{ id: 'sec-1', name: 'app-secret', type: 'opaque' }] },
  },
  {
    method: 'GET',
    pattern: /^\/secrets\/[^/]+$/,
    body: { id: 'sec-1', name: 'app-secret', type: 'opaque' },
  },
  {
    method: 'GET',
    pattern: /^\/k8s-clusters$/,
    body: {
      items: [
        {
          id: 'k8s-1',
          name: 'dev-cluster',
          state: 'running',
          version: '1.36.0',
          created_at: ISO,
          updated_at: ISO,
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/k8s-clusters\/[^/]+$/,
    body: {
      id: 'k8s-1',
      name: 'dev-cluster',
      state: 'running',
      version: '1.36.0',
      created_at: ISO,
      updated_at: ISO,
    },
  },
  {
    method: 'GET',
    pattern: /^\/k8s-clusters\/[^/]+\/node-pools$/,
    body: { items: [{ id: 'pool-1', name: 'default-pool', node_count: 2, instance_type: 'standard', state: 'running' }] },
  },
  {
    method: 'GET',
    pattern: /^\/k8s-clusters\/[^/]+\/workloads$/,
    body: { items: [{ id: 'wl-1', name: 'nginx', kind: 'Deployment', namespace: 'default' }] },
  },
  {
    method: 'GET',
    pattern: /^\/k8s-clusters\/[^/]+\/kubeconfig$/,
    body: { kubeconfig: 'apiVersion: v1\nkind: Config\n' },
  },
  {
    method: 'GET',
    pattern: /^\/registry\/projects$/,
    body: { items: [{ id: 'proj-1', name: 'ani', public: false, created_at: ISO }] },
  },
  {
    method: 'GET',
    pattern: /^\/registry\/projects\/[^/]+\/repositories$/,
    body: { items: [{ project: 'ani', name: 'web', artifact_count: 1, pull_count: 3 }] },
  },
  {
    method: 'GET',
    pattern: /^\/registry\/projects\/[^/]+\/repositories\/[^/]+\/artifacts$/,
    body: {
      items: [
        {
          project: 'ani',
          repository: 'web',
          digest: 'sha256:e2eabc',
          tags: ['v1.0'],
          media_type: 'application/vnd.docker.distribution.manifest.v2+json',
          size_bytes: 102400,
          pushed_at: ISO,
          scan_status: { image: 'ani/web:v1.0', status: 'complete', critical: 0, high: 0, medium: 1, low: 2 },
        },
      ],
    },
  },
  {
    method: 'GET',
    pattern: /^\/registry\/projects\/[^/]+\/scan-report$/,
    body: {
      project: 'ani',
      status: 'complete',
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      artifacts_total: 1,
      scanned_artifacts: 1,
    },
  },
  {
    method: 'POST',
    pattern: /^\/registry\/projects\/[^/]+\/pull-secret\/kubernetes-apply$/,
    body: {
      project: 'ani',
      name: 'ani-registry-pull',
      secret_ref: 'secret/registry/ani-registry-pull',
      registry: 'registry.e2e.local',
      username: 'robot$ani',
      namespace: 'e2e-ns',
      created_at: ISO,
      kubernetes_secret_name: 'ani-registry-pull',
      kubernetes_namespace: 'e2e-ns',
      kubernetes_applied: true,
      applied_at: ISO,
    },
  },
]

function resolveMock(method: string, apiPath: string): MockBody | undefined {
  for (const route of MOCK_ROUTES) {
    if (route.method !== method) continue
    const match = apiPath.match(route.pattern)
    if (!match) continue
    return typeof route.body === 'function' ? route.body(match) : route.body
  }
  return undefined
}

async function fulfillJson(route: Route, status: number, body: MockBody) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/** 拦截 Core API，返回固定 fixture，使 E2E 不依赖 Mock Server / 真实后端。 */
export async function installCoreApiMocks(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const prefix = '/api/v1'
    const idx = url.pathname.indexOf(prefix)
    if (idx < 0) {
      await route.continue()
      return
    }

    const apiPath = url.pathname.slice(idx + prefix.length) || '/'
    const body = resolveMock(request.method(), apiPath)

    if (body !== undefined) {
      await fulfillJson(route, 200, body)
      return
    }

    if (request.method() === 'GET') {
      await fulfillJson(route, 200, { items: [], total: 0 })
      return
    }

    await fulfillJson(route, 202, { id: 'e2e-async', status: 'accepted' })
  })
}
