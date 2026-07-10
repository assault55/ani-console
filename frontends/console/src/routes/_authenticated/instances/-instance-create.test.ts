import { describe, expect, it } from 'vitest'
import { buildCreateInstanceBodyForTest } from './index'

describe('buildCreateInstanceBody', () => {
  it('submits ISO boot media without containerDisk boot_image', () => {
    const body = buildCreateInstanceBodyForTest({
      name: 'ubuntu-install',
      kind: 'vm',
      image: '',
      cpu: '2',
      memory: '4Gi',
      auto_start: true,
      boot_mode: 'iso',
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
      network_mode: 'default',
      ip_allocation: 'auto',
      vpc_id: '',
      subnet_id: '',
      private_ip: '',
      sandbox_runtime_class: 'sandbox-kata',
      sandbox_session_timeout: '30m',
      sandbox_network_egress_policy: 'deny_all',
    })

    expect(body.boot_image).toBeNull()
    expect(body.boot_media).toEqual({ type: 'iso', image_id: 'img-ubuntu-iso', boot_order: 1 })
    expect(body.root_disk_size_gib).toBe(40)
  })
})
