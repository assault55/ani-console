# ANI Console · 任务计划（Task Plan）

> **唯一任务计划真来源**（与阶段索引 [`CONSOLE-SPRINT-PHASES.md`](./CONSOLE-SPRINT-PHASES.md) 配套）。  
> 最后更新：**2026-06-25**  
> API 契约：`openapi/v1.yaml`（仅 **Core**；不含 Services `openapi/services/v1.yaml`）

---

## 1. 文档体系（做任何事都要留存）

| 文档 | 路径 | 职责 |
|------|------|------|
| **任务计划（本文件）** | `docs/CONSOLE-TASK-PLAN.md` | 全局路线图、已完成/待办、路由与 API 覆盖概览 |
| **阶段索引** | `docs/CONSOLE-SPRINT-PHASES.md` | P1–P10 冻结表 + P11+ 活跃阶段一行索引 |
| **过程记录（每阶段）** | `docs/sprints/SPRINT-Pxx-*.md` | **改了什么、新增什么、测了什么**（强制） |
| **过程记录模板** | `docs/sprints/SPRINT-TEMPLATE.md` | 新阶段复制此模板填写 |
| **工程约定** | `CONVENTIONS.md` | 目录、测试、文档强制规则 |

**强制流程**（见 `CONVENTIONS.md` §4、§6）：

```text
读任务计划 → 实现 → 补单元+E2E → npm run verify → 写 SPRINT-Pxx（含变更清单）→ 更新本文件待办表 + CONSOLE-SPRINT-PHASES 索引
```

---

## 2. 阶段总览

### 2.1 已完成（P1–P17）

| 阶段 | 名称 | 状态 | 过程文档 |
|------|------|------|----------|
| P1 | 工程脚手架与壳层 | 🔒 冻结 | 见 [CONSOLE-SPRINT-PHASES](./CONSOLE-SPRINT-PHASES.md) 冻结章 |
| P2 | 认证与设置 | 🔒 冻结 | 同上 |
| P3 | 概览 Dashboard | 🔒 冻结 | 同上 |
| P4 | 实例与算力 | 🔒 冻结 | 同上 |
| P5 | 网络五类 CRUD | 🔒 冻结 | 同上 |
| P6 | 存储（列表级） | 🔒 冻结 | 同上 |
| P7 | 向量存储 | 🔒 冻结 | 同上 |
| P8 | Registry 基础 | 🔒 冻结 | 同上 |
| P9 | K8s 基础 | 🔒 冻结 | 同上 |
| P10 | 安全/监控/用量/占位 | 🔒 冻结 | 同上 |
| P11 | vitest + verify 基建 | ✅ | [SPRINT-P11](./sprints/SPRINT-P11-test-harness.md) |
| P12 | 存储深化 | ✅ | [SPRINT-P12](./sprints/SPRINT-P12-storage-deep.md) |
| P13 | Registry + Dashboard 最近操作 | ✅ | [SPRINT-P13](./sprints/SPRINT-P13-registry-dashboard.md) |
| P14 | K8s 完整 | ✅ | [SPRINT-P14](./sprints/SPRINT-P14-k8s-full.md) |
| P15 | 安全/监控/操作详情 | ✅ | [SPRINT-P15](./sprints/SPRINT-P15-security-obs-ops.md) |
| P16 | Playwright E2E | ✅ | [SPRINT-P16](./sprints/SPRINT-P16-e2e-playwright.md) |
| P17 | 单元测试 + 测试规范 | ✅ | [SPRINT-P17](./sprints/SPRINT-P17-unit-tests-policy.md) |

**当前门禁**：`cd frontends/console && npm run verify` → 24 unit + 22 e2e + build

### 2.2 待办（P18+）

| 阶段 | 名称 | 状态 | 范围（计划） |
|------|------|------|----------------|
| P18 | 网络与向量库详情 | ✅ | SCB-06/07 已交付 GET 详情 Drawer |
| P19 | E2E 按模块补全 | ✅ | 新增 API Key / Sandbox 模块 E2E，覆盖提升至 22 条 |
| P20 | Mock Server 联调 E2E（可选） | ✅ | 新增 `test:e2e:mock-server`，对 `127.0.0.1:4010` 执行 smoke |
| P21 | 性能与分包 | ✅ | 启用路由自动分包 + ECharts core 按需注册，build 大包告警已消除 |

> 启动任一阶段时：复制 [SPRINT-TEMPLATE](./sprints/SPRINT-TEMPLATE.md) → 填写 → 将上表状态改为「进行中」。

### 2.3 规范合规落地（SCB，与 P 轨并行）

