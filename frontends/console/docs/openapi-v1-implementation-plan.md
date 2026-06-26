# OpenAPI v1 实现计划

## 范围

本文档用于跟踪 Console 按 `design/openapi/v1.yaml` 实现 Core API 功能的工作。
除非产品范围发生变化，`openapi/services/v1.yaml` 仍不在本 Console 的实现范围内。

后端验证优先使用真实后端。若按契约调用 API 失败，需要在本文档记录失败结果，并跳过依赖该接口的后续验证。不得伪造后端成功响应。

## 当前结论

- `design/openapi/services/v1.yaml` 与 `ANI/repo/api/openapi/services/v1.yaml` 一致。
- `design/openapi/v1.yaml` 与 `ANI/repo/api/openapi/v1.yaml` 只有一处差异：
  `/branding` 响应 schema 中，design 版本包含 `type: object`。
- `ani-gateway` 将 Core 路由注册在 `/api/v1` 下，但健康检查注册为 `/healthz` 和 `/readyz`；
  按 OpenAPI 的 server 前缀推导，契约路径应为 `/api/v1/healthz` 和 `/api/v1/readyz`。
- Console 已覆盖大部分 Core 操作，但部分操作仍不完整、偏 demo 形态，或缺少 UI 入口。

## 执行规则

- 每个批次动代码前，先写入或更新本文档。
- 遵循现有 Console 规范：TanStack Query、`coreApi`、Arco 组件、`CursorTable`、`showApiError`、生成的 OpenAPI 类型。
- 优先使用契约形态的请求。若真实后端拒绝契约形态请求，需要记录 endpoint、请求摘要、HTTP 状态和响应。
- 如认证失败，仅在本地命令中使用临时 Bearer token。不得将 token 写入源码或文档。
- 实现后必须测试。若因为环境或后端状态无法执行某项测试，需要记录原因。

## 任务批次

### P0 - 对象存储正确性

状态：已实现，验证部分完成

涉及操作：
- `GET /objects`
- `POST /objects/upload`
- `GET /objects/{object_id}`
- `GET /objects/{object_id}/download`
- `DELETE /objects/{object_id}`

计划变更：
- 已完成：检查预签名上传 URL 的 `PUT` 响应，并把失败反馈到 UI。
- 已完成：移除 `GET /objects` 中契约外的 `bucket_id` query 参数。
  Console 现在按契约调用列表接口；当响应包含 `StorageObject.bucket` 时，前端按当前选择的 bucket 名称过滤可见行。
- 已完成：通过 `GET /objects/{object_id}` 增加对象元数据详情。

说明：
- `v1.yaml` 中 `GET /objects` 没有 bucket 过滤参数，但 UI 工作流是按 bucket 组织的。
  如果大规模对象列表需要后端侧 bucket 过滤，这是一个契约缺口。

测试计划：
- `npm run typecheck`
- `npm run test`
- 若现有测试没有覆盖上传失败，再补 focused UI/mock 测试。

后端验证：
- 2026-06-26：使用刷新后的临时 Bearer token 调用 `VITE_API_PROXY_TARGET`，
  `GET /api/v1/objects?limit=1` 返回 200。
- 2026-06-26：使用已有对象验证
  `GET /api/v1/objects/{object_id}` 和
  `GET /api/v1/objects/{object_id}/download`，均返回 200。
- 为避免修改真实对象存储，未执行上传 URL 的实际 `PUT`。

### P1 - Secret 生命周期

状态：已实现，验证部分完成

涉及操作：
- `GET /secrets`
- `POST /secrets`
- `GET /secrets/{secret_id}`
- `DELETE /secrets/{secret_id}`
- `POST /secrets/{secret_id}/bindings`

计划变更：
- 已完成：将硬编码 Secret 数据替换为 key/value 表单。
- 已完成：在列表页和详情页增加删除操作。
- 已完成：扩展绑定表单，支持目标类型以及可选的 `mount_path`、`env_prefix`。

测试计划：
- 执行 typecheck。
- 在现有 mock 支持的范围内执行单测/E2E。

后端验证：
- 2026-06-26：使用刷新后的临时 Bearer token 调用 `VITE_API_PROXY_TARGET`，
  `GET /api/v1/secrets?limit=1` 返回 200，响应 `items` 为空。
- 为避免修改真实后端状态，跳过 Secret 创建/删除验证。

### P1 - Encryption Key 生命周期

状态：已实现，验证部分完成

涉及操作：
- `GET /encryption/keys`
- `POST /encryption/keys`
- `GET /encryption/keys/{key_id}`
- `DELETE /encryption/keys/{key_id}`
- `POST /encryption/keys/{key_id}/rotate`
- `POST /encryption/keys/{key_id}/revoke`
- `POST /encryption/seal`
- `POST /encryption/unseal-token`

