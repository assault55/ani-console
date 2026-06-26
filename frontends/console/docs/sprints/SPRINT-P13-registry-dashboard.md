# SPRINT-P13 · Registry 深化与 Dashboard 最近操作

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

## 目标

1. 补齐 Registry 权限、Pull Secret、镜像扫描查询
2. Dashboard 增加最近实例操作摘要与详情链接

## 交付物

| 能力 | API | 路径 |
|------|-----|------|
| 仓库权限设置 | `POST .../permissions`（`subject` + `actions`） | `registry/index.tsx` |
| Pull Secret 创建 | `POST .../pull-secret`（`name` 必填） | `registry/index.tsx` |
| 镜像扫描结果 | `GET /registry/images/scan-result?image=` | `registry/index.tsx` |
| 最近操作卡片 | `GET /instances/{id}/operations` | `index.tsx` → `RecentOperations` |
| 操作详情链接 | — | 链至 `/instance-operations/$operationId` |

## 契约对齐说明

- 权限为 **POST**（非 PUT），body 使用 `subject` / `actions`
- Pull Secret 需显式 `name` 字段
- 扫描接口通过 query `image` 传镜像引用

## 验收结果

```bash
cd frontends/console && npm run verify
# codegen ✓ | tsc ✓ | 7 tests ✓ | build ✓
```

## 后续阶段

- P14 K8s 完整 → `SPRINT-P14-k8s-full.md`
