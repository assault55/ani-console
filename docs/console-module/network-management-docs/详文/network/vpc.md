# 网络管理 — VPC

## 页面定位

`VPC` 是 `Console / 网络管理` 下 VPC 资源的独立明细页，承接租户侧 VPC 的列表、详情、创建与删除。

本模块属于 **Core / Networks**，父级总览见 `network-management.md`。

## 文档管理规则

- 本文是 VPC 子模块主维护源
- PRD：`tasks/modules/prd/console/compute/prd-console-network-vpc.md`
- 共享 Core 合规规则以 `network-management.md` 为准；冲突时以 OpenAPI 为准
- 一级权威源：`ANI-main/repo/api/openapi/v1.yaml`

## Core 层要求

| 方法 | 路径 | operationId | RBAC |
|---|---|---|---|
| GET | `/api/v1/networks/vpcs` | `listNetworkVPCs` | `scope:networks:read` |
| POST | `/api/v1/networks/vpcs` | `createNetworkVPC` | `scope:networks:create` |
| GET | `/api/v1/networks/vpcs/{vpc_id}` | `getNetworkVPC` | `scope:networks:read` |
| DELETE | `/api/v1/networks/vpcs/{vpc_id}` | `deleteNetworkVPC` | `scope:networks:delete` |

Schema：`NetworkVPC`；列表 `NetworkVPCListResponse`；创建 `CreateNetworkVPCRequest`。

- 不允许把 VPC 写入 Services `/api/v1/svc/*`
- 页面不要求前端显式传 `tenant_id`
- POST 创建必须带 `idempotency_key`

## 页面职责

- VPC 列表与筛选、详情、创建、删除
- 展示 CIDR、状态、创建/更新时间
- 提供跳转：子网、安全组、负载均衡（同 VPC 上下文）

## 页面结构

```text
VPC
├── 列表（limit/cursor）
├── 创建表单
├── 详情
└── 删除确认
```

## 创建前置条件

| 依赖项 | 要求状态 | 未满足时的 HTTP 响应 |
|---|---|---|
| 用户登录 | 已认证 | `401 UNAUTHORIZED` |
| 读权限 | `scope:networks:read` | `403 FORBIDDEN` |
| 创建权限 | `scope:networks:create` | `403 FORBIDDEN` |
| POST 必填 | `name`、`idempotency_key` | `400 BAD_REQUEST` |
| `cidr` 若提供 | 符合 YAML 格式 | `400 BAD_REQUEST` |
| 名称冲突 | 租户内唯一 | **当前 YAML 未在 create 声明 `409`** |

删除时若存在依赖资源，**当前 YAML 未在 delete 声明 `409`**；产品建议冲突语义待 Core 补充。

## 操作可用性矩阵

| 操作 | 只读用户 | 网络管理员 |
|---|---|---|
| 列表/详情 | ✅ | ✅ |
| 创建 | ❌ | ✅ |
| 删除 | ❌ | ✅ |

## 接口冻结规则

### `GET /api/v1/networks/vpcs`

- 成功：`200 + NetworkVPCListResponse`
- 错误：`401`、`403`

### `POST /api/v1/networks/vpcs`

- 成功：`201 + NetworkVPC`
- 错误：`400`、`401`、`403`
- requestBody.required：`name`、`idempotency_key`（以 `CreateNetworkVPCRequest` 为准）

### `GET /api/v1/networks/vpcs/{vpc_id}`

- 成功：`200 + NetworkVPC`
- 错误：`401`、`403`、`404`

### `DELETE /api/v1/networks/vpcs/{vpc_id}`

- 成功：`200 + NetworkVPC`
- 错误：`401`、`403`、`404`、**`409`（存在依赖，OPENAPI 补充）**

## 待补边界

- VPC 更新 PATCH — **当前 YAML 未声明**
- 删除冲突 `409` — 见接口冻结规则（OPENAPI 补充）
- VPC 对等连接 / 跨 VPC 路由 — 待 Phase 3+

## 相关模块

- `subnet.md`、`security-group.md`、`load-balancer.md`、`route.md`
- `network-management.md` — 父级总览

## 验收标准

- [ ] 路径与 `v1.yaml` `Networks` 组一致
- [ ] 不自造 VPC 专属扩展 schema
- [ ] 接口冻结规则逐 operation 列出成功码与错误码
