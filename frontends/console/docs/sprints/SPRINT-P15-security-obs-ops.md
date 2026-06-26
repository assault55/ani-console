# SPRINT-P15 · 安全/监控/操作详情

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

## 目标

深化加密密钥高级操作、Secret 绑定、告警规则编辑、实例操作详情页。

## 交付物

| 能力 | API | 路径 |
|------|-----|------|
| 密钥轮换/吊销 | `POST .../rotate`、`POST .../revoke` | `encryption/index.tsx` |
| Seal / Unseal | `POST /encryption/seal`、`POST /encryption/unseal-token` | `encryption/index.tsx` |
| Secret 详情 | `GET /secrets/{id}` | `secrets/$secretId.tsx` |
| Secret 绑定实例 | `POST .../bindings` | `secrets/$secretId.tsx` |
| 告警规则编辑/删除 | `PATCH/DELETE .../alert-rules/{id}` | `observability/index.tsx` |
| 操作详情页 | `GET /instance-operations/{id}` | `instance-operations/$operationId.tsx` |
| 实例操作列表详情链接 | — | `instances/$instanceId.operations.tsx` |

## 契约对齐说明

- `seal`：`key_id` + `object_uri` + `idempotency_key`
- `unseal-token`：`key_id` + `sealed_object_uri`（无 idempotency_key）
- `bindSecret` body：`target_type` + `target_id`（无 idempotency_key）

## 验收结果

```bash
cd frontends/console && npm run verify
# codegen ✓ | tsc ✓ | 7 tests ✓ | build ✓
```

## 已知未覆盖（有意保留）

- `reportTokenUsage`（Console 不上报用量）
- BareMetal / Notifications / Audit（契约无 path，仅占位页）
- 部分网络/向量库 GET 详情 Drawer（可后续 P16+ 迭代）
