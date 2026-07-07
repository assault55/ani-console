# SPRINT-SCB-04 · 实例与算力（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐实例、GPU 清单、Sandbox 模板页面至冻结规范。

| 路由 | 页面模板 |
|------|----------|
| `/instances` | 模板 B 列表 + 三态 |
| `/instances/$id` | 模板 C 详情（单一 primary + Tab 区三态） |
| `/instances/$id/operations` | 模板 B 列表（`CursorTable`） |
| `/gpu-inventory` | 模板 A 分区指标 + 饼图 + 表格 |
| `/sandbox-templates` | 模板 B 列表（空态文案） |

**Arco**：`Card`、`Button`、`Descriptions`、`Tabs`、`Modal`、`Statistic`（经 `MetricCard`）、`Spin`、`Grid`、`Space`、`Empty`。

---

## 2. 变更清单

### 2.1 新增

| 路径 | 说明 |
|------|------|
| `e2e/instances.spec.ts` | 实例列表进详情、GPU 清单指标 E2E |

### 2.2 修改

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/index.tsx` | `space-y-4` 分区；空态文案 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 详情模板 C：单一 primary（控制台）；`TabQueryBody` 三态；删除 `Modal.confirm`；去掉 JSON 堆砌；`Descriptions` 响应式列 |
| `src/routes/_authenticated/instances/$instanceId.operations.tsx` | 改用 `CursorTable` |
| `src/routes/_authenticated/gpu-inventory/index.tsx` | `MetricCard`；Arco 色饼图；分区 loading |
| `src/routes/_authenticated/sandbox-templates/index.tsx` | `emptyDescription` 对齐规范 |
| `e2e/support/api-mock.ts` | 新增 `GET /instances/{id}` fixture |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 11 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 实例列表符合列表模板 + 三态
- [x] 实例详情单一 primary；危险删除 `Modal.confirm`
- [x] 操作记录 Tab 使用 `CursorTable` loading / empty / error
- [x] GPU 清单指标卡 + 图表色板对齐 Arco 主色
- [x] Arco + Token + Tailwind 布局 only

---

## 5. 下一批

**SCB-05** 存储：`/volumes/*`、`/filesystems/*`、`/objects`

---

## 6. 真实联调补丁（2026-07-06）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/index.tsx` | 创建实例表单增加 VPC/子网选择与可选固定 IP；提交 `network.vpc_id/subnet_id/private_ip` 给后端 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 实例详情概览展示 VPC、子网、内网 IP |
| `openapi/v1.yaml`、`src/api/core-schema.d.ts` | 从根目录后端 `v1.yaml` 同步 Core 契约，生成 `CreateInstanceRequest.network` / `InstanceRecord` 网络字段类型 |
| `e2e/instances.spec.ts`、`e2e/support/api-mock.ts` | 覆盖创建实例提交网络字段与详情展示网络字段 |

验收：

```bash
npm run codegen
npm run typecheck
npx playwright test e2e/instances.spec.ts
```

---

## 7. 实例列表网络列与侧栏匹配（2026-07-06）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/index.tsx` | 实例列表补 VPC、子网、IP 三列 |
| `src/lib/side-menu-match.ts` | 实例列表/详情等无直接侧栏 item 的路径回退选中所属 SubMenu，避免落到概览 |
| `src/lib/side-menu-match.test.ts` | 覆盖 `/instances` 与 `/instances/{id}` 选中算力分组 |
| `e2e/instances.spec.ts`、`e2e/support/api-mock.ts` | 覆盖实例列表展示网络字段 |

验收：

```bash
npm run test -- src/lib/side-menu-match.test.ts
npx playwright test e2e/instances.spec.ts e2e/navigation.spec.ts
```

---

## 8. 容器/VM 实例详情路由与菜单选中（2026-07-06）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/container/$instanceId.tsx` | 新增 `/instances/container/:id` 详情路由，复用统一实例详情组件 |
| `src/routes/_authenticated/instances/container/create.tsx` | 新增 `/instances/container/create` 独立创建页，承载较长的容器实例创建表单 |
| `src/routes/_authenticated/instances/container.tsx` | 容器列表父路由在详情路径渲染 `Outlet`，避免 URL 已变化但页面仍停留列表 |
| `src/routes/_authenticated/instances/vm/$instanceId.tsx` | 新增 `/instances/vm/:id` 详情路由，复用统一实例详情组件 |
| `src/routes/_authenticated/instances/vm/create.tsx`、`gpu/create.tsx`、`sandbox/create.tsx` | 新增 VM/GPU 容器/Sandbox 独立创建页，避免长表单挤在弹窗内 |
| `src/routes/_authenticated/instances/vm.tsx`、`gpu.tsx`、`sandbox.tsx` | 类型列表父路由在详情/创建子路径渲染 `Outlet`，保持列表/详情/创建切换一致 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 将详情页组件参数化，支持不同来源列表返回路径；删除成功后自动返回来源列表 |
| `src/routes/_authenticated/instances/index.tsx` | 抽出实例创建表单；所有类型化实例创建按钮改为跳转页面；容器/VM 实例列表详情链接改为类型化详情路径 |
| `src/routeTree.gen.ts` | 同步 TanStack Router route tree |
| `e2e/navigation.spec.ts`、`e2e/instances.spec.ts` | 覆盖类型化创建页跳转、容器/VM 详情菜单选中、删除返回列表与原创建提交流程 |

验收：

```bash
npm run test -- src/lib/side-menu-match.test.ts
npm run typecheck
npx playwright test e2e/navigation.spec.ts
npx playwright test e2e/instances.spec.ts
```

---

## 9. 实例详情日志展示修复（2026-07-06）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/$instanceId.tsx` | 日志 Tab 按 `InstanceLogEntry` schema 增加时间、级别、流、容器、内容列，并使用日志字段生成稳定 `rowKey` |
| `e2e/support/api-mock.ts` | 增加 `GET /instances/{id}/logs` fixture |
| `e2e/instances.spec.ts` | 覆盖详情页切换日志 Tab 后展示日志内容 |

验收：

```bash
npm run typecheck
npx playwright test e2e/instances.spec.ts
```

---

## 10. 实例详情操作按类型收敛（2026-07-06）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/$instanceId.tsx` | 仅 VM 实例展示“控制台”操作；容器/GPU 容器/Sandbox 详情保留“终端”操作 |
| `e2e/instances.spec.ts` | 覆盖容器实例详情不显示控制台、显示终端 |

验收：

```bash
npm run typecheck
npx playwright test e2e/instances.spec.ts
```

---

## 11. 实例实时日志流接入（2026-07-06）

| 路径 | 变更摘要 |
|------|----------|
| `src/api/client.ts` | 导出 `CORE_API_BASE=/api/v1`，供 SSE 使用相同 Gateway base path |
| `src/components/instances/InstanceLogsPanel.tsx` | 接入历史日志 `GET /instances/{id}/logs?limit=100&level=...` 与 SSE `/instances/{id}/logs/stream?tail_lines=100&level=...`；支持 level 过滤、EventSource 自动重连提示、卸载关闭与 EventSource 不可用时 2 秒 `/logs` 降级刷新 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 日志 Tab 切换为实时日志面板，仅打开日志 Tab 时连接日志流 |
| `src/components/instances/InstanceLogsPanel.test.tsx` | 覆盖 EventSource 创建路径、`log` 事件追加、level 变化重连、卸载关闭连接与 error 提示 |
| `src/components/charts/CoreLineBarChart.tsx`、`CorePieChart.tsx` | ECharts 注册改为 `echarts.use(...)`，消除 ESLint 顶层 hook 误判 |

验收：

```bash
npm run typecheck
npm run test
npm run lint
npx playwright test e2e/instances.spec.ts
npm run build
```

---

## 12. 实例日志文本契约对齐（2026-07-06）

根目录最新 `v1.yaml` 已同步到 `openapi/v1.yaml` 并重新生成 Console Core schema。本轮按新契约收敛实例日志：`GET /instances/{id}/logs` 默认 `follow=false`，返回一次性 `text/plain` 日志文本；`follow=true` 时同一路径返回 SSE。

| 路径 | 变更摘要 |
|------|----------|
| `openapi/v1.yaml`、`src/api/core-schema.d.ts` | 从根目录 `v1.yaml` 同步实例日志契约，移除独立 `/instances/{id}/logs/stream` operation，`listInstanceLogs` 支持 `follow` / `tail_lines` / `container` |
| `src/components/instances/InstanceLogsPanel.tsx` | 历史日志按 `text/plain` 渲染为等宽文本；实时日志改为 `/instances/{id}/logs?follow=true&tail_lines=100&level=...`；EventSource 不可用时继续用 `follow=false` 文本轮询 |
| `src/components/instances/InstanceLogsPanel.test.tsx` | 覆盖文本历史日志、`follow=true` SSE URL、文本事件追加、level 重连、卸载关闭与错误提示 |
| `e2e/support/api-mock.ts` | `/instances/{id}/logs` fixture 改为 `text/plain`，对齐默认 `follow=false` 输出日志文本 |

验收：

```bash
npm run codegen
npm run test -- InstanceLogsPanel.test.tsx
npm run typecheck
npm run test
npm run lint
npx playwright test e2e/instances.spec.ts
npm run build
```

完整 `npm run verify` 已执行到 E2E 阶段：unit 52/52 通过，实例相关 E2E 通过；全量 E2E 中既有设置/API Key 用例仍失败（`e2e/api-keys.spec.ts`、`e2e/auth-settings.spec.ts`），失败点不在本轮实例日志改动范围。

---

## 13. API Key E2E fixture 契约修复（2026-07-07）

| 路径 | 变更摘要 |
|------|----------|
| `e2e/support/api-mock.ts` | `GET/POST /auth/api-keys` fixture 补齐 `APIKeyInfo` 契约要求的 `scopes`、`rate_limit_rpm`、`is_active`，避免 API Key 页面渲染 `row.scopes.map(...)` 时因 mock 数据缺字段崩溃 |

验收：

```bash
npx playwright test e2e/api-keys.spec.ts e2e/auth-settings.spec.ts --workers=1
npm run test:e2e
```

`npm run test:e2e` 已复跑通过，全量 34 个 E2E 均通过。

---

## 14. 容器实例 IP 展示兜底修复（2026-07-07）

| 路径 | 变更摘要 |
|------|----------|
| `src/lib/instance-network.ts`、`src/lib/instance-network.test.ts` | 新增实例网络展示 helper；IP 优先读 `private_ip`，再兼容 `network.private_ip`、`ip_address`、`endpoint`、`ssh.host`；VPC/子网兼容顶层与 `network.*` |
| `src/routes/_authenticated/instances/index.tsx` | 实例列表 VPC/子网/IP 列改用统一兜底 helper，避免 provider 分配 IP 未写入顶层 `private_ip` 时显示空 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 实例详情概览的 VPC/子网/内网 IP 同步使用统一兜底 helper |

验收：

```bash
npm run test -- src/lib/instance-network.test.ts
npm run typecheck
npx playwright test e2e/instances.spec.ts
```
