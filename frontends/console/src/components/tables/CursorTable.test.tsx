import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CursorTable } from './CursorTable'

describe('CursorTable', () => {
  const columns = [{ title: 'ID', dataIndex: 'id' as const }]

  it('shows error alert', () => {
    render(
      <CursorTable
        columns={columns}
        error={new Error('boom')}
        rowKey="id"
      />,
    )
    expect(screen.getByText('加载失败')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(
      <CursorTable columns={columns} data={{ items: [] }} loading={false} rowKey="id" emptyDescription="无记录" />,
    )
    expect(screen.getByText('无记录')).toBeInTheDocument()
  })

  it('renders rows when data present', () => {
    render(
      <CursorTable columns={columns} data={{ items: [{ id: 'a1' }] }} loading={false} rowKey="id" />,
    )
    expect(screen.getByText('a1')).toBeInTheDocument()
  })
})
