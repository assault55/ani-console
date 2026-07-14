import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, Layout, Modal, Typography, Space } from '@arco-design/web-react'
import { SideMenu } from './SideMenu'
import { useBrandingStore } from '@/stores/branding'
import { coreApi } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { newIdempotencyKey } from '@/lib/idempotency'

const { Header, Sider, Content } = Layout

/** 页面模板 2.0 §3：顶栏 56–64px、侧栏 220–240px、内容区 padding 16–24px */
const SHELL = {
  headerHeight: 60,
  siderWidth: 232,
} as const

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const branding = useBrandingStore((s) => s.branding)
  const name = branding?.platform_name ?? 'ANI Console'
  const navigate = useNavigate()
  const clear = useAuthStore((s) => s.clear)

  const logout = useMutation({
    mutationFn: async () => {
      const jti = useAuthStore.getState().getAccessTokenJti()
      if (!jti) throw new Error('当前 access token 缺少 jti，无法调用服务端登出')
      const { error } = await coreApi.POST('/auth/logout', { body: { jti, idempotency_key: newIdempotencyKey() } })
      if (error) throw error
    },
    onSettled: () => {
      clear()
      navigate({ to: '/login' })
    },
  })

  const confirmLogout = () => {
    Modal.confirm({
      title: '确认退出登录',
      content: '退出后需重新通过 OIDC 登录。',
      okButtonProps: { status: 'danger' },
      onOk: () => logout.mutateAsync(),
    })
  }

  return (
    <Layout className="min-h-screen">
      <Header
        className="flex items-center justify-between border-b px-6"
        style={{
          height: SHELL.headerHeight,
          borderColor: 'var(--color-border-2)',
          background: 'var(--color-bg-2)',
        }}
      >
        <Typography.Text className="text-base font-semibold">{name}</Typography.Text>
        <Button type="text" status="danger" loading={logout.isPending} onClick={confirmLogout}>
          退出登录
        </Button>
      </Header>
      <Layout className="min-h-0 flex-1">
        <Sider
          className="border-r"
          style={{
            width: SHELL.siderWidth,
            background: 'var(--color-bg-2)',
            borderColor: 'var(--color-border-2)',
          }}
          breakpoint="lg"
          collapsible
        >
          <SideMenu />
        </Sider>
        <Content className="p-5" style={{ background: 'var(--color-bg-1)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string
  subtitle?: string
  extra?: React.ReactNode
}) {
  return (
    <header className="mb-5">
      <Space align="start" className="w-full justify-between">
        <div className="min-w-0">
          <Typography.Title heading={5} className="!m-0 !text-[20px] !font-semibold">
            {title}
          </Typography.Title>
          {subtitle ? (
            <Typography.Text type="secondary" className="mt-1 block text-sm">
              {subtitle}
            </Typography.Text>
          ) : null}
        </div>
        {extra ? <Space className="shrink-0">{extra}</Space> : null}
      </Space>
    </header>
  )
}
