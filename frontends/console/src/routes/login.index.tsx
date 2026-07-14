import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button, Card, Typography } from '@arco-design/web-react'
import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { coreApi } from '@/api/client'
import { AuthCenterLayout } from '@/components/shell/AuthCenterLayout'
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert'
import { isAuthenticated } from '@/stores/auth'

export const Route = createFileRoute('/login/')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search.redirect === 'string' && search.redirect.startsWith('/') ? { redirect: search.redirect } : {},
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect = '/' } = Route.useSearch()

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: redirect, replace: true })
    }
  }, [navigate, redirect])

  const login = useMutation({
    mutationFn: async () => {
      const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/login/callback`
      const { data, error } = await coreApi.POST('/auth/oidc/begin', {
        body: { redirect_uri: redirectUri, tenant_name: 'default' },
      })
      if (error) throw error
      if (!data?.authorization_url) throw new Error('未返回授权地址')
      window.location.href = data.authorization_url
    },
  })

  return (
    <AuthCenterLayout>
      <Card className="w-full max-w-[400px]" title="登录 ANI Console">
        <Typography.Paragraph type="secondary" className="!mb-4">
          使用企业 OIDC 账号登录
        </Typography.Paragraph>
        <Button type="primary" long loading={login.isPending} onClick={() => login.mutate()}>
          OIDC 登录
        </Button>
        {login.isError ? (
          <div className="mt-4">
            <ApiErrorAlert error={login.error} title="登录失败" />
          </div>
        ) : null}
      </Card>
    </AuthCenterLayout>
  )
}
