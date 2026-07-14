import { describe, expect, it } from 'vitest'
import { buildCreateInstanceBodyForTest } from './index'

describe('buildCreateInstanceBody', () => {
  const baseForm = {
    name: 'ubuntu-install',
    kind: 'vm' as const,
    image: '',
    command: '',
    cpu: '2',
    memory: '4Gi',
    auto_start: true,
    boot_mode: 'iso' as const,
    boot_image: 'quay.io/kubevirt/cirros-container-disk-demo:v1.2.0',
    boot_media_image_id: 'img-ubuntu-iso',
    root_disk_size_gib: 40,
    ssh_username: 'ubuntu',
    ssh_key_ref: '',
    termination_protection: false,
    gpu_vendor: '',
    gpu_model: '',
    gpu_count: 1,
    replicas: 1,
    network_mode: 'default' as const,
    ip_allocation: 'auto' as const,
    vpc_id: '',
    subnet_id: '',
    private_ip: '',
    sandbox_runtime_class: 'sandbox-kata',
    sandbox_session_timeout: '30m',
    sandbox_network_egress_policy: 'deny_all' as const,
  }

  it('submits ISO boot media without containerDisk boot_image', () => {
    const body = buildCreateInstanceBodyForTest({
      ...baseForm,
    })

    expect(body.boot_image).toBeNull()
    expect(body.boot_media).toEqual({ type: 'iso', image_id: 'img-ubuntu-iso', boot_order: 1 })
    expect(body.root_disk_size_gib).toBe(40)
  })

  it('submits real Sandbox instance fields with a caller-provided idempotency key', () => {
    const body = buildCreateInstanceBodyForTest(
      {
        ...baseForm,
        name: 'agent-sandbox-001',
        kind: 'sandbox',
        image: 'docker.changqingyun.cn/mirror/busybox:latest',
        command: 'sh -c "uname -a; sleep 300"',
        sandbox_session_timeout: '1h',
        sandbox_network_egress_policy: 'internet',
      },
      'sandbox-create-stable-key',
    )

    expect(body).toMatchObject({
      idempotency_key: 'sandbox-create-stable-key',
      kind: 'sandbox',
      instance_type: 'sandbox',
      name: 'agent-sandbox-001',
      image: 'docker.changqingyun.cn/mirror/busybox:latest',
      command: ['sh', '-c', 'uname -a; sleep 300'],
      sandbox_config: {
        runtime_class: 'sandbox-kata',
        session_timeout: '1h',
        network_egress_policy: 'internet',
      },
    })
  })
})
