# ANI Console · Agent 强制入口

> Console 独立前端工程。开发前必读本文 + [DESIGN-SPEC-FREEZE.md](../../DESIGN-SPEC-FREEZE.md)。

---

## 0. 设计规范已冻结（强制）

**产品设计规范 2.0 已于 2026-06-25 冻结，禁止修改规范文档正文。**

- 冻结清单与规则：[DESIGN-SPEC-FREEZE.md](../../DESIGN-SPEC-FREEZE.md)
- **所有新页面与存量改造**：只读遵循冻结规范，不得自行改规范或另起 UI 体系
- **存量页面**：按 [docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md](./docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md) **顺序分批**落地，当前 **SCB-12（阻塞于 API）**

---

## 1. 读取顺序

```text
1. DESIGN-SPEC-FREEZE.md
2. UI规范-2.0.md
3. 产品设计规范-*-2.0.md（设计原则 → Arco → 页面模板 → 样式边界 → 评审清单）
4. docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md（当前 SCB 批次）
5. docs/CONSOLE-TASK-PLAN.md
6. CONVENTIONS.md
7. 本批次 SPRINT-SCB-*.md 或 SPRINT-P*.md
```

---

## 2. 实现口径（不可违背）

| 项 | 要求 |
|----|------|
| 组件 | Arco Design React |
| 样式 | Arco Token + Tailwind utilities（布局 only） |
| 页面 | `src/routes/` 路由+页面同文件 |
| API | `openapi/v1.yaml` → `coreApi` |
| 验收 | `npm run verify` |

---

## 3. 禁止事项

- 修改 `产品设计规范-*-2.0.md`、`UI规范-2.0.md` 正文
- 跳过 SCB 批次顺序做全库风格重写
- 引入 TDesign / Ant Design / shadcn / 平行组件库
- 用 Tailwind 色板替代 Arco Token

---

## 4. 进度写入位置

| 内容 | 文件 |
|------|------|
| SCB 批次状态 | `docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md` |
| 功能 Sprint | `docs/CONSOLE-TASK-PLAN.md` |
| 批次细节 | `docs/sprints/SPRINT-SCB-*.md` |
