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

---

## 15. 容器实例创建网络模式与 IP 分配（2026-07-07）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/index.tsx` | 创建实例表单新增“默认网络 / VPC 网络”选择；默认网络不提交 `network`；VPC 网络需选择 VPC/子网，并支持“自动分配 / 手动指定”固定 IP |
| `src/routes/_authenticated/instances/index.tsx` | 手动指定 IP 时按所选子网 CIDR 预填并锁定网络段，提交 `network.private_ip`；自动分配时仅提交 `vpc_id/subnet_id` |
| `e2e/instances.spec.ts` | 覆盖容器创建页默认网络、VPC 自动 IP、VPC 手动 IP 三类请求体，并同步弹窗创建实例的 VPC/固定 IP 流程 |

验收：

```bash
npm run typecheck
npx playwright test e2e/instances.spec.ts -g '创建容器实例支持默认网络、VPC 自动 IP 和手动 IP'
npx playwright test e2e/instances.spec.ts
```

---

## 16. 容器实例内嵌终端（2026-07-07）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/$instanceId.tsx` | “终端”从直接 `window.open(ws_url)` 改为页面内弹窗连接；调用 `POST /instances/{id}/exec` 后用 WebSocket 连接 `ws_url`，在页面内展示输出并支持发送输入 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 保留 Container、Command、TTY 配置；Rows/Cols 改为固定默认值随请求提交，不再暴露给用户手填 |
| `e2e/instances.spec.ts` | 覆盖容器实例终端请求体、WebSocket 连接、页面内输出、发送输入，以及不再打开新窗口 |

验收：

```bash
npm run typecheck
npx playwright test e2e/instances.spec.ts -g '容器实例终端在页面内连接 exec WebSocket'
npx playwright test e2e/instances.spec.ts
```

---

## 17. 容器实例终端 Core exec 契约对齐（2026-07-07）

根目录最新 `v1.yaml` 已同步到 `openapi/v1.yaml` 并重新生成 Console Core schema。本轮按 Core 当前契约收敛容器实例终端：仅创建 exec session 的 POST 使用登录态 Bearer，WebSocket 直接使用 `ws_url` 握手；输入、输出和 resize 均按原始帧/JSON 控制帧处理。

| 路径 | 变更摘要 |
|------|----------|
| `openapi/v1.yaml`、`src/api/core-schema.d.ts` | 同步 exec session 与 WebSocket 连接契约，补齐 `token`、`expires_at` 和 `/instances/{id}/exec/{session_id}` 说明 |
| `src/components/instances/InstanceTerminal.tsx` | 初始化 xterm + FitAddon 后读取实际 `rows/cols` 创建 session；请求体发送 `container: null`、`command: ["/bin/sh"]`、`tty: true`；WebSocket 使用 `ws_url` 直连，仅在缺少 token query 时用响应 `token` fallback |
| `src/components/instances/InstanceTerminal.tsx` | `onData` 原样发送输入；string / ArrayBuffer / Blob 输出直接写入 terminal；xterm/容器 resize 发送 `{ type: "resize", cols, rows }`；卸载/关闭弹窗时释放 listener、关闭 WebSocket、dispose terminal |
| `e2e/instances.spec.ts` | 覆盖 Bearer 仅用于 POST、`container: null`、`ws_url` 直连、输入原样发送、resize 控制帧、binary/blob 输出解码与关闭弹窗清理 WebSocket |

验收：

```bash
npm run codegen
npm run typecheck
npm run test -- InstanceLogsPanel.test.tsx
npx playwright test e2e/instances.spec.ts -g "容器实例终端"
```

---

## 18. 容器实例终端 StrictMode 重复请求修复（2026-07-07）

根因：Console 入口启用 React `StrictMode`，开发态会执行 mount-cleanup-remount；终端组件在 mount effect 内立即创建 exec session，导致点击一次“终端”时 `POST /instances/{id}/exec` 被发出两次。

