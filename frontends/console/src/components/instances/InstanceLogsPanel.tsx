import { useEffect, useRef, useState } from 'react'
import { Alert, Empty, Select, Space, Spin, Typography } from '@arco-design/web-react'
import { coreApi, CORE_API_BASE } from '@/api/client'
import { ApiErrorAlert } from '@/components/feedback/ApiErrorAlert'
import type { operations } from '@/api/core-schema'

type ListInstanceLogsQuery = NonNullable<operations['listInstanceLogs']['parameters']['query']>
type LogLevel = NonNullable<ListInstanceLogsQuery['level']>
type StreamStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'polling'

const LEVEL_OPTIONS: LogLevel[] = ['debug', 'info', 'warn', 'error']
const LOG_TAIL_LINES = 100
const AUTO_SCROLL_THRESHOLD_PX = 24
const FALLBACK_POLL_MS = 2000

function buildLogStreamUrl(instanceId: string, level: LogLevel, container?: string): string {
  const params = new URLSearchParams({
    follow: 'true',
    tail_lines: String(LOG_TAIL_LINES),
    level,
  })
  if (container) params.set('container', container)
  return `${CORE_API_BASE}/instances/${encodeURIComponent(instanceId)}/logs?${params.toString()}`
}

async function fetchInstanceLogs(instanceId: string, level: LogLevel): Promise<string> {
  const { data, error } = await coreApi.GET('/instances/{instance_id}/logs', {
    params: { path: { instance_id: instanceId }, query: { follow: false, limit: LOG_TAIL_LINES, level } },
    parseAs: 'text',
  })
  if (error) throw error
  return data ?? ''
}

export function InstanceLogsPanel({
  instanceId,
  active,
  container,
}: {
  instanceId: string
  active: boolean
  container?: string
}) {
  const [level, setLevel] = useState<LogLevel>('info')
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle')
  const outputRef = useRef<HTMLDivElement | null>(null)
  const shouldAutoScrollRef = useRef(true)

  useEffect(() => {
    const output = outputRef.current
    if (!output || !shouldAutoScrollRef.current) return
    output.scrollTop = output.scrollHeight
  }, [logs])

  useEffect(() => {
    if (!active) {
      setStreamStatus('idle')
      return
    }

    let cancelled = false
    let eventSource: EventSource | null = null
    let pollTimer: number | null = null

    async function loadHistory() {
      setLoading(true)
      setError(null)
      try {
        const history = await fetchInstanceLogs(instanceId, level)
        if (cancelled) return
        setLogs(history)
      } catch (err) {
        if (cancelled) return
        setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function startPollingFallback() {
      setStreamStatus('polling')
      pollTimer = window.setInterval(async () => {
        try {
          const history = await fetchInstanceLogs(instanceId, level)
          if (!cancelled) setLogs(history)
        } catch (err) {
          if (!cancelled) setError(err)
        }
      }, FALLBACK_POLL_MS)
    }

    async function connect() {
      await loadHistory()
      if (cancelled) return

      if (!('EventSource' in window)) {
        await startPollingFallback()
        return
      }

      setStreamStatus('connecting')
      eventSource = new EventSource(buildLogStreamUrl(instanceId, level, container), { withCredentials: true })
      eventSource.onopen = () => {
        if (!cancelled) setStreamStatus('connected')
      }
      eventSource.onerror = () => {
        if (!cancelled) setStreamStatus('reconnecting')
      }
      const appendLog = (event: MessageEvent<string>) => {
        setLogs((current) => (current ? `${current}\n${event.data}` : event.data))
      }
      eventSource.onmessage = appendLog
      eventSource.addEventListener('log', appendLog)
    }

    connect()

    return () => {
      cancelled = true
      eventSource?.close()
      if (pollTimer) window.clearInterval(pollTimer)
    }
  }, [active, container, instanceId, level])

  const handleScroll = () => {
    const output = outputRef.current
    if (!output) return
    const distanceToBottom = output.scrollHeight - output.scrollTop - output.clientHeight
    shouldAutoScrollRef.current = distanceToBottom <= AUTO_SCROLL_THRESHOLD_PX
  }

  if (!active) return <Empty description="打开日志 Tab 后加载实时日志" />

  return (
    <div className="space-y-3">
      <Space wrap>
        <Typography.Text type="secondary">级别过滤</Typography.Text>
        <Select data-testid="instance-log-level-select" value={level} onChange={setLevel} style={{ width: 140 }}>
          {LEVEL_OPTIONS.map((item) => (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          ))}
        </Select>
        <Typography.Text type="secondary">
          {streamStatus === 'polling' ? '当前环境不支持 EventSource，已降级为 2 秒刷新' : null}
          {streamStatus === 'connected' ? '实时日志已连接' : null}
          {streamStatus === 'connecting' ? '正在连接实时日志…' : null}
        </Typography.Text>
      </Space>
      {streamStatus === 'reconnecting' ? <Alert type="warning" content="日志流连接中断，正在重连" /> : null}
      {error ? <ApiErrorAlert error={error} /> : null}
      <div
        ref={outputRef}
        className="max-h-[520px] overflow-auto rounded border border-[var(--color-border-2)]"
        onScroll={handleScroll}
      >
        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8">
            <Empty description="暂无日志" />
          </div>
        ) : (
          <pre className="m-0 whitespace-pre-wrap break-words bg-[var(--color-fill-1)] p-3 font-mono text-xs leading-5 text-[var(--color-text-1)]">
            {logs}
          </pre>
        )}
      </div>
    </div>
  )
}
