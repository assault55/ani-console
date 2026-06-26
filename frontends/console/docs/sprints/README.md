# Console Sprint 归档（P11+）

## 文档职责

| 文件 | 用途 |
|------|------|
| [CONSOLE-TASK-PLAN.md](../CONSOLE-TASK-PLAN.md) | **任务计划**：全局已完成/待办、路由覆盖 |
| [CONSOLE-SPRINT-PHASES.md](../CONSOLE-SPRINT-PHASES.md) | 阶段索引（一行一阶段） |
| [SPRINT-TEMPLATE.md](./SPRINT-TEMPLATE.md) | **过程记录模板**（新阶段必复制） |
| `SPRINT-Pxx-*.md` | 每阶段过程文档：**改了哪里、新增哪里、测了什么** |

## 每完成一个工程阶段

1. 从 [SPRINT-TEMPLATE.md](./SPRINT-TEMPLATE.md) 复制并填写 `SPRINT-Pxx-<name>.md`（**§2 变更清单必填**）
2. **补测试**：单元 + E2E，见 [CONVENTIONS.md](../CONVENTIONS.md) §4.2
3. 运行 `npm run verify`（全部通过）
4. 更新 [CONSOLE-SPRINT-PHASES.md](../CONSOLE-SPRINT-PHASES.md) 活跃阶段表
5. 更新 [CONSOLE-TASK-PLAN.md](../CONSOLE-TASK-PLAN.md) §2 待办状态与 §3 覆盖表（若有功能进出）

**E2E 首次环境**：`npm run setup:e2e`

P1–P10 已冻结，不再新增或修改对应 sprint 文件。
