# ANI Console · 前端工程约定

> 本文件是 `frontends/console/` 的**强制工程约定**，与 [产品设计规范 2.0](../../UI规范-2.0.md)（视觉/组件）互补。  
> **设计规范 2.0 已冻结**：见 [DESIGN-SPEC-FREEZE.md](../../DESIGN-SPEC-FREEZE.md)、[CLAUDE.md](./CLAUDE.md)。  
> 总规范索引：[ANI-11-代码实现规范.md](../../ANI-11-代码实现规范.md) §六。

---

## 0. 设计规范冻结与落地顺序（强制）

| 规则 | 说明 |
|------|------|
| **规范只读** | `UI规范-2.0.md` 与 `产品设计规范-*-2.0.md` **禁止修改**（见 [DESIGN-SPEC-FREEZE.md](../../DESIGN-SPEC-FREEZE.md)） |
| **先规范后代码** | 新页面/改造前必须只读对照冻结规范，选定 [页面模板 2.0](../../产品设计规范-页面模板-2.0.md) 类型 |
| **分批改造** | 存量页面按 [CONSOLE-SPEC-COMPLIANCE-BATCHES.md](./docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md) **SCB-01 → SCB-12** 顺序执行，**不得跳批** |
| **当前批次** | **SCB-12** 占位页（阻塞于 API） |
| **进度文档** | 每批 `docs/sprints/SPRINT-SCB-xx-*.md` + 更新合规批次表状态 |

```text
读 DESIGN-SPEC-FREEZE → 读 UI/产品规范 2.0 → 确认当前 SCB → 实现 → verify → 写 SPRINT-SCB
```

---

## 1. 目录职责（强制）

| 目录 | 职责 | 禁止 |
|------|------|------|
| `src/routes/` | TanStack Router **路由文件**：`createFileRoute` + **页面组件（同文件）** | 禁止仅做 re-export 的空壳路由 |
| `src/components/` | **跨页面复用**的 UI（Shell、Table、CRUD 封装等） | 禁止放仅单页使用的页面逻辑 |
| `src/api/` | OpenAPI 生成类型、`coreApi` 客户端 | 禁止手写 URL 字符串请求 |
| `src/stores/` | Zustand 客户端状态（auth、branding） | 禁止放服务端 API 缓存 |
| `src/lib/` | 纯工具（idempotency、format、errors） | — |
| `src/hooks/` | 跨页面复用 hooks | 禁止放单页专用大块 UI 逻辑 |

### 1.1 禁止 `src/pages/`（已废弃）

**页面组件必须与路由定义写在同一个 `src/routes/**/*.tsx` 文件中。**

```tsx
// ✅ 正确：路由 + 页面同文件
export const Route = createFileRoute('/_authenticated/gpu-inventory/')({
  component: GpuInventoryPage,
})

function GpuInventoryPage() {
  return (/* ... */)
}
```

```tsx
// ❌ 错误：路由与页面拆分（历史 P4 曾误用，已统一回收）
// src/routes/.../index.tsx 仅 import from '@/pages/...'
```

**何时允许拆文件？** 仅当同一页面组件被 **多条路由** 复用时，提取到 `src/components/<domain>/`，仍 **不得** 使用 `src/pages/`。

---

## 2. 路由文件命名

遵循 TanStack Router 文件约定（与 ANI-11 §6.1 一致）：

| 文件 | URL |
|------|-----|
| `routes/_authenticated/index.tsx` | `/` |
| `routes/_authenticated/instances/index.tsx` | `/instances` |
| `routes/_authenticated/instances/$instanceId.tsx` | `/instances/:instanceId` |
| `routes/login.tsx` | `/login` |
| `routes/login.callback.tsx` | `/login/callback` |

公开路由（登录）不使用 `_authenticated` 布局；业务路由挂在 `_authenticated` 下。

---

## 3. API 与状态

- 所有 Core API 调用通过 `coreApi`（`openapi-fetch`）
- 服务端数据：`@tanstack/react-query`
- 客户端 UI 状态：`zustand`
- POST / 有副作用 PUT·PATCH：必须带 `idempotency_key`（`src/lib/idempotency.ts`）

---