| 路径 | 变更摘要 |
|------|----------|
| `src/components/instances/InstanceTerminal.tsx` | 将 exec session 创建延后一帧启动，并在 effect cleanup 中取消未发出的连接；StrictMode 第一次探测挂载不再触发真实 POST，正常挂载与“重新连接”仍会创建 session |
| `src/components/instances/InstanceTerminal.test.tsx` | 新增 StrictMode 回归单测，验证组件双挂载探测下只创建一个 exec session |

联调说明：WebSocket 仍按 Core 契约直接连接后端返回的 `ws_url`。若返回 `ws://192.168.102.75:30080/...`，浏览器会绕过 `localhost:5173` 与 Vite `/api` 代理直接访问该地址；连接失败需优先核查该 NodePort/网关地址是否可从浏览器网络访问，以及后端是否按当前访问入口生成了可达的 `ws_url`。

验收：

```bash
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx
npm run typecheck
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx src/components/instances/InstanceLogsPanel.test.tsx
npx playwright test e2e/instances.spec.ts -g '容器实例终端在页面内连接 exec WebSocket'
```

---

## 19. 容器实例终端输入焦点修复（2026-07-07）

现象：exec WebSocket 已连接，但在终端弹窗中输入命令没有反应。前端 stdin 发送依赖 xterm `onData`，而 `onData` 只有在 xterm 输入区域拿到焦点时触发；Modal 打开后焦点可能停留在弹窗按钮或外层元素。

| 路径 | 变更摘要 |
|------|----------|
| `src/components/instances/InstanceTerminal.tsx` | WS open 后下一帧聚焦 xterm；终端区域 `mousedown` 时显式调用 `term.focus()`，确保点击终端后键盘输入进入 xterm 并触发 `socket.send(data)` |
| `src/components/instances/InstanceTerminal.test.tsx` | 新增终端区域点击聚焦回归测试，覆盖 stdin 输入链路的焦点前置条件 |

验收：

```bash
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx
npm run typecheck
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx src/components/instances/InstanceLogsPanel.test.tsx
npx playwright test e2e/instances.spec.ts -g '容器实例终端在页面内连接 exec WebSocket'
```

---

## 20. 容器实例终端 KubeCloud WebSocket 帧协议兼容（2026-07-07）

参照 `/root/kubercon/kubercon-ui` 的 `components/Terminal/terminal.jsx`，实际可用终端后端使用 KubeCloud 风格 JSON 帧：stdin 为 `{ "Op": "stdin", "Data": "..." }`，resize 为 `{ "Op": "resize", "Cols": 120, "Rows": 30 }`，stdout 从响应 JSON 的 `Data` 字段读取。

| 路径 | 变更摘要 |
|------|----------|
| `src/components/instances/InstanceTerminal.tsx` | stdin 改为发送 `Op: stdin` 帧；resize 改为发送 `Op: resize` / `Cols` / `Rows` 帧；输出支持 JSON `Data` 解包，同时保留 plain string / ArrayBuffer / Blob 兼容 |
| `src/components/instances/InstanceTerminal.test.tsx` | 增加 KubeCloud stdin、resize、stdout `Data` 解包单测，保留 StrictMode 单请求与焦点回归覆盖 |
| `e2e/instances.spec.ts` | WebSocket mock 改为按 `Op: stdin` 回显 `Data`，并覆盖 JSON `Data` 输出渲染 |
| `docs/superpowers/plans/2026-07-07-instance-terminal-kubecloud-protocol.md` | 记录本次协议兼容实现计划 |

验收：

```bash
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx
npm run typecheck
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx src/components/instances/InstanceLogsPanel.test.tsx
npx playwright test e2e/instances.spec.ts -g '容器实例终端在页面内连接 exec WebSocket'
```

补充修正：现场后端即使返回 Core instance exec URL（如 `/instances/{name}/exec/{session}`），WebSocket 输出仍是 KubeCloud `Op/Data` JSON 帧；前端 stdin / resize 现默认发送 `{ "Op": "stdin", "Data": "..." }` 与 `{ "Op": "resize", "Cols": 120, "Rows": 30 }`，不再按 URL 猜测 raw 协议。

