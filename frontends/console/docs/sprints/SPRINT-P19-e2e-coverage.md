# SPRINT-P19 · E2E 按模块补全

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

- 补齐已交付模块的主路径 E2E 覆盖。
- 为 `settings/api-keys` 与 `sandbox-templates` 增加独立回归用例。

---

## 2. 变更清单（强制：改了哪里 / 新增哪里）

### 2.1 新增文件

| 路径 | 说明 |
|------|------|
| `e2e/api-keys.spec.ts` | API Key 列表与创建流程 |
| `e2e/sandbox-templates.spec.ts` | Sandbox 模板列表展示 |

### 2.2 修改文件

| 路径 | 变更摘要 |
|------|----------|
| `e2e/support/api-mock.ts` | 新增 `/auth/api-keys`、`/sandbox-templates` fixture 路由 |

### 2.3 删除 / 废弃

| 路径 | 原因 |
|------|------|
| 无 | — |

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
| 无 | 本批次仅补充 E2E 覆盖 |

### 3.2 E2E

| 文件 | 场景 |
|------|------|
| `e2e/api-keys.spec.ts` | API Key 列表可见 + 创建后展示一次性密钥 |
| `e2e/sandbox-templates.spec.ts` | Sandbox 模板列表可见 fixture 数据 |

### 3.3 验收命令与结果

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 22 ✓ | build ✓
```

---

## 4. 文档更新（本阶段触达的索引）

- [x] `docs/sprints/SPRINT-P19-e2e-coverage.md`（本文件）
- [x] `docs/CONSOLE-SPRINT-PHASES.md` 活跃表
- [x] `docs/CONSOLE-TASK-PLAN.md` 待办/覆盖表（若范围变化）
- [ ] `CONVENTIONS.md`（若约定变化）

---

## 5. 已知限制 / 后续

- 当前 E2E 仍以浏览器层 fixture mock 为主；Mock Server 联调见 P20。

---

## 6. 下一阶段的入口

- P20 → `SPRINT-P20-mock-server-smoke.md`
