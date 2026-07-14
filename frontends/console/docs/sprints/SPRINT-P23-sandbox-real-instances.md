# SPRINT-P23 · Sandbox 真实实例接入

> 状态：**✅ 完成**（2026-07-14）  
> 验收：`npm run verify` 通过

---

## 1. 目标

- 将 Sandbox 创建从 local profile 语义升级为 Core `/instances` 的真实 `kind=sandbox` 创建入口。
- Sandbox 列表使用 `GET /instances?kind=sandbox`，创建成功后进入实例详情页。
- 详情页展示 Sandbox 运行摘要与 Provider 状态，明确区分真实 Kubernetes/Kata 后端与本地开发模式。

---

## 2. 变更清单

### 2.1 新增文件

| 路径 | 说明 |
|------|------|
| `docs/superpowers/plans/2026-07-14-sandbox-real-instances.md` | 实现计划 |
| `src/lib/sandbox-instance.ts` | Sandbox 命令解析、Provider 文案、错误文案 helper |
| `src/lib/sandbox-instance.test.ts` | Sandbox helper 单元测试 |
| `src/routes/_authenticated/instances/sandbox/$instanceId.tsx` | Sandbox 类型化详情路由 |

### 2.2 修改文件

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/index.tsx` | Sandbox 表单增加镜像、启动命令、Session Timeout、出口策略；创建使用稳定幂等键；列表传 `kind=sandbox`；成功后可跳详情 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 详情概览展示 Sandbox 与 Provider 状态；生命周期错误提示资源可能不同步 |
| `src/routes/_authenticated/instances/sandbox/create.tsx` | Sandbox 创建成功后跳转类型化详情页 |
| `src/routeTree.gen.ts` | 新增 Sandbox 详情路由 |
| `src/routes/_authenticated/instances/-instance-create.test.ts` | 覆盖 Sandbox 请求体与幂等键注入 |
| `e2e/instances.spec.ts` | 覆盖 Sandbox 列表查询、创建重试复用幂等键、详情展示真实/local provider 状态 |

### 2.3 删除 / 废弃

| 路径 | 原因 |
|------|------|
| 无 | 无删除 |

### 2.4 契约 / 配置

| 项 | 说明 |
|----|------|
| `openapi/v1.yaml` | 无变更；当前生成的列表 query enum 未包含 sandbox，前端在 `/instances` 查询处做窄类型兼容 |
| 环境变量 | 无变更 |

---

## 3. 测试

### 3.1 单元测试

| 文件 | 新增用例说明 |
|------|--------------|
| `src/lib/sandbox-instance.test.ts` | 命令解析、Provider 状态文案、创建/生命周期错误文案 |
| `src/routes/_authenticated/instances/-instance-create.test.ts` | Sandbox 请求体包含 `image`、`command`、`sandbox_config` 与稳定 `idempotency_key` |

### 3.2 E2E

| 文件 | 场景 |
|------|------|
| `e2e/instances.spec.ts` | Sandbox 列表传 `kind=sandbox`；创建失败后重试复用幂等键；创建成功进入详情；真实 Kubernetes/Kata 与本地开发模式展示 |

### 3.3 验收命令与结果

```bash
cd frontends/console
npm run test -- src/lib/sandbox-instance.test.ts
npm run test -- src/routes/_authenticated/instances/-instance-create.test.ts
npx playwright test e2e/instances.spec.ts -g 'Sandbox'
npm run typecheck
npm run verify
# unit 80 ✓ | e2e 45 ✓ | build ✓
```

---

## 4. 文档更新

- [x] `docs/sprints/SPRINT-P23-sandbox-real-instances.md`
- [x] `docs/CONSOLE-SPRINT-PHASES.md` 活跃表
- [x] `docs/CONSOLE-TASK-PLAN.md` 覆盖表
- [x] `CONVENTIONS.md`（无约定变化）

---

## 5. 已知限制 / 后续

- 真实 Kubernetes/Kata 成功与否以 Core `dev_profile.real_provider` 与 `provider` 字段为准；前端不直连 Kubernetes。
- Runtime Class 当前仅暴露稳定入口 `sandbox-kata`。

---

## 6. 下一阶段的入口

- P24 待定。
