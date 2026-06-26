# SPRINT-P20 · Mock Server 联调 E2E（最小闭环）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run test:e2e:mock-server` 通过

---

## 1. 目标

- 建立与浏览器 fixture mock 分层的 Mock Server smoke 通道。
- 对 `127.0.0.1:4010` 跑通最小联调链路（列表 + 详情）。

---

## 2. 变更清单（强制：改了哪里 / 新增哪里）

### 2.1 新增文件

| 路径 | 说明 |
|------|------|
| `scripts/mock-core-api.mjs` | 轻量本地 Core Mock Server（4010） |
| `playwright.mock-server.config.ts` | Mock Server 专用 Playwright 配置 |
| `e2e/mock-server-smoke.spec.ts` | Mock Server smoke 用例（2 条） |

### 2.2 修改文件

| 路径 | 变更摘要 |
|------|----------|
| `package.json` | 新增 `test:e2e:mock-server` 脚本 |
| `playwright.config.ts` | 默认 E2E 忽略 mock-server smoke，避免未启动 4010 时误失败 |

### 2.3 删除 / 废弃

| 路径 | 原因 |
|------|------|
| 无 | — |

### 2.4 契约 / 配置

| 项 | 说明 |
|----|------|
| `openapi/v1.yaml` | 无变更 |
| 环境变量 | `MOCK_SERVER_PORT` 可选，默认 4010 |

---

## 3. 测试

### 3.1 单元测试

| 文件 | 新增用例说明 |
|------|--------------|
| 无 | 本批次为 E2E 联调通道建设 |

### 3.2 E2E

| 文件 | 场景 |
|------|------|
| `e2e/mock-server-smoke.spec.ts` | 实例列表从 Mock Server 加载 |
| `e2e/mock-server-smoke.spec.ts` | 实例详情从 Mock Server 加载 |
| `e2e/mock-server-smoke.spec.ts` | API Key 列表与创建从 Mock Server 加载 |
| `e2e/mock-server-smoke.spec.ts` | 概览页核心指标从 Mock Server 加载 |
| `e2e/mock-server-smoke.spec.ts` | 网络 VPC 列表 + 详情 Drawer 从 Mock Server 加载 |
| `e2e/mock-server-smoke.spec.ts` | 块存储详情 + 快照从 Mock Server 加载 |
| `e2e/mock-server-smoke.spec.ts` | Registry 项目→仓库→制品三级导航从 Mock Server 加载 |
| `e2e/mock-server-smoke.spec.ts` | Registry 权限设置 / Pull Secret / 扫描查询联调动作 |
| `e2e/mock-server-smoke.spec.ts` | Registry 创建项目动作联调 |
| `e2e/mock-server-smoke.spec.ts` | 文件存储详情 + 挂载目标联调 |
| `e2e/mock-server-smoke.spec.ts` | 对象存储桶 + 对象列表联调 |

### 3.3 验收命令与结果

```bash
cd frontends/console && npm run test:e2e:mock-server
# smoke 11 ✓
```

---

## 4. 文档更新（本阶段触达的索引）

- [x] `docs/sprints/SPRINT-P20-mock-server-smoke.md`（本文件）
- [x] `docs/CONSOLE-SPRINT-PHASES.md` 活跃表
- [x] `docs/CONSOLE-TASK-PLAN.md` 待办/覆盖表（若范围变化）
- [ ] `CONVENTIONS.md`（若约定变化）

---

## 5. 已知限制 / 后续

- 目前为 11 条 smoke（概览/实例列表/实例详情/API Key/网络/存储/Registry 主路径 + Registry 边缘动作 + 创建项目 + 文件/对象存储），已覆盖核心联调链路。

---

## 6. 下一阶段的入口

- P21 → `SPRINT-P21-bundle-optimization.md`
