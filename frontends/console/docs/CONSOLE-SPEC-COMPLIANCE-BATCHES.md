# ANI Console · 规范合规落地批次（SCB）

> **配套**：[DESIGN-SPEC-FREEZE.md](../../DESIGN-SPEC-FREEZE.md)（设计规范 2.0 已冻结）  
> **最后更新**：2026-06-25  
> **原则**：先读规范 → 再改代码 → 每批 `npm run verify` → 写 `SPRINT-SCB-xx` 过程记录

---

## 1. 与功能 Sprint（P18+）的关系

| 轨道 | 文档 | 目标 |
|------|------|------|
| **SCB（本文件）** | 规范合规落地 | 存量页面按 2.0 设计规范对齐（Arco、模板、三态、Token、Tailwind 边界） |
| **P** | CONSOLE-TASK-PLAN §2.2 | 新功能 / API 缺口（如 P18 网络详情） |

同一批次可**同时**完成 SCB 合规与 P 功能，但 SCB 序号须按本文件顺序推进，不得跳过壳层与认证。

---

## 2. 批次总览

| 批次 | 名称 | 范围 | 页面模板（见页面模板 2.0） | 状态 |
|------|------|------|---------------------------|------|
| SCB-01 | 壳层与共享组件 | `AppShell`、`SideMenu`、`PageHeader`、`CursorTable`、`PlaceholderPage`、`StatusTag`、`ApiErrorAlert`、`SimpleResourceCrud` | 壳层 / 列表基座 | ✅ |
| SCB-02 | 认证与设置 | `/login`、`/login/callback`、`/settings`、`/settings/api-keys` | 表单 / 列表 | ✅ |
| SCB-03 | 概览 | `/` Dashboard | 概览 | ✅ |
| SCB-04 | 实例与算力 | `/instances/*`、`/gpu-inventory`、`/sandbox-templates` | 列表 / 详情 / 表格+检查器 | ✅ |
| SCB-05 | 存储 | `/volumes/*`、`/filesystems/*`、`/objects` | 列表 / 详情 | ✅ |
| SCB-06 | 网络 | `/networks/*` 五类 | 列表（+ P18 详情 Drawer） | ✅ |
| SCB-07 | 向量库 | `/vector-stores` | 列表（+ P18 详情） | ✅ |
| SCB-08 | K8s | `/k8s-clusters` | 列表+详情 / 表格+检查器 | ✅ |
| SCB-09 | Registry | `/registry` | 多级导航 / 列表 | ✅ |
| SCB-10 | 安全与密钥 | `/encryption`、`/secrets/*` | 列表 / 详情 / 表单 | ✅ |
| SCB-11 | 监控与用量 | `/observability`、`/usage`、`/instance-operations/*` | 概览+查询 / 列表 / 详情 | ✅ |
| SCB-12 | 占位页 | `/bare-metal`、`/notifications`、`/audit` | 占位（契约就绪后再做） | ⏸ 阻塞于 API |

**当前应做**：**SCB-12**（占位页，阻塞于 API）

---

## 3. 单批次完成标准

每批 **SCB-xx** 完成时必须全部满足：

1. **只读**对照冻结规范，在 `SPRINT-SCB-xx-*.md` 中写明：采用的页面模板、Arco 组件清单、三态方案。
2. 代码符合 [样式与 Tailwind 边界 2.0](../../产品设计规范-样式与Tailwind边界-2.0.md)：Arco 组件 + Token；Tailwind 仅布局。
3. 用 [评审清单 2.0](../../产品设计规范-评审清单-2.0.md) 相关章节自检（可在 sprint 文档附勾选摘要）。
4. `cd frontends/console && npm run verify` 全绿。
5. 本文件对应行状态改为 ✅；更新 [CONSOLE-TASK-PLAN.md](./CONSOLE-TASK-PLAN.md) §2.3。

**禁止**：在未完成当前 SCB 时大规模改动后续批次路由；禁止修改任何冻结设计规范 `.md`。

---

## 4. 批次明细

### SCB-01 — 壳层与共享组件

**文件**：`src/components/shell/*`、`src/components/tables/CursorTable.tsx`、`src/components/crud/SimpleResourceCrud.tsx`、`src/components/PlaceholderPage.tsx`、`src/components/feedback/*`

**验收**：

- [x] 壳层使用 Arco `Layout`/`Menu`；布局优先 Tailwind utilities + Token
- [x] 侧栏选中态、折叠与页面模板 2.0 壳层章一致
- [x] `CursorTable` 统一 loading / empty / error
- [x] 共享组件无 TDesign / 手写平行 Button·Table

---

### SCB-02 — 认证与设置

**路由**：`login.tsx`、`login.callback.tsx`、`settings/*`

