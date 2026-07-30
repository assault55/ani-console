import { act } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DetailPageFrame } from './DetailPageFrame'

function renderFrame(onBack = vi.fn()) {
  const view = render(
    <DetailPageFrame
      breadcrumbs={[{ label: 'VM 实例' }, { label: 'demo-vm' }]}
      title="demo-vm"
      status={<span>运行中</span>}
      headerItems={[
        { label: '规格', value: '4C 8G' },
        { label: '镜像', value: 'Ubuntu 22.04' },
        { label: '私网 IP', value: '10.0.1.12' },
      ]}
      cards={[
        { key: 'basic', title: '基本信息', fields: [{ label: 'ID', value: 'vm-1' }] },
        { key: 'relation', title: '关联摘要', fields: [{ label: '云盘', value: '2' }] },
      ]}
      tabs={[{ key: 'monitor', label: '监控', content: <div>监控内容</div> }]}
      onBack={onBack}
    />,
  )
  return { ...view, onBack }
}

describe('DetailPageFrame', () => {
  it('展示固定三项关键字段并执行父级返回', () => {
    const view = renderFrame()

    expect(view.getByTestId('detail-header')).toHaveTextContent('demo-vm运行中规格4C 8G镜像Ubuntu 22.04私网 IP10.0.1.12')
    expect(view.getByLabelText('详情面包屑')).not.toHaveTextContent('首页')

    act(() => view.getByRole('button', { name: '返回上一级' }).click())
    expect(view.onBack).toHaveBeenCalledTimes(1)
  })

  it('支持详情栏和分类折叠，并始终保留一个展开分类', () => {
    const view = renderFrame()
    const workspace = view.getByTestId('detail-workspace')

    expect(workspace).toHaveAttribute('data-left-collapsed', 'false')
    act(() => view.getByRole('button', { name: '收起详情栏' }).click())
    expect(workspace).toHaveAttribute('data-left-collapsed', 'true')
    expect(view.getByRole('button', { name: '展开详情栏' })).toBeInTheDocument()

    act(() => view.getByRole('button', { name: '折叠关联摘要' }).click())
    expect(view.getByRole('button', { name: '展开关联摘要' })).toHaveAttribute('aria-expanded', 'false')

    act(() => view.getByRole('button', { name: '折叠基本信息' }).click())
    expect(view.getByRole('button', { name: '折叠基本信息' })).toHaveAttribute('aria-expanded', 'true')
  })
})
