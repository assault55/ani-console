# ANI Console

**独立前端工程**：以 [产品设计规范 2.0](../../UI规范-2.0.md) 与 [OpenAPI 契约](../../openapi/v1.yaml) 为真来源，不依赖 monorepo 后端代码同仓开发。

## 文档（续开发前必读）

| 文档 | 用途 |
|------|------|
| [DESIGN-SPEC-FREEZE.md](../../DESIGN-SPEC-FREEZE.md) | **设计规范 2.0 冻结令**（禁止改规范正文） |
| [UI规范-2.0.md](../../UI规范-2.0.md) | 产品设计层权威（只读） |
| [CONSOLE-SPEC-COMPLIANCE-BATCHES.md](./docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md) | **按顺序分批**对齐规范（当前 SCB-01） |
| [CLAUDE.md](./CLAUDE.md) | Console Agent 强制入口 |
| [CONVENTIONS.md](./CONVENTIONS.md) | 工程约定 |
| [docs/CONSOLE-TASK-PLAN.md](./docs/CONSOLE-TASK-PLAN.md) | 任务计划 |

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript + Vite |
| UI 组件 | **Arco Design React**（唯一组件库） |
| 布局工具 | **Tailwind CSS**（仅 utilities；preflight 关闭，不与 Arco 冲突） |
| 路由/状态 | TanStack Router + TanStack Query + Zustand |
| API | openapi-typescript + openapi-fetch → `openapi/v1.yaml` |
| 图表 | ECharts |

## 样式分层

```text
1. Arco 组件（Table / Form / Button …）
2. Arco Design Token（颜色、边框、语义色）
3. Tailwind utilities（flex / gap / padding / 壳层布局）
```

禁止用 Tailwind 替代 Arco 组件或自建色板；详见样式边界文档。

## 开发

```bash
npm install
npm run codegen    # 从 ../../openapi/v1.yaml 生成类型
npm run dev        # http://localhost:5173
npm run verify     # codegen + tsc + unit + e2e + build
```

### 本地 API（可选）

`vite.config.ts` 在 **开发模式** 可将 `/api/v1` 代理到 Mock Server 或 Gateway，通过 `.env` 配置：

```bash
cp .env.example .env
# VITE_API_PROXY_TARGET=http://127.0.0.1:4010
```

E2E 与 CI 默认在浏览器层 mock API，**不依赖** 4010 服务。

## 目录

- `src/routes/` — TanStack Router：路由 + 页面（同文件）
- `src/components/` — 跨页面复用（Shell、Table、CRUD）
- `src/styles/` — 全局样式（Tailwind 入口 + 壳层基线）
- `src/api/` — OpenAPI 类型与 `coreApi`

## 范围

仅对接 **Core API**（`/api/v1`），不含 Services 业务 API（模型/推理/知识库）。
