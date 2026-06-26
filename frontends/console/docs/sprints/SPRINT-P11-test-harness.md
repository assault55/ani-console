# SPRINT-P11 · 测试基建与 P1–P10 冻结

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

## 目标

1. 将 P1–P10 交付记录标记为冻结，不再修改
2. 建立 `vitest` + `npm run verify` 统一门禁
3. 新增 `docs/sprints/` 目录承载 P11+ 阶段文档

## 交付物

| 项 | 路径 |
|----|------|
| 冻结索引 | `docs/CONSOLE-SPRINT-PHASES.md`（P1–P10 🔒） |
| Sprint 归档说明 | `docs/sprints/README.md` |
| 测试 setup | `src/test/setup.ts` |
| 单元测试 | `src/lib/*.test.ts`、`src/components/shell/StatusTag.test.tsx` |
| 验收脚本 | `package.json` → `verify` = codegen + typecheck + test + build |

## 验收结果

```bash
cd frontends/console && npm run verify
# codegen ✓ | tsc ✓ | 7 tests ✓ | build ✓
```

## 后续阶段

- P12 存储深化 → `SPRINT-P12-storage-deep.md`
