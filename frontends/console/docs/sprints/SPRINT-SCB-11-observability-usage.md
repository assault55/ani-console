# SPRINT-SCB-11 · 监控与用量（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐 `/observability`、`/usage`、`/instance-operations/*` 至冻结规范。

| 路由 | 页面模板 |
|------|----------|
| `/observability` | 概览+查询（Tab） |
| `/usage` | 概览指标 + 趋势图 |
| `/instance-operations/$id` | 模板 C 详情 + 步骤表 |

**Arco**：`Tabs`、`CursorTable`、`Descriptions`、`MetricCard`、`Empty`、`Spin`。

---

## 2. 变更清单

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/observability/index.tsx` | 查询结果表格化；规则列表 `CursorTable`；编辑/创建规则 Modal 合规 |
| `src/routes/_authenticated/usage/index.tsx` | 指标卡 + 柱状图分区，空态与错误态统一 |
| `src/routes/_authenticated/instance-operations/$operationId.tsx` | 详情 `Descriptions` + 执行步骤 `CursorTable`，去除 JSON 堆砌 |
| `e2e/support/api-mock.ts` | 新增 observability query 与 operation detail fixture |
| `e2e/observability-usage.spec.ts` | 新增监控与用量 E2E |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 19 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 查询/列表/详情均有 loading / error / empty
- [x] 用量图表与指标分区清晰
- [x] 操作步骤以表格展示，可读性一致
- [x] Arco + Token + Tailwind 布局 only

---

## 5. 下一批

**SCB-12** 占位页（阻塞于 API）：`/bare-metal`、`/notifications`、`/audit`
