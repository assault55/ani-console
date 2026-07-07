# 网络管理 — 安全组

## 页面定位

`安全组` 是网络管理下安全组资源的独立明细页。

父级：`network-management.md`。

## 文档管理规则

- 本文是安全组子模块主维护源
- PRD：`tasks/modules/prd/console/compute/prd-console-network-security-group.md`
- 一级权威源：`repo/api/openapi/v1.yaml`

## Core 层要求 — 已冻结

| 方法 | 路径 | operationId | RBAC |
|------|------|-------------|------|
| GET | `/api/v1/networks/security-groups` | `listNetworkSecurityGroups` | `scope:networks:read` |
| POST | `/api/v1/networks/security-groups` | `createNetworkSecurityGroup` | `scope:networks:create` |
| GET | `/api/v1/networks/security-groups/{security_group_id}` | `getNetworkSecurityGroup` | `scope:networks:read` |
| DELETE | `/api/v1/networks/security-groups/{security_group_id}` | `deleteNetworkSecurityGroup` | `scope:networks:delete` |

Schema：`NetworkSecurityGroup`（内嵌 `rules[]`）；`NetworkSecurityGroupRule` 字段：`direction`、`protocol`、`port_range`、`cidr`、`action`。

POST 创建必须带 `idempotency_key`；创建时可带初始 `rules[]`。

## Core 层要求 — OpenAPI 扩展（CORE-NET-OPENAPI-A）

| 方法 | 路径 | operationId | RBAC | 说明 |
|------|------|-------------|------|------|
| PATCH | `/api/v1/networks/security-groups/{security_group_id}` | `updateNetworkSecurityGroup` | `scope:networks:update`（Core 定稿） | 整包 `rules[]` + 可选 `description` |

**产品决策（2026-07-05）：** rules 编辑采用 **PATCH 整包替换**，不新增 `/rules` 子资源路径。

## 页面职责

- 安全组列表、详情、创建、删除
- 详情页 **rules 表格** + **编辑 rules**（Dialog/Drawer 内编辑完整 `rules[]` 后 PATCH 提交）
- 列表页展示 rules 数量与简要摘要
- **不提供**独立 rules 子路径 CRUD UI

## 页面结构

```text
安全组
├── 列表（limit/cursor）
├── 创建表单（name、description、可选 rules[]）
├── 详情（rules 表格只读 + 编辑入口）
├── 编辑 rules（整包 PATCH）
└── 删除确认
```

## 创建前置条件

| 依赖项 | 要求状态 | 未满足时的 HTTP 响应 |
|--------|----------|----------------------|
| 用户登录 | 已认证 | `401 UNAUTHORIZED` |
| 读/写权限 | 对应 networks scope | `403 FORBIDDEN` |
| POST 必填 | `name`、`idempotency_key` | `400 BAD_REQUEST` |
| `rules[]` 若提供 | 满足 YAML schema | `400 BAD_REQUEST` |

## 操作可用性矩阵

| 操作 | 只读用户 | 网络管理员 |
|------|----------|------------|
| 列表/详情 | ✅ | ✅ |
| 创建/删除 | ❌ | ✅ |
| 编辑 rules（PATCH 整包） | ❌ | ✅（扩展 API 可用后） |

## 接口冻结规则

### `GET /api/v1/networks/security-groups`

- 成功：`200 + NetworkSecurityGroupListResponse`
- 错误：`401`、`403`

### `POST /api/v1/networks/security-groups`

- 成功：`201 + NetworkSecurityGroup`
- 错误：`400`、`401`、`403`

### `GET /api/v1/networks/security-groups/{security_group_id}`

- 成功：`200 + NetworkSecurityGroup`
- 错误：`401`、`403`、`404`

### `DELETE /api/v1/networks/security-groups/{security_group_id}`

- 成功：`200 + NetworkSecurityGroup`
- 错误：`401`、`403`、`404`

### `PATCH /api/v1/networks/security-groups/{security_group_id}`（扩展）

- 成功：`200 + NetworkSecurityGroup`
- 错误：`400`、`401`、`403`、`404`、`409`（冲突，若 Core 声明）
- requestBody.required：`idempotency_key`、`rules`；可选 **`description`**

## 待补边界

- 安全组规则**独立**子资源 CRUD — **本期 Non-Goal**（用 PATCH 整包）
- 安全组绑定/解绑实例或网卡 — **TODO-YAML**
- 安全组 rename PATCH — **可选后续**；本期仅 rules + description

## 验收标准

- [ ] 不把 `/security-groups/{id}/rules` 子路径写成已冻结
- [ ] rules 编辑 UI 提交完整 `rules[]` 数组
- [ ] 接口冻结规则逐 operation 列出成功码与错误码