补充修正 2：若 xterm 隐藏输入框未获得焦点，浏览器 WS Frames 中不会出现 outbound stdin。终端容器现已设置 `tabIndex=0`，点击黑色终端区域时同时聚焦容器和 xterm；当 xterm `onData` 未触发且键盘事件落在容器自身时，容器 `keydown` 会将普通字符、Enter、Backspace、Tab、Escape 转为同一套 stdin 帧发送。`InstanceTerminal.test.tsx` 已覆盖输入 `ls + Enter` 时发出 `l`、`s`、`\r`。

---

## 21. 容器实例终端新窗口模式（2026-07-07）

按 `/root/kubercon/kubercon-ui` 的交互方式调整 Console 终端入口：详情页“终端”按钮改为 `window.open` 新页面，不再使用当前页 Modal。连接链路回退到当前可连通的 Core exec session：终端页面先调用 `POST /instances/{id}/exec` 获取 `ws_url`，再连接后端返回的 WebSocket；stdin / resize 默认使用 KubeCloud `Op/Data` JSON 帧。

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/$instanceId.tsx` | “终端”按钮改为打开 `/instances/terminal/{instanceId}` 新窗口，窗口尺寸参照 kubercon-ui 的 1200x800 可调整窗口 |
| `src/routes/instances/terminal/$instanceId.tsx`、`src/routeTree.gen.ts` | 新增根级终端页面，绕过 `_authenticated` 的 `AppShell` 菜单栏；页面仅保留极简标题、关闭按钮和全高终端 |
| `src/components/instances/InstanceTerminal.tsx` | 回退为 Core exec session 获取 `ws_url`；stdin / resize 默认发送 KubeCloud `Op/Data` 帧；fit 延迟到打开后两帧执行，减少 xterm 初始化期 `dimensions` 异常；键盘 fallback 捕获终端区域和激活窗口的 keydown；终端显示完全等待后端 stdout/stderr 回显，不做前端本地回显 |
| `src/components/instances/InstanceTerminal.test.tsx` | 覆盖 StrictMode 下只创建一个 Core exec session、默认 KubeCloud 帧、stdout `Data` 解包和键盘 fallback |
| `e2e/instances.spec.ts` | 覆盖详情页终端按钮打开新窗口，以及终端页面无菜单栏、POST Core exec 后连接返回的 KubeCloud WebSocket 并发送输入 |

验收：

```bash
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx
npm run typecheck
npm run test:unit -- src/components/instances/InstanceTerminal.test.tsx src/components/instances/InstanceLogsPanel.test.tsx
npx playwright test e2e/instances.spec.ts -g '实例列表可进入详情|容器实例终端新页面连接 exec WebSocket'
```

---

## 22. VM 实例 VNC 控制台新窗口模式（2026-07-08）

按现有 Core v1 契约接入 VM 控制台：详情页“控制台”按钮打开独立页面，不复用 `_authenticated` AppShell 菜单；控制台页面调用 `POST /instances/{id}/console` 获取 `url/connect_url`，并使用 noVNC `RFB` 连接后端返回的 VNC WebSocket。

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/$instanceId.tsx` | VM “控制台”按钮改为打开 `/instances/console/{instanceId}` 新窗口，容器终端入口保持 `/instances/terminal/{instanceId}` |
| `src/routes/instances/console/$instanceId.tsx`、`src/routeTree.gen.ts` | 新增根级 VNC 控制台页面，绕过 Console 菜单栏，仅保留标题、实例 ID、关闭按钮和全高 VNC 画布区域 |
| `src/components/instances/InstanceVncConsole.tsx`、`src/types/novnc.d.ts` | 新增 noVNC 控制台组件；调用 `POST /instances/{id}/console`，默认 `protocol: vnc`，连接返回的 `url/connect_url`，并处理连接中、已连接、断开和安全握手失败状态 |
| `package.json`、`package-lock.json`、`vite.config.ts` | 引入 `@novnc/novnc`；Vite 显式预构建 noVNC 并将 dev/build target 调整为 `esnext`，满足 noVNC 1.7 top-level await 要求 |
| `src/components/instances/InstanceVncConsole.test.tsx` | 覆盖 console session 创建、RFB 初始化参数与卸载断开 |
| `e2e/instances.spec.ts` | 覆盖 VM 详情页控制台入口打开独立 URL，以及控制台页无菜单栏并向 Core v1 发送 `protocol: vnc` |

