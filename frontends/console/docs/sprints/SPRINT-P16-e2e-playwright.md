# SPRINT-P16 · 端到端测试（Playwright）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过（含 E2E）

## 背景

P11 建立的 `vitest` 单元测试保留，但阶段验收应以**端到端测试**为主：在真实浏览器中验证路由、认证门禁、侧栏导航与页面渲染，不依赖 Mock Server 或真实 OIDC。

## 目标

1. 引入 Playwright E2E 基建
2. 通过 `page.route` 拦截 `/api/v1/**`，注入 fixture 数据
3. 通过 `localStorage` 注入 zustand 登录态，绕过 OIDC
4. 将 `test:e2e` 纳入 `npm run verify`

## 交付物

| 项 | 路径 |
|----|------|
| Playwright 配置 | `playwright.config.ts` |
| API fixture 拦截 | `e2e/support/api-mock.ts` |
| 登录态注入 | `e2e/support/auth.ts` |
| 认证门禁 | `e2e/auth.spec.ts` |
| Dashboard | `e2e/dashboard.spec.ts` |
| 侧栏导航 | `e2e/navigation.spec.ts` |
| 存储详情 | `e2e/storage.spec.ts` |
| 脚本 | `test:e2e`、`test:e2e:ui` |
| 验收 | `verify` = codegen + tsc + unit + **e2e** + build |

## 首次环境准备

```bash
cd frontends/console
npm install
npm run setup:e2e    # Linux 首次：浏览器 + 系统库（需 sudo/apt）
npm run verify
```

`npm run test:e2e` / `npm run verify` 会通过 `pretest:e2e` 自动下载 Chromium；若 Linux 缺 `libatk` 等库，脚本会提示执行 `npm run setup:e2e`。

## 故障排查

| 现象 | 处理 |
|------|------|
| `Executable doesn't exist` | `npm run pretest:e2e` 或 `npx playwright install chromium` |
| `libatk-1.0.so.0: cannot open` | `npm run setup:e2e` |
| 端口 5173 被占用 | 关掉已有 `npm run dev`，或设 `CI=1 npm run test:e2e` 强制新起服务 |
| 在仓库根目录执行失败 | 必须在 `frontends/console/` 下执行 |

**说明**：当前 E2E 在浏览器层 `page.route` 模拟 API，不依赖 `127.0.0.1:4010` Mock Server；验证的是 UI 路由与渲染，不是真实后端联调。

## 验收结果

```bash
cd frontends/console && npm run verify
# codegen ✓ | tsc ✓ | 7 unit tests ✓ | 8 e2e tests ✓ | build ✓
```

## 测试分层说明

| 层级 | 工具 | 用途 |
|------|------|------|
| 单元 | vitest | `src/lib/*`、小组件纯逻辑 |
| 端到端 | Playwright | 路由、Shell、列表/详情页用户路径 |

后续新阶段：功能实现后**优先补 E2E 用例**，再跑 `npm run verify`。