计划变更：
- 已完成：通过 `GET /encryption/keys/{key_id}` 增加 key 详情。
- 已完成：通过 `DELETE /encryption/keys/{key_id}` 增加 key 删除。
- 已完成：在表格操作中区分“吊销”和“删除”。
- 已完成：创建时支持算法选择。

测试计划：
- 执行 typecheck。
- 如可行，增加 focused 交互测试。

后端验证：
- 2026-06-26：使用刷新后的临时 Bearer token 调用 `VITE_API_PROXY_TARGET`，
  `GET /api/v1/encryption/keys?limit=1` 返回 200，响应 `items` 为空。
- 因没有现有 key，且未对真实后端执行创建/删除等变更操作，跳过 key 详情/删除验证。

### P2 - K8s 集群管理

状态：已实现，验证部分完成

涉及操作：
- `POST /k8s-clusters`
- `POST /k8s-clusters/{cluster_id}/upgrade`
- `GET /k8s-clusters/{cluster_id}/node-pools/{node_pool_id}`
- `PATCH /k8s-clusters/{cluster_id}/node-pools/{node_pool_id}`

计划变更：
- 已完成：创建集群时，版本由用户输入控制。
- 已完成：升级集群时，版本由用户输入控制。
- 已完成：创建节点池时，`node_count` 和 `instance_type` 由用户输入控制。
- 已完成：通过 `GET /k8s-clusters/{cluster_id}/node-pools/{node_pool_id}` 增加节点池详情。
- 已完成：通过 `PATCH /k8s-clusters/{cluster_id}/node-pools/{node_pool_id}` 增加节点池更新。

测试计划：
- 执行 typecheck。
- 执行现有 K8s E2E，并按新增控件调整测试。

后端验证：
- 2026-06-26：使用刷新后的临时 Bearer token 调用 `VITE_API_PROXY_TARGET`，
  `GET /api/v1/k8s-clusters?limit=1` 返回 200，响应 `items` 为空。
- 因没有现有集群/节点池，且未对真实后端执行创建/更新操作，跳过节点池详情/PATCH 验证。

### P3 - 可观测性与存储细节

状态：部分实现，验证部分完成

涉及操作：
- `GET /observability/alert-rules/{rule_id}`
- `DELETE /filesystems/{filesystem_id}`
- `POST /metering/token-usage`

计划变更：
- 已完成：编辑告警规则前，先获取告警规则详情。
- 已完成：在文件系统列表页和详情页增加删除操作。
- 已延后：`POST /metering/token-usage` 视为 Services 上报 Core 的接口；
  除非 Console 产品范围明确要求，否则暂不做 UI。

测试计划：
- 执行 typecheck。
- 如页面有改动，补充 focused 页面测试。

后端验证：
- 2026-06-26：使用刷新后的临时 Bearer token 调用 `VITE_API_PROXY_TARGET`，
  `GET /api/v1/filesystems?limit=1` 和
  `GET /api/v1/observability/alert-rules?limit=1` 均返回 200，两个响应的 `items` 均为空。
- 因没有目标资源，且未对真实后端执行变更操作，跳过文件系统删除和告警规则详情验证。

## 验证记录

- 2026-06-26：P0 对象存储代码变更已完成，`npm run typecheck` 通过。
- 2026-06-26：P1 Secret 生命周期代码变更已完成。
- 2026-06-26：P1 Secret 生命周期 `npm run typecheck` 通过。
- 2026-06-26：P1 Encryption 生命周期代码变更已完成。
- 2026-06-26：P1 Encryption 生命周期 `npm run typecheck` 通过。
- 2026-06-26：P2 K8s 集群管理代码变更已完成。
- 2026-06-26：P2 K8s 集群管理 `npm run typecheck` 通过。
- 2026-06-26：P3 可观测性/文件系统代码变更已完成。
- 2026-06-26：P3 可观测性/文件系统 `npm run typecheck` 通过。
- 2026-06-26：`npm run test` 通过：9 个文件，24 个测试。
- 2026-06-26：`npm run build` 通过。
- 2026-06-26：已启动 `npm run test:e2e`，但在 `scripts/ensure-e2e.mjs`
  输出“检查 Playwright Chromium...”后数分钟无进一步输出。该进程已通过 SIGINT 中断，
  记录为环境/工具阻塞，不视为功能断言失败。
- 2026-06-26：第一次真实后端探测使用旧临时 token 返回 401。
  随后使用刷新后的临时 token，仅在命令 header 中使用；相同只读列表探测对 objects、
  secrets、encryption keys、K8s clusters、filesystems、observability alert rules 均返回 200。
