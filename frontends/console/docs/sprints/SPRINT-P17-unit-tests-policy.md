# SPRINT-P17 · 单元测试补全与测试强制规范

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

## 目标

1. 在 `CONVENTIONS.md` / `ANI-11` 中明确：**每个功能 Sprint 必须跑 `npm run verify`（单元 + E2E）**
2. 补齐此前偏少的 **vitest 单元测试**
3. 增加 `npm run test:unit` 别名，与 E2E 对称

## 交付物

| 项 | 路径 |
|----|------|
| 测试强制规范 | `CONVENTIONS.md` §4.1–4.2、§5 评审项 |
| ANI-11 索引 | `ANI-11-代码实现规范.md` §6.0 测试段落 |
| 侧栏路由匹配 | `src/lib/side-menu-match.ts` + `.test.ts` |
| 列表 API 工具 | `src/lib/api-list.test.ts` |
| 认证 store | `src/stores/auth.test.ts` |
| API helper | `src/api/helpers.test.ts` |
| 脚本 | `test:unit` = `vitest run` |

## 单元测试清单（18 条）

| 模块 | 文件 | 条数 |
|------|------|------|
| errors | `lib/errors.test.ts` | 2 |
| format | `lib/format.test.ts` | 2 |
| idempotency | `lib/idempotency.test.ts` | 1 |
| api-list | `lib/api-list.test.ts` | 2 |
| side-menu-match | `lib/side-menu-match.test.ts` | 3 |
| auth store | `stores/auth.test.ts` | 3 |
| helpers | `api/helpers.test.ts` | 3 |
| StatusTag | `components/shell/StatusTag.test.tsx` | 2 |

## 验收结果

```bash
cd frontends/console && npm run verify
# codegen ✓ | tsc ✓ | 18 unit tests ✓ | 8 e2e tests ✓ | build ✓
```

## 后续 Sprint 最低要求

- 新功能：**≥1 E2E** + 有可测逻辑时 **≥1 单元测试**
- 归档前：**必须** `npm run verify` 全绿