验收：

```bash
npm run verify  # codegen/typecheck/unit passed; sandbox blocked pretest:e2e at playwright install
npx playwright test e2e/instances.spec.ts -g 'VM 实例控制台打开独立 VNC 页面'  # 1 passed
npx playwright test  # 37 passed
npm run build
```

真实集群验证（2026-07-09）：

- 使用临时 Bearer token 访问 Gateway `http://192.168.102.51:30080`；未带 token 请求返回 401，带 token 后 `GET /api/v1/instances?limit=20&kind=vm` 返回 200 空列表，确认鉴权链路通过。
- `POST /api/v1/instances/nonexistent-vm-for-console/console` 返回 400 `INSTANCE_CONSOLE_FAILED`，说明请求已进入实例控制台后端逻辑；当前租户无 VM 实例，暂无法完成真实 noVNC 会话握手与画面验证。
- 本地回归覆盖仍以 mock/e2e 验证控制台入口、独立页面和 `protocol: vnc` 请求契约。

---

## 23. 实例日志默认历史模式与手动实时开关（2026-07-09）

实例详情日志 Tab 默认只加载历史日志，不再自动连接 SSE 实时流；用户点击“开启实时”后才请求 `follow=true`，点击“停止实时”关闭连接。切换日志级别时会重新拉取历史日志；若实时已开启，则同步重连实时流。

| 路径 | 变更摘要 |
|------|----------|
| `src/components/instances/InstanceLogsPanel.tsx` | 拆分历史日志加载与实时流连接 effect；新增“开启实时 / 停止实时”按钮控制 EventSource 生命周期 |
| `src/components/instances/InstanceLogsPanel.test.tsx` | 覆盖默认不创建 EventSource、按钮开启/停止实时、实时开启后切换级别重连、卸载关闭和错误提示 |
| `docs/superpowers/plans/2026-07-09-instance-logs-manual-live.md` | 记录本轮行为调整计划 |

验收：

```bash
npm run test:unit -- src/components/instances/InstanceLogsPanel.test.tsx
```

补充修正：`follow=true` 实时日志接口仍要求 `Authorization: Bearer <access_token>`；浏览器原生 `EventSource` 无法设置该 header，会导致 Core 侧 tenant 解析为空并返回 401。实时日志现改为 `fetch` streaming，请求头显式携带当前登录 access token，通过 `response.body.getReader()` 解析 `text/event-stream` 的 `event: log` / `data: ...` 并追加日志；组件卸载、停止实时、实例或 level 变化时通过 `AbortController` 取消旧请求。

---

## 24. 实例详情生命周期按钮状态互斥（2026-07-13）

