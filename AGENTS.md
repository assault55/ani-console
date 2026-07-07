# AGENTS.md

> **此文件供 OpenAI Codex / Cursor / 其他 AI 编码工具读取。**

---

## 仓库分区

| 区域 | Agent 入口 |
|------|------------|
| **Console 前端**（`frontends/console/`） | **[frontends/console/CLAUDE.md](./frontends/console/CLAUDE.md)** + [DESIGN-SPEC-FREEZE.md](./DESIGN-SPEC-FREEZE.md) |
| Core / 全仓通用 | [CLAUDE.md](./CLAUDE.md) |

Console 开发时 **以 Console 入口为准**；设计规范 2.0 **已冻结，禁止修改规范正文**。

---

## Console 强制规则（摘要）

1. 读 [DESIGN-SPEC-FREEZE.md](./DESIGN-SPEC-FREEZE.md) 与 `产品设计规范-*-2.0.md`（只读）
2. Console 模块开发先读对应 `docs/console-module/**` PRD / UX / 详文（网络模块入口：[docs/console-module/network-management-docs](./docs/console-module/network-management-docs)）
3. 按 [CONSOLE-SPEC-COMPLIANCE-BATCHES.md](./frontends/console/docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md) **SCB 顺序**改页面
4. Arco 组件 + Arco Token + Tailwind 布局；`npm run verify`

---

## 快速跳转

- 设计规范冻结令 → [DESIGN-SPEC-FREEZE.md](./DESIGN-SPEC-FREEZE.md)
- UI 规范入口 → [UI规范-2.0.md](./UI规范-2.0.md)
- Console 模块 PRD/UX → [docs/console-module](./docs/console-module)
- Console 工程约定 → [frontends/console/CONVENTIONS.md](./frontends/console/CONVENTIONS.md)
- Karpathy 五条原则 → [CLAUDE.md §8](./CLAUDE.md)

`AGENTS.md` 与 `CLAUDE.md` 冲突时：Console 任务以 `frontends/console/CLAUDE.md` + 冻结规范为准；Core 任务以 `CLAUDE.md` 为准。
