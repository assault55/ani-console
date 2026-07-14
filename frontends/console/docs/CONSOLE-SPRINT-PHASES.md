# ANI Console · 分阶段交付记录（Sprint Phases）

> **P1–P10 已冻结**（2026-06-25）：内容不再修改，仅作历史基线。  
> **P11 起**的新增阶段见 [`docs/sprints/`](./sprints/README.md)，每阶段测试通过后单独归档。

---

## 冻结基线总览（P1–P10）

| 阶段 | 名称 | 状态 | 验收 |
|------|------|------|------|
| P1 | 工程脚手架与壳层 | 🔒 冻结 | `npm run codegen` / `npm run dev` |
| P2 | 认证与设置 | 🔒 冻结 | OIDC + API Key |
| P3 | 概览 Dashboard | 🔒 冻结 | `/` 指标 + ECharts |
| P4 | 实例与算力 | 🔒 冻结 | instances / gpu / sandbox |
| P5 | 网络 | 🔒 冻结 | `/networks/*` 五类 CRUD |
| P6 | 存储（列表级） | 🔒 冻结 | volumes / filesystems / objects 列表 |
| P7 | 向量存储 | 🔒 冻结 | `/vector-stores` |
| P8 | 镜像 Registry（基础） | 🔒 冻结 | 项目/仓库/制品导航 |
| P9 | K8s 集群（基础） | 🔒 冻结 | 列表/详情/升级/kubeconfig |
| P10 | 安全/监控/用量/预留 | 🔒 冻结 | encryption/secrets/observability/usage |

详细交付说明见本文件下方 **「冻结章节」**（P1–P10 原文保留）。

---

## 活跃阶段（P11+）

| 阶段 | 文档 | 状态 |
|------|------|------|
| P11 | [SPRINT-P11-test-harness.md](./sprints/SPRINT-P11-test-harness.md) | ✅ 完成 |
| P12 | [SPRINT-P12-storage-deep.md](./sprints/SPRINT-P12-storage-deep.md) | ✅ 完成 |
| P13 | [SPRINT-P13-registry-dashboard.md](./sprints/SPRINT-P13-registry-dashboard.md) | ✅ 完成 |
| P14 | [SPRINT-P14-k8s-full.md](./sprints/SPRINT-P14-k8s-full.md) | ✅ 完成 |
| P15 | [SPRINT-P15-security-obs-ops.md](./sprints/SPRINT-P15-security-obs-ops.md) | ✅ 完成 |
| P16 | [SPRINT-P16-e2e-playwright.md](./sprints/SPRINT-P16-e2e-playwright.md) | ✅ 完成 |
| P17 | [SPRINT-P17-unit-tests-policy.md](./sprints/SPRINT-P17-unit-tests-policy.md) | ✅ 完成 |
| P19 | [SPRINT-P19-e2e-coverage.md](./sprints/SPRINT-P19-e2e-coverage.md) | ✅ 完成 |
| P20 | [SPRINT-P20-mock-server-smoke.md](./sprints/SPRINT-P20-mock-server-smoke.md) | ✅ 完成（扩展至 11 smoke） |
| P21 | [SPRINT-P21-bundle-optimization.md](./sprints/SPRINT-P21-bundle-optimization.md) | ✅ 完成 |
| P23 | [SPRINT-P23-sandbox-real-instances.md](./sprints/SPRINT-P23-sandbox-real-instances.md) | ✅ 完成 |

**统一验收命令**（P11 起）：`npm run verify`（codegen + tsc + **单元测试** + **E2E** + build）

**阶段摘要（近期）**：

- P20：已形成浏览器 fixture mock 与 mock-server 双轨验证，mock-server smoke 覆盖概览、实例、API Key、网络、存储、Registry（含边缘动作）共 11 条。

---

## 冻结章节 · P1–P10（勿改）

### P1 — 工程脚手架与壳层

- Vite + React 18 + Arco + TanStack Router/Query + openapi-fetch
- App Shell、共享组件、`coreApi`、Vite proxy
- 关键路径：`src/routes/`、`src/components/`、`src/api/client.ts`

### P2 — 认证与设置

- `/login`、`/login/callback`、`/settings`、`/settings/api-keys`

### P3 — 概览 Dashboard

- `/` — GPU/实例/告警/用量聚合

### P4 — 实例与算力

- `/instances`、`/instances/$id`、`/gpu-inventory`、`/sandbox-templates`

### P5 — 网络

- `/networks/vpcs|subnets|security-groups|load-balancers|routes`

### P6 — 存储（列表级）

- `/volumes`、`/filesystems`、`/objects`（桶+上传）

### P7 — 向量存储

- `/vector-stores` CRUD + 检索 + 文档插入

### P8 — Registry（基础）

- `/registry` 三级导航 + 扫描报告只读

### P9 — K8s（基础）

- `/k8s-clusters` 列表/详情/节点池列表/Workloads/升级

### P10 — 安全/监控/用量/预留

- `/encryption`、`/secrets`、`/observability`、`/usage`、占位页

### 契约修复

- `openapi/v1.yaml` `/branding` schema 语法修复

---

## 后续入口

1. **任务计划（路线图 + 待办）**：[CONSOLE-TASK-PLAN.md](./CONSOLE-TASK-PLAN.md)
2. 工程约定：[CONVENTIONS.md](../CONVENTIONS.md)
3. 新阶段流程：实现 → 按 [SPRINT-TEMPLATE](./sprints/SPRINT-TEMPLATE.md) 写过程文档 → `npm run verify` → 更新本文件活跃表 + 任务计划待办

---

## 待办阶段（摘要，详情见任务计划）

| 阶段 | 名称 | 状态 |
|------|------|------|
| P18 | 网络与向量库详情 | ✅ 完成 |
| P19 | E2E 按模块补全 | ✅ 完成 |
| P20 | Mock Server 联调 E2E（可选） | ✅ 完成（扩展至 11 smoke） |
| P21 | 性能与分包 | ✅ 完成 |
| P23 | Sandbox 真实实例接入 | ✅ 完成 |

完整说明：[CONSOLE-TASK-PLAN.md](./CONSOLE-TASK-PLAN.md) §2.2