**验收**：

- [x] 登录页模板类型明确（表单页）
- [x] API Key 列表符合列表模板 + 三态
- [x] 危险操作（吊销 Key）`Modal` 确认

---

### SCB-03 — 概览 Dashboard

**路由**：`_authenticated/index.tsx`

**验收**：

- [x] 概览模板：指标卡 + 表格区层级清晰
- [x] ECharts 色板对齐 Arco 状态色
- [x] 无卡片滥用

---

### SCB-04 — 实例与算力

**路由**：`instances/*`、`gpu-inventory`、`sandbox-templates`

**验收**：

- [x] 实例列表符合列表模板 + 三态
- [x] 实例详情模板 C：单一 primary + Tab 三态
- [x] GPU 清单指标卡 + 图表 Arco 色板
- [x] 操作记录 `CursorTable` 三态

**过程文档**：[SPRINT-SCB-04-instances-compute.md](./sprints/SPRINT-SCB-04-instances-compute.md)

---

### SCB-05 — 存储

**路由**：`volumes/*`、`filesystems/*`、`objects`

**验收**：

- [x] 块存储 / 文件存储列表三态
- [x] 详情页分区 loading + 子表 `CursorTable`
- [x] 对象存储 Tab 分区 + 未选桶 `Empty`

**过程文档**：[SPRINT-SCB-05-storage.md](./sprints/SPRINT-SCB-05-storage.md)

---

### SCB-06 — 网络

**路由**：`networks/vpcs|subnets|security-groups|load-balancers|routes`

**验收**：

- [x] 五类列表三态 + 空态文案
- [x] VPC/子网/安全组/LB GET 详情 Drawer
- [x] 路由自定义列（无 GET 详情 API）

**过程文档**：[SPRINT-SCB-06-networks.md](./sprints/SPRINT-SCB-06-networks.md)

---

### SCB-07 — 向量库

**路由**：`vector-stores`

**验收**：

- [x] 列表三态 + 空态文案
- [x] GET 详情 Drawer + 检索/插入 Tab
- [x] 检索结果 CursorTable 三态

**过程文档**：[SPRINT-SCB-07-vector-stores.md](./sprints/SPRINT-SCB-07-vector-stores.md)

---

### SCB-08 — K8s

**路由**：`k8s-clusters`

**验收**：

- [x] 列表 CursorTable 三态
- [x] 详情模板 C + Tab 子表三态
- [x] 危险操作 Modal 确认

**过程文档**：[SPRINT-SCB-08-k8s.md](./sprints/SPRINT-SCB-08-k8s.md)

---

### SCB-09 — Registry

**路由**：`registry`

**验收**：

- [x] 三级导航 CursorTable 三态
- [x] 未选层级 Empty 引导
- [x] 扫描报告结构化展示

**过程文档**：[SPRINT-SCB-09-registry.md](./sprints/SPRINT-SCB-09-registry.md)

---

### SCB-10 — 安全与密钥

**路由**：`encryption`、`secrets/*`

**验收**：

- [x] 加密密钥/Secret 列表三态
- [x] Secret 详情模板 C + 绑定表单
- [x] Seal/Unseal 区结构化展示

**过程文档**：[SPRINT-SCB-10-security-secrets.md](./sprints/SPRINT-SCB-10-security-secrets.md)

---

### SCB-11 — 监控与用量

**路由**：`observability`、`usage`、`instance-operations/*`

**验收**：

- [x] 监控查询/规则列表三态
- [x] 用量指标卡 + 趋势图
- [x] 操作详情与步骤表格化

**过程文档**：[SPRINT-SCB-11-observability-usage.md](./sprints/SPRINT-SCB-11-observability-usage.md)

---

### SCB-12 — 占位页

**路由**：`bare-metal`、`notifications`、`audit`

**验收（阻塞态可做部分）**：

- [x] 三页统一 Placeholder 模板
- [x] E2E smoke（可达 + 文案）
- [ ] 真实业务实现（待 Core API 契约）

**过程文档**：[SPRINT-SCB-12-placeholders.md](./sprints/SPRINT-SCB-12-placeholders.md)

## 5. 过程文档命名

```text
docs/sprints/SPRINT-SCB-01-shell-shared.md
docs/sprints/SPRINT-SCB-02-auth-settings.md
…
```

---

## 6. 变更日志

| 日期 | 事项 |
|------|------|
| 2026-06-25 | SCB-12 阻塞态收尾完成（占位页 + E2E smoke） |
| 2026-06-25 | SCB-10/11 完成；当前仅剩 SCB-12（API 阻塞） |
| 2026-06-25 | 初版；SCB-01～12 立项；设计规范 2.0 冻结后启用 |
