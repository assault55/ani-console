import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { coreApi } from '@/api/client'
import { PageHeader } from '@/components/shell/AppShell'
import { CursorTable } from '@/components/tables/CursorTable'

export const Route = createFileRoute('/_authenticated/sandbox-templates/')({
  component: SandboxTemplatesPage,
})

function SandboxTemplatesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sandbox-templates'],
    queryFn: async () => {
      const { data, error } = await coreApi.GET('/sandbox-templates', { params: { query: { limit: 50 } } })
      if (error) throw error
      return data
    },
  })

  type Row = { id: string; name?: string; kind?: string }
  const items = (data?.items ?? []) as Row[]

  return (
    <>
      <PageHeader title="Sandbox 模板" subtitle="预置沙箱运行环境模板" />
      <CursorTable<Row>
        columns={[
          { title: 'ID', dataIndex: 'id' },
          { title: '名称', dataIndex: 'name' },
          { title: '类型', dataIndex: 'kind' },
        ]}
        data={{ items, next_cursor: data?.next_cursor }}
        loading={isLoading}
        error={error}
        rowKey="id"
        emptyDescription="暂无 Sandbox 模板"
      />
    </>
  )
}
