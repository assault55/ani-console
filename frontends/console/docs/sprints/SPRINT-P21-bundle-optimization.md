# SPRINT-P21 · 性能与分包

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

- 处理 build 大包告警，先完成首轮分包优化闭环。
- 在不改业务行为前提下降低主入口 chunk 体积。

---

## 2. 变更清单（强制：改了哪里 / 新增哪里）

### 2.1 新增文件

| 路径 | 说明 |
|------|------|
| `src/components/charts/CoreLineBarChart.tsx` | 基于 `echarts/core` 的线图/柱图按需组件 |
| `src/components/charts/CorePieChart.tsx` | 基于 `echarts/core` 的饼图按需组件 |

### 2.2 修改文件

| 路径 | 变更摘要 |
|------|----------|
| `vite.config.ts` | 启用 `tanstackRouter.autoCodeSplitting`；保留 `vendor-tanstack` 分包 |
| `src/routes/_authenticated/index.tsx` | 用量趋势图切换为 `CoreLineBarChart` |
| `src/routes/_authenticated/usage/index.tsx` | 用量图切换为 `CoreLineBarChart` 并补齐图表类型常量 |
| `src/routes/_authenticated/gpu-inventory/index.tsx` | 占用分布图切换为 `CorePieChart` |
| `e2e/dashboard.spec.ts` | 分包后首页渲染等待时间调整 |
| `e2e/instances.spec.ts` | 分包后导航稳定性等待调整 |
| `e2e/navigation.spec.ts` | 分包后侧栏跳转稳定性等待调整 |

### 2.3 删除 / 废弃

| 路径 | 原因 |
|------|------|
| `src/components/charts/CoreEChart.tsx` | 拆分为按图表类型组件，避免共享重包 |

### 2.4 契约 / 配置

| 项 | 说明 |
|----|------|
| `openapi/v1.yaml` | 无变更 |
| 环境变量 | 无 |

---

## 3. 测试

### 3.1 单元测试

| 文件 | 新增用例说明 |
|------|--------------|
| 无 | 本批次为打包配置调整 |

### 3.2 E2E

| 文件 | 场景 |
|------|------|
| `e2e/dashboard.spec.ts` | 概览页分包后加载稳定性回归 |
| `e2e/instances.spec.ts` | GPU 清单导航与渲染回归 |
| `e2e/navigation.spec.ts` | 侧栏导航分组跳转回归 |
| 全量既有 E2E | 回归无行为变化（22 条通过） |

### 3.3 验收命令与结果

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 22 ✓ | build ✓
```

---

## 4. 文档更新（本阶段触达的索引）

- [x] `docs/sprints/SPRINT-P21-bundle-optimization.md`（本文件）
- [x] `docs/CONSOLE-SPRINT-PHASES.md` 活跃表
- [x] `docs/CONSOLE-TASK-PLAN.md` 待办/覆盖表（若范围变化）
- [ ] `CONVENTIONS.md`（若约定变化）

---

## 5. 已知限制 / 后续

- 样式包仍较大（`index.css`），后续可视需要再做样式层优化。

---

## 6. 下一阶段的入口

- 后续可选：围绕样式包体积做独立微批次（不阻塞当前门禁）
