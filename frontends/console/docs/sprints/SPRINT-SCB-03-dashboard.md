# SPRINT-SCB-03 · 概览 Dashboard（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐 `/` 概览页至页面模板 2.0 **模板 A（Dashboard）**。

**结构**：PageHeader → 4 指标卡（Statistic）→ 用量趋势图（ECharts）→ 最近实例表 + 最近操作表。

**三态**：分区 loading（Spin）/ error（ApiErrorAlert）/ empty（Empty），非整页阻塞。

---

## 2. 变更清单

| 路径 | 变更 |
|------|------|
| `src/components/dashboard/MetricCard.tsx` | 新增：Card + Arco `Statistic` |
| `src/routes/_authenticated/index.tsx` | 响应式 Grid；分区三态；实例名可点击；Arco 主色图表 |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 9 ✓ | build ✓
```

---

## 4. 下一批

**SCB-04** 实例与算力：`/instances/*`、`/gpu-inventory`、`/sandbox-templates`
