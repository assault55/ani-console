import { useEffect, useRef, useState } from 'react'
import RFB from '@novnc/novnc'
import { Alert, Spin, Tag } from '@arco-design/web-react'
import { coreApi } from '@/api/client'

type ConsoleStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

const STATUS_META: Record<ConsoleStatus, { text: string; color: string }> = {
  connecting: { text: '连接中', color: 'blue' },
  connected: { text: '已连接', color: 'green' },
  disconnected: { text: '已断开', color: 'gray' },
  error: { text: '连接异常', color: 'red' },
}

export function InstanceVncConsole({
  instanceId,
  protocol = 'vnc',
}: {
  instanceId: string
  protocol?: 'vnc' | 'novnc'
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rfbRef = useRef<RFB | null>(null)
  const [status, setStatus] = useState<ConsoleStatus>('connecting')
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let rfb: RFB | null = null

    const connect = async () => {
      setStatus('connecting')
      setErrorText(null)
      try {
        const { data, error } = await coreApi.POST('/instances/{instance_id}/console', {
          params: { path: { instance_id: instanceId } },
          body: { protocol },
        })
        if (error) throw error
        const url = data?.url || data?.connect_url
        if (!url) throw new Error('控制台连接地址为空')
        if (disposed) return

        rfb = new RFB(host, url)
        rfb.scaleViewport = true
        rfb.resizeSession = true
        rfb.background = '#0b0e16'
        rfb.addEventListener('connect', () => {
          if (!disposed) setStatus('connected')
        })
        rfb.addEventListener('disconnect', () => {
          if (!disposed) setStatus('disconnected')
        })
        rfb.addEventListener('securityfailure', (event) => {
          if (disposed) return
          setStatus('error')
          const detail = event instanceof CustomEvent ? event.detail : undefined
          setErrorText(typeof detail?.reason === 'string' ? detail.reason : 'VNC 安全握手失败')
        })
        rfbRef.current = rfb
      } catch (e) {
        if (disposed) return
        setStatus('error')
        setErrorText(e instanceof Error ? e.message : '控制台连接失败')
      }
    }

    void connect()

    return () => {
      disposed = true
      rfbRef.current = null
      rfb?.disconnect()
    }
  }, [instanceId, protocol])

  const meta = STATUS_META[status]

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0e16] text-white">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-3">
        <div className="truncate text-sm text-gray-300">VNC 控制台</div>
        <Tag color={meta.color}>{meta.text}</Tag>
      </div>
      {errorText ? (
        <div className="p-3">
          <Alert type="error" content={errorText} />
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1">
        {status === 'connecting' ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b0e16]/80">
            <Spin />
          </div>
        ) : null}
        <div ref={hostRef} data-testid="instance-vnc-console" className="h-full w-full overflow-hidden" />
      </div>
    </div>
  )
}
