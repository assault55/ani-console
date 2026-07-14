import { describe, expect, it } from 'vitest'
import {
  getInstanceActionErrorMessage,
  getSandboxProviderLabel,
  parseSandboxCommand,
} from './sandbox-instance'

describe('sandbox-instance helpers', () => {
  it('parses shell-like command text into argv', () => {
    expect(parseSandboxCommand('sh -c "uname -a; sleep 300"')).toEqual(['sh', '-c', 'uname -a; sleep 300'])
    expect(parseSandboxCommand("python -c 'print(123)'")).toEqual(['python', '-c', 'print(123)'])
    expect(parseSandboxCommand('')).toBeUndefined()
  })

  it('labels real Kubernetes/Kata and local provider modes without overstating local runs', () => {
    expect(getSandboxProviderLabel({ provider: 'kubernetes_rest', dev_profile: { mode: 'real', provider: 'kubernetes_rest', real_provider: true } })).toBe(
      '真实 Kubernetes/Kata 后端',
    )
    expect(getSandboxProviderLabel({ provider: 'kubernetes_rest', dev_profile: { mode: 'local', provider: 'local', real_provider: false } })).toBe(
      '本地开发模式',
    )
    expect(getSandboxProviderLabel({ provider: 'mock', dev_profile: { mode: 'real', provider: 'mock', real_provider: false } })).toBe(
      'mock（real_provider=false）',
    )
  })

  it('maps create and lifecycle failures to actionable copy', () => {
    expect(getInstanceActionErrorMessage({ code: 'BAD_REQUEST', message: '镜像不存在' }, 'create')).toBe('镜像不存在')
    expect(getInstanceActionErrorMessage({ status: 409, message: 'conflict' }, 'create')).toBe('幂等请求进行中或状态冲突，请稍后刷新')
    expect(getInstanceActionErrorMessage({ status: 503, message: 'upstream unavailable' }, 'create')).toBe('创建失败，请检查配置后重试')
    expect(getInstanceActionErrorMessage({ status: 404, message: 'not found' }, 'lifecycle')).toBe('资源可能已被清理或状态不同步')
  })
})
