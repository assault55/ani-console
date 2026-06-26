export const scopePattern = /^scope:[a-z0-9_-]+:(\*|[a-z0-9_-]+)$/
export const bucketNamePattern = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/

export function isValidScope(value: string): boolean {
  return scopePattern.test(value.trim())
}

export function parseScopeList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label}不能为空`)
  return trimmed
}

export function assertMaxLength(value: string, max: number, label: string): string {
  if (value.length > max) throw new Error(`${label}不能超过 ${max} 个字符`)
  return value
}

export function assertIntegerRange(value: number, min: number, max: number, label: string): number {
  if (!Number.isInteger(value)) throw new Error(`${label}必须是整数`)
  if (value < min || value > max) throw new Error(`${label}必须在 ${min}-${max} 之间`)
  return value
}

export function optionalIsoDateTime(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const timestamp = Date.parse(trimmed)
  if (Number.isNaN(timestamp)) throw new Error('过期时间必须是有效的日期时间')
  return new Date(timestamp).toISOString()
}