实例详情页按 `state` 互斥禁用生命周期按钮：`running` 时“启动”不可点击、“停止”可点击；非 `running` 时“启动”可点击、“停止”不可点击。覆盖 VM 与容器实例详情路由，避免重复启动运行中实例或停止非运行实例。

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/$instanceId.tsx` | 根据实例 `state` 设置“启动 / 停止”按钮 `disabled` 与提示文案 |
| `e2e/instances.spec.ts` | 新增 VM、容器 running/stopped 生命周期按钮互斥 E2E |

验收：

```bash
npx playwright test e2e/instances.spec.ts -g 'VM 和容器实例详情按运行状态禁用启动停止按钮'
npm run typecheck
npx playwright test e2e/instances.spec.ts
```

---

## 25. 全局详情页架构与 VM 详情接入（2026-07-30）

按详情页 V2 参考稿新增统一 `DetailPageFrame`：面包屑移除“首页”并提供父级返回；头部固定 80px，支持状态、三项关键字段和右侧操作；正文采用 452px 左侧详情栏与自适应右侧 Tab 区域。左栏支持整体收起、数据驱动的多分类折叠，并保证至少一个分类保持展开。

| 路径 | 变更摘要 |
|------|----------|
| `src/components/detailbase/*` | 新增统一详情页类型、布局样式、分类/分栏交互及组件单测 |
| `src/views/vm/detail/*` | VM 演示详情接入统一布局，提供监控、云盘 Tab 与云盘详情数据 |
| `src/routes/_authenticated/instances/vm/$instanceId*` | 接入 VM/云盘详情路由；演示实例使用新页面，其他实例保留 Core API 详情、VNC、终端与生命周期链路 |
| `e2e/instances.spec.ts` | 覆盖 80px 头部、三项关键字段、无首页面包屑、详情栏收起与父级返回 |

验收：

```bash
npm run typecheck
npm run test -- DetailPageFrame.test.tsx
npx playwright test e2e/instances.spec.ts -g 'VM 详情使用统一分栏布局并支持收起详情栏'
npx playwright test e2e/instances.spec.ts -g 'VM 和容器实例详情按运行状态禁用启动停止按钮'
npm run lint
npm run build
```

补充验证：全量单测 108/109 通过，剩余失败为演示菜单数量断言与当前菜单改动不一致；全量 E2E 50/71 通过，21 条失败均停在旧首页标题“概览”的公共前置断言，与当前首页改版不一致。Windows 下 `npm run verify` 的 Bash/`spawnSync('npx')` 包装不可直接运行，OpenAPI 类型已按脚本指定版本分步生成并确认无内容差异。

---

## 26. 容器实例独立列表（2026-07-30）

将 `/instances/container` 从通用实例列表中拆出，按 VM 列表的文件组织和 `pagebase` 页面骨架实现容器专用页面。列表继续使用 Core v1 `GET /instances?kind=container`，保留“名称、类型、VPC、子网、IP、状态、创建时间”字段，并补充“镜像、CPU / 内存、副本、发布、节点、访问地址”。创建和详情继续进入既有路由，不改动 VM、通用实例和公共组件实现。工具栏与 VM 列表保持一致，按勾选状态提供批量启动、停止和“更多”，右侧保留名称/ID 搜索；行内启动、停止、重启直接展示，详情、扩缩容、终端收纳到“更多”。除既有路由外，新增操作当前提供静态反馈。

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/container.tsx` | 容器列表路由改为装载独立 `ContainerInstancesPage`，子级创建与详情 `Outlet` 行为保持不变 |
| `src/views/container/*` | 新增容器列表页面、OpenAPI 类型映射、游标数据读取、状态/搜索筛选、原型字段映射、分页、排序、列设置、VM 同构批量操作栏与过渡状态轮询 |
| `src/views/container/data-source.test.ts` | 覆盖 `container` 数据隔离、多页游标、删除态排除、筛选、搜索、排序、分页和容器部署字段映射 |
| `e2e/container-instances.spec.ts` | 覆盖 `kind=container` 请求、完整列表字段、导出按钮、行操作及既有创建/详情路由 |

验收：

```bash
npm run typecheck
npm run test -- src/views/container/data-source.test.ts  # 3 passed
npx playwright test e2e/container-instances.spec.ts      # 操作栏已按 VM 结构渲染；用例后续被既有“类型/VPC/子网/IP”列断言拦截
npm run build
```

补充验证：全量单测 110/111 通过；唯一失败为既有 `side-menu-match.test.ts` 中 demo 菜单数量期望 1、实际 2，与本次容器页面变更无关，因此未修改公共菜单代码或测试。
