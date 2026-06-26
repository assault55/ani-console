# SPRINT-P14 · K8s 集群完整能力

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

## 目标

在 P9 基础之上，补齐集群创建、节点池 CRUD、API Proxy 调试 Tab。

## 交付物

| 能力 | API | 路径 |
|------|-----|------|
| 创建集群 + 异步任务轮询 | `POST /k8s-clusters` | `k8s-clusters/index.tsx` → `ClusterList` |
| 创建节点池 | `POST .../node-pools`（`node_count`） | 详情 Tab「节点池」 |
| 删除节点池 | `DELETE .../node-pools/{id}` | 详情 Tab「节点池」 |
| API Proxy | `POST .../proxy`（`method` + `path`） | 详情 Tab「API Proxy」 |
| 保留 P9 能力 | 升级 / kubeconfig / workloads | 同文件详情视图 |

## 契约对齐说明

- 节点池创建 body 使用 `node_count`（非 `desired_size`）
- 创建/升级集群通过 `Location` 头解析 `task_id`，复用 `AsyncTaskPoller`

## 验收结果

```bash
cd frontends/console && npm run verify
# codegen ✓ | tsc ✓ | 7 tests ✓ | build ✓
```

## 后续阶段

- P15 安全/监控/操作详情 → `SPRINT-P15-security-obs-ops.md`
