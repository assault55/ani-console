# 网络管理 — 路由

## 页面定位

`路由` 是网络管理下 VPC 路由表/路由条目的管理页。

父级：`network-management.md`。

## 文档管理规则

- 本文是路由子模块主维护源
- PRD：`tasks/modules/prd/console/compute/prd-console-network-route.md`
- 一级权威源：`repo/api/openapi/v1.yaml`

## Core 层要求 — 已冻结

<!-- ADDED-TO-YAML: GET/POST /api/v1/networks/routes (Core v1.yaml, Phase 2 2026-06-17) -->

| 方法 | 路径 | operationId | RBAC |
|------|------|-------------|------|
| GET | `/api/v1/networks/routes` | `listNetworkRoutes` | `scope:networks:read` |
| POST | `/api/v1/networks/routes` | `createNetworkRoute` | `scope:networks:create` |

Query（list）：`vpc_id`、`limit`、`cursor`。

Schema：`NetworkRoute`、`NetworkRouteListResponse`、`CreateNetworkRouteRequest`。

POST 创建必须带 `idempotency_key`、`vpc_id`、`destination_cidr`、`next_hop_type`、`next_hop_id`。

## Core 层要求 — OpenAPI 扩展（CORE-NET-OPENAPI-A）

| 方法 | 路径 | operationId | RBAC |
|------|------|-------------|------|
| GET | `/api/v1/networks/routes/{route_id}` | `getNetworkRoute` | `scope:networks:read` |
| DELETE | `/api/v1/networks/routes/{route_id}` | `deleteNetworkRoute` | `scope:networks:delete` |

## 研发批次（产品决策 2026-07-05）

| 批次 | 范围 |
|------|------|
| **CONSOLE-NET-ROUTES-UI** | Console 路由 list + create + 列表行删除（依赖扩展 DELETE）；可先 mock/local |
| **CORE-NET-ROUTES** | Core handler：list/create（+ 扩展 GET/DELETE）；**晚于** VPC/子网/SG/LB 主路径 |

Console 首期不得阻塞在 Core route handler；但 **不得自造** API 路径。

## 页面职责

- 按 VPC 筛选路由列表；创建路由
- 展示 `destination_cidr`、`next_hop_type`、`next_hop_id`、`description`
- 扩展 API 可用后：路由详情、单条删除

## 创建前置条件

| 依赖项 | 要求状态 | 未满足时的 HTTP 响应 |
|--------|----------|----------------------|
| 用户登录 | 已认证 | `401 UNAUTHORIZED` |
| 读/写权限 | 对应 networks scope | `403 FORBIDDEN` |
| POST 请求体 | 满足 `CreateNetworkRouteRequest` | `400 BAD_REQUEST` |
| 关联 `vpc_id` | 有效 | `404 NOT_FOUND`（create 已声明） |
| 路由冲突 | 无重复 destination | `409 CONFLICT`（create 已声明） |

## 操作可用性矩阵

| 操作 | 只读用户 | 网络管理员 |
|------|----------|------------|
| 列表 | ✅ | ✅ |
| 创建 | ❌ | ✅ |
| 查看单条详情 | ❌ → ✅ | 扩展 GET 后 |
| 删除单条 | ❌ → ✅ | 扩展 DELETE 后 |

## 接口冻结规则

### `GET /api/v1/networks/routes`

- 成功：`200 + NetworkRouteListResponse`
- 错误：`401`、`403`
- Query 可选：`vpc_id`、`limit`、`cursor`

### `POST /api/v1/networks/routes`

- 成功：`201 + NetworkRoute`
- 错误：`400`、`401`、`403`、`404`、`409`

### `GET /api/v1/networks/routes/{route_id}`（扩展）

- 成功：`200 + NetworkRoute`
- 错误：`401`、`403`、`404`

### `DELETE /api/v1/networks/routes/{route_id}`（扩展）

- 成功：`200 + NetworkRoute`
- 错误：`401`、`403`、`404`

## 待补边界

- 路由更新 PATCH — **TODO-YAML**
- 路由优先级字段 — 以未来 schema 为准

## 验收标准

- [ ] list/create 与 Phase 2 YAML 一致
- [ ] GET/DELETE 仅在 OpenAPI 扩展落地后写入冻结事实
- [ ] 接口冻结规则逐 operation 列出成功码与错误码