> **设计规范 2.0 已冻结**（2026-06-25）。存量 UI 须按规范对齐，顺序见 [CONSOLE-SPEC-COMPLIANCE-BATCHES.md](./CONSOLE-SPEC-COMPLIANCE-BATCHES.md)。

| 批次 | 名称 | 状态 |
|------|------|------|
| SCB-01 | 壳层与共享组件 | ✅ |
| SCB-02 | 认证与设置 | ✅ |
| SCB-03 | 概览 Dashboard | ✅ |
| SCB-04 | 实例与算力 | ✅ |
| SCB-05 | 存储 | ✅ |
| SCB-06 | 网络 | ✅ |
| SCB-07 | 向量库 | ✅ |
| SCB-08 | K8s | ✅ |
| SCB-09 | Registry | ✅ |
| SCB-10 | 安全与密钥 | ✅ |
| SCB-11 | 监控与用量 | ✅ |
| SCB-12 | 占位页 | ⏸ 阻塞于 API |

**规则**：先完成当前 SCB 再进入下一批；可与 P18+ 功能合批，但 SCB 序号不可跳。

---

## 3. 功能覆盖地图

### 3.1 已实现路由（`src/routes/`）

| 模块 | 路径 | 阶段 | 深化程度 |
|------|------|------|----------|
| 概览 | `/` | P3, P13 | 指标 + 最近实例/操作 |
| 登录 | `/login`, `/login/callback` | P2 | OIDC |
| 设置 | `/settings`, `/settings/api-keys` | P2 | 基础 |
| 实例 | `/instances`, `/instances/$id`, operations | P4, P15 | 列表/详情/操作链 |
| GPU | `/gpu-inventory` | P4 | 列表 + 占用 |
| Sandbox | `/sandbox-templates` | P4 | CRUD |
| K8s | `/k8s-clusters` | P9, P14 | 创建/节点池/Proxy/升级 |
| 可启动镜像 | `/images` | P22 | 列表 + 本地 ISO 直传（upload_url）+ 删除；供 VM ISO 启动 / noVNC 装机 |
| 块存储 | `/volumes`, `/volumes/$id` | P6, P12 | 列表 + 快照 |
| 文件存储 | `/filesystems`, `/filesystems/$id` | P6, P12 | 列表 + 挂载目标 |
| 对象存储 | `/objects` | P6, P12 | 桶/上传/下载/删除 |
| 向量库 | `/vector-stores` | P7, SCB-07 | 列表 CRUD + 详情 Drawer + 检索/插入 |
| 网络 | `/networks/*` 五类 | P5, SCB-06 | 列表 CRUD + 详情 Drawer（含路由 GET/DELETE） |
| Registry | `/registry` | P8, P13, SCB-09 | 三级导航 + 权限/扫描 |
| 加密 | `/encryption` | P10, P15, SCB-10 | 列表 + 轮换/seal/unseal |
| 密钥 | `/secrets`, `/secrets/$id` | P10, P15, SCB-10 | 列表 + 详情 + 绑定 |
| 监控 | `/observability` | P10, P15, SCB-11 | 查询 + 规则列表三态 |
| 用量 | `/usage` | P10, SCB-11 | 指标卡 + 趋势图 |
| 操作详情 | `/instance-operations/$id` | P15, SCB-11 | 详情 + 步骤表 |
| 占位 | `/bare-metal`, `/notifications`, `/audit` | P10 | 等 Core 契约 path |

### 3.2 Core API 覆盖说明

- OpenAPI **约 107** 个 `operationId`；Console 覆盖**主路径**，非 107 一一 UI。
- **故意不做**：`reportTokenUsage`（Console 不上报 token 用量）。
- **不在范围**：`openapi/services/v1.yaml`（Services 层，本仓库 Console 仅 Core）。

### 3.3 已知缺口（汇总自 P15 及评审）

- [x] 网络资源 GET 详情（VPC/子网/安全组/LB/路由 Drawer）
- [x] 向量库 GET 详情页（Drawer）
- [x] Registry 当前已落地边缘 API（创建项目/权限/Pull Secret/扫描查询）已覆盖 mock-server 联调
- [ ] BareMetal / Notifications / Audit 真实页面（待契约）
- [x] E2E 已覆盖核心模块（含 encryption、registry、network、vector、usage、operation）
- [x] Mock Server 最小 smoke 联调（与浏览器 fixture mock 分层并行）
- [x] Mock Server 扩展覆盖（smoke 从 2 条扩展至 11 条，覆盖概览/实例/API Key/网络/存储/Registry）

### 3.4 Registry 接口-页面-测试映射（当前）