## 4. 分阶段交付文档

- **P1–P10**：已冻结，见 [docs/CONSOLE-SPRINT-PHASES.md](./docs/CONSOLE-SPRINT-PHASES.md)
- **P11+**：每阶段测试通过后，在 [docs/sprints/](./docs/sprints/) 新增 `SPRINT-Pxx-*.md`，并更新主索引「活跃阶段」表

### 4.1 交付流程（强制）

**不论实现哪一块功能，合并/归档前必须完整跑通测试门禁：**

```bash
cd frontends/console && npm run verify
```

顺序：`codegen` → `typecheck` → **单元测试** → **E2E** → `build`。任一步失败即不得标记阶段完成。

### 4.2 测试分层与必做项

| 层级 | 命令 | 目录 | 何时必做 |
|------|------|------|----------|
| **单元** | `npm run test` / `npm run test:unit` | `src/**/*.test.{ts,tsx}` | 新增/修改 `src/lib/`、`src/stores/`、`src/api/` 纯逻辑、可复用组件逻辑 |
| **端到端** | `npm run test:e2e` | `e2e/**/*.spec.ts` | 新增/修改路由页面、认证门禁、导航、用户可见流程 |
| **全量门禁** | `npm run verify` | — | **每个 Sprint 结束前必跑** |

**每个功能 Sprint 的最低测试要求：**

1. **至少 1 条 E2E**：覆盖该功能的主路径（列表进入、关键按钮、详情页可见等）
2. **至少 1 条单元测试**（若本 Sprint 有可测纯逻辑）：工具函数、store、API helper、从组件抽出的匹配/格式化逻辑；无纯逻辑时须在 sprint 文档说明原因
3. Sprint 文档的「验收结果」必须粘贴 `npm run verify` 通过记录（含 unit + e2e 数量）

**禁止**：仅 `npm run build`、仅手点页面、或只跑 E2E 不跑单元测试就标记完成。

**新会话继续开发前必须先读** [`docs/CONSOLE-TASK-PLAN.md`](./docs/CONSOLE-TASK-PLAN.md)、`docs/CONSOLE-SPRINT-PHASES.md` 与最新 sprint 文件。

---

## 5. 过程文档（强制）

**做任何功能、测试或规范变更，必须留存过程文档**，不得只改代码不留记录。

| 动作 | 必须更新的文档 |
|------|----------------|
| 新阶段 / 新功能批次 | 复制 [`docs/sprints/SPRINT-TEMPLATE.md`](./docs/sprints/SPRINT-TEMPLATE.md) → `SPRINT-Pxx-*.md`，填写 **§2 变更清单**（新增/修改/删除路径） |
| 阶段完成 | 同上 sprint 文件标 ✅ + `CONSOLE-SPRINT-PHASES.md` 活跃表 |
| 路线图 / 待办变化 | `docs/CONSOLE-TASK-PLAN.md` §2–§3 |
| 工程约定变化 | `CONVENTIONS.md` + sprint §2.4 说明 |

Sprint 过程文档最低字段：**目标、变更清单、测试、验收输出、文档更新勾选**（见模板）。

---

## 6. 代码评审检查项

- [ ] 页面组件是否在 `src/routes/` 同文件内（无 `src/pages/` import）
- [ ] 是否使用 Arco 组件（非 TDesign / Ant Design）；Tailwind 仅用于布局 utilities（见 [样式与 Tailwind 边界 2.0](../../产品设计规范-样式与Tailwind边界-2.0.md)）
- [ ] 列表页是否有 loading / empty / error 三态
- [ ] 创建/删除是否有确认（危险操作用 `Modal.confirm`）
- [ ] API 类型是否来自 `core-schema.d.ts`（变更后已 `npm run codegen`）
- [ ] **是否已 `npm run verify`（单元 + E2E + build）**
- [ ] **新功能是否有对应 E2E；`lib`/`stores`/`api` 变更是否有单元测试**
- [ ] **是否已编写/更新本阶段 `docs/sprints/SPRINT-Pxx-*.md`（含变更清单）**
- [ ] **是否已更新 `docs/CONSOLE-TASK-PLAN.md`（若待办或覆盖范围变化）**
