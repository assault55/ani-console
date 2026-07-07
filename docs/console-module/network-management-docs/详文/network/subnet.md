# 网络管理 — 子网

## 页面定位

`子网` 是网络管理下子网资源的独立明细页，用于管理 VPC 内子网划分。

父级：`network-management.md`。

## 文档管理规则

- 本文是子网子模块主维护源
- PRD：`tasks/modules/prd/console/compute/prd-console-network-subnet.md`

## Core 层要求

| 方法 | 路径 | operationId | RBAC |
|---|---|---|---|
| GET | `/api/v1/networks/subnets` | `listNetworkSubnets` | `scope:networks:read` |
| POST | `/api/v1/networks/subnets` | `createNetworkSubnet` | `scope:networks:create` |
| GET | `/api/v1/networks/subnets/{subnet_id}` | `getNetworkSubnet` | `scope:networks:read` |
| DELETE | `/api/v1/networks/subnets/{subnet_id}` | `deleteNetworkSubnet` | `scope:networks:delete` |

Schema：`NetworkSubnet`、`NetworkSubnetListResponse`、`CreateNetworkSubnetRequest`。

POST 创建必须带 `idempotency_key`。

## 页面职责

- 子网列表（可按 `vpc_id` 筛选）、详情、创建、删除
- 展示所属 VPC、CIDR、gateway、状态

## 创建前置条件

| 依赖项 | 要求状态 | 未满足时的 HTTP 响应 |
|---|---|---|
| 用户登录 | 已认证 | `401 UNAUTHORIZED` |
| 读/写权限 | 对应 networks scope | `403 FORBIDDEN` |
| POST 必填 | `vpc_id`、`name`、`idempotency_key` | `400 BAD_REQUEST` |
| `vpc_id` | 存在且租户可见 | `404 NOT_FOUND` |
| `gateway` 若提供 | 落在子网 CIDR 内 | `400 BAD_REQUEST` |

**当前 YAML 未在 create 声明 `422`**。

## 操作可用性矩阵

| 操作 | 只读用户 | 网络管理员 |
|---|---|---|
| 列表/详情 | ✅ | ✅ |
| 创建/删除 | ❌ | ✅ |

## 接口冻结规则

### `GET /api/v1/networks/subnets`

- 成功：`200 + NetworkSubnetListResponse`
- 错误：`401`、`403`
- Query：`limit`、`cursor`、**`vpc_id`（OPENAPI-A 补充）**

### `POST /api/v1/networks/subnets`

- 成功：`201 + NetworkSubnet`
- 错误：`400`、`401`、`403`、`404`

### `GET /api/v1/networks/subnets/{subnet_id}`

- 成功：`200 + NetworkSubnet`
- 错误：`401`、`403`、`404`

### `DELETE /api/v1/networks/subnets/{subnet_id}`

- 成功：`200 + NetworkSubnet`
- 错误：`401`、`403`、`404`

## 待补边界

- 子网 IP 分配列表 — **当前 YAML 未声明**
- 子网更新 PATCH — **当前 YAML 未声明**
- 子网 list 按 **`vpc_id` query 服务端筛选**（OPENAPI-A 补充；禁止仅客户端过滤）
- 子网更新 PATCH — **当前 YAML 未声明**

## 相关模块

- `vpc.md` — 所属 VPC
- `load-balancer.md` — 负载均衡关联子网

## 验收标准

- [ ] 字段映射 `NetworkSubnet`，与父文档一致
- [ ] 接口冻结规则逐 operation 列出成功码与错误码