| API | 页面/动作 | 联调覆盖 |
|------|-----------|----------|
| `GET /registry/projects` | Registry 项目列表 | `mock-server-smoke` |
| `POST /registry/projects` | 创建项目 | `mock-server-smoke` |
| `GET /registry/projects/{project}/repositories` | 选中项目后仓库列表 | `mock-server-smoke` |
| `GET /registry/projects/{project}/repositories/{repository}/artifacts` | 选中仓库后制品列表 | `mock-server-smoke` |
| `GET /registry/projects/{project}/scan-report` | 项目扫描报告 | `mock-server-smoke` |
| `POST /registry/projects/{project}/repositories/{repository}/permissions` | 设置权限 | `mock-server-smoke` |
| `POST /registry/projects/{project}/pull-secret` | 创建 Pull Secret | `mock-server-smoke` |
| `GET /registry/images/scan-result` | 镜像扫描查询 | `mock-server-smoke` |

---

## 4. 测试资产清单

| 类型 | 命令 | 数量（2026-06-25） | 位置 |
|------|------|-------------------|------|
| 单元 | `npm run test:unit` | 24 | `src/**/*.test.{ts,tsx}` |
| E2E | `npm run test:e2e` | 22 | `e2e/**/*.spec.ts` |
| 全量 | `npm run verify` | 上两者 + codegen + tsc + build | `package.json` |

E2E 支撑：`e2e/support/api-mock.ts`、`auth.ts`；`scripts/ensure-e2e.mjs`

---

## 5. 变更日志（计划级）

| 日期 | 事项 |
|------|------|
| 2026-06-25 | P20 再扩展（Mock Server smoke 扩展至 11 条，新增文件存储与对象存储联调） |
| 2026-06-25 | P20 再扩展（Mock Server smoke 扩展至 9 条，新增 Registry 创建项目动作联调） |
| 2026-06-25 | P20 再扩展（Mock Server smoke 扩展至 8 条，新增 Registry 权限/Pull Secret/扫描查询联调） |
| 2026-06-25 | P20 再扩展（Mock Server smoke 扩展至 7 条，新增 Registry 三级导航联调） |
| 2026-06-25 | P20 再扩展（Mock Server smoke 扩展至 6 条，新增网络 VPC / 块存储详情） |
| 2026-06-25 | P20 扩展覆盖完成（Mock Server smoke 扩展至 4 条，覆盖概览/实例/API Key） |
| 2026-06-25 | P21 第二轮完成（开启路由 autoCodeSplitting + 图表按需加载，build 无 chunk>500 告警） |
| 2026-06-25 | P19 完成（新增 API Key / Sandbox E2E，默认 E2E 22 条） |
| 2026-06-25 | P20 最小闭环完成（新增 `test:e2e:mock-server` 与 Mock Server smoke） |
| 2026-06-25 | P21 首轮分包完成（manualChunks：tanstack + echarts，主包显著下降） |
| 2026-06-25 | 初版任务计划；P1–P17 记入已完成；P18–P21 待办立项 |
| 2026-06-25 | SCB-12 阻塞态收尾（占位页 + E2E，SPRINT-SCB-12） |
| 2026-06-25 | SCB-11 监控与用量合规完成（SPRINT-SCB-11） |
| 2026-06-25 | SCB-10 安全与密钥合规完成（SPRINT-SCB-10） |
| 2026-06-25 | SCB-09 Registry 合规完成（SPRINT-SCB-09） |
| 2026-06-25 | SCB-08 K8s 集群合规完成（SPRINT-SCB-08） |
| 2026-06-25 | SCB-07 向量库合规 + P18 完成（SPRINT-SCB-07） |
| 2026-06-25 | SCB-06 网络合规 + P18 网络详情 Drawer（SPRINT-SCB-06） |
| 2026-06-25 | SCB-05 存储合规完成（SPRINT-SCB-05） |
| 2026-06-25 | SCB-04 实例与算力合规完成（SPRINT-SCB-04） |
| 2026-06-25 | SCB-03 概览 Dashboard 合规完成（SPRINT-SCB-03） |

---

## 6. 相关入口

- [CONSOLE-SPRINT-PHASES.md](./CONSOLE-SPRINT-PHASES.md)
- [sprints/README.md](./sprints/README.md)
- [CONVENTIONS.md](../CONVENTIONS.md)
- [UI规范-2.0.md](../../UI规范-2.0.md)（视觉，**已冻结**）
- [DESIGN-SPEC-FREEZE.md](../../DESIGN-SPEC-FREEZE.md)
- [CONSOLE-SPEC-COMPLIANCE-BATCHES.md](./CONSOLE-SPEC-COMPLIANCE-BATCHES.md)
