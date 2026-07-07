# 网络管理

## 页面定位

`网络管理` 是 `Console / 算力与云资源` 下的租户侧资源管理页面，用于帮助用户查看、创建、删除和理解当前权限范围内的网络资源。

本页属于 `Console` 页面，不是 `BOSS` 的平台网络资源池运营页。

## 文档管理规则

- 本文件是 `网络管理` 的主维护源
- `prototypes/ani-services-prototype-console.html` 只保留页面摘要、模块边界和详细材料入口
- PRD：`tasks/modules/prd/console/compute/prd-console-network-management.md`（总 PRD；子模块见 `prd-console-network-*.md`）
- UX：`tasks/modules/ux/console/compute/ux-console-network-management.md`
- SPEC：`tasks/modules/spec/console/compute/spec-console-network-management.md` 等辅助材料，不替代本文件
- 如正文与辅助材料冲突，以本文件为准，并同步回修辅助材料

## Core 层要求

- `VPC`、`子网`、`安全组`、`负载均衡` 资源对象属于 `Core`
- 查询与动作接口必须使用 `/api/v1/*`
- 不允许把网络资源对象写入 `Services /api/v1/svc/*`
- 不允许继续使用旧的 `/api/v1/network/*` 或 `/api/v1/console/*` 路径
- 不要求前端显式传 `tenant_id` 或 `X-Tenant-Id`
- 租户边界必须从认证上下文或后端中间件获取
- 创建接口必须使用现有 `Core v1.yaml` 已冻结的 `idempotency_key`
- 新增接口说明必须具备 `operationId`、中文 `summary`、`tags`、`security`、完整 `responses`
- 错误响应格式统一为 `{"code":"UPPER_SNAKE","message":"...","request_id":"..."}`
- 本模块必须严格区分“已冻结 Core 能力”和“待补 Core 契约能力”

## 页面职责

- 展示网络资源对象关系和租户侧使用边界
- 展示当前租户下的 VPC、子网、安全组、负载均衡
- 提供这些资源的列表、详情、创建和删除入口
- 为 VM、容器、GPU 容器等页面提供网络关联回指入口
- 明确标出尚未进入 `Core v1.yaml` 的网络能力，避免误用旧路径和旧描述

## 页面结构

```text
网络管理
├── 页面定位与边界说明
├── 冻结能力概览
│   ├── VPC
│   ├── 子网
│   ├── 安全组（含内嵌 rules；整包 PATCH 更新见下）
│   ├── 负载均衡
│   └── 路由（list + create；单条 GET/DELETE 见 OpenAPI 扩展批次）
├── 待补能力说明
│   ├── 子网 IP 分配列表
│   ├── 安全组规则独立子资源 CRUD
│   └── 安全组绑定/解绑实例或网卡
├── 资源关系说明
└── 详细资源区
    ├── VPC
    ├── 子网
    ├── 安全组
    ├── 负载均衡
    └── 路由
```

## 交互与使用规则

- 页面默认展示当前租户、当前权限范围内的网络资源，不展示平台全量网络池
- 对已冻结能力，页面可以展示列表、详情、创建和删除入口
- 对待补能力，只能展示规划说明、禁用入口或待补提示，不能伪造 API
- 实例详情中的“网络”区域只展示当前关联关系和跳转入口，不重写底层网络资源契约
- 删除动作必须明确提示依赖关系和风险影响

## 数据来源与分层约束

### 数据来源划分

- `Core` 数据
  - VPC 列表、详情、创建、删除
  - 子网列表、详情、创建、删除
  - 安全组列表、详情、创建、删除；**rules 整包编辑**（`PATCH`，OpenAPI 扩展批次）
  - 负载均衡列表、详情、创建、删除
  - 路由列表、创建；单条详情/删除（OpenAPI 扩展批次）
- `Services` 数据
  - 本页不定义网络资源对象，不定义新的网络聚合资源契约

### 关键边界

- 本页承接 `Core v1.yaml` **Networks** 组已冻结路径，以及 **研发批次 CORE-NET-OPENAPI-A** 将补充的扩展路径（路由 GET/DELETE、安全组 PATCH）
- 本页不把 `子网 IP 分配`、`安全组规则独立子资源 CRUD`、`安全组绑定/解绑` 写成已对齐接口
- 路由 **Console 首期**可对接 list/create；单条 GET/DELETE 与 Core handler 对齐 **CORE-NET-ROUTES** 批次（见总 PRD）

## 页面区块与数据来源映射

| 区块 | 主要来源层 | 数据口径说明 | 跳转目标 |
|---|---|---|---|
| 冻结能力概览 | Core | 当前 `Core v1.yaml` 已冻结的网络资源组 | 各资源区 |
| VPC | Core | 展示当前租户下的 VPC 列表、详情、创建、删除 | VPC 详情 |
| 子网 | Core | 展示当前租户下的子网列表、详情、创建、删除 | 子网详情 |
| 安全组 | Core | 展示当前租户下的安全组列表、详情、创建、删除 | 安全组详情 |
| 负载均衡 | Core | 展示当前租户下的负载入口列表、详情、创建、删除 | 负载均衡详情 |
| 路由 | Core | list/create 已冻结；详情/删除待 OpenAPI 扩展 | 路由详情（扩展后） |
| 待补能力说明 | 规划项 | IP 分配、SG 独立 rules 子路径、绑定解绑 | 待补说明 |

## 模块区块详细说明

### 冻结能力概览

- 展示重点：`VPC / 子网 / 安全组 / 负载均衡`
- 主要来源层：Core
- 展示口径：对齐 `Core v1.yaml` 现有 `Networks` 路径组
- 异常/空态：无资源时展示空态，不伪造统计值
- 跳转目标：对应资源区

### VPC

- 展示重点：名称、CIDR、状态、创建时间、更新时间
- 主要来源层：Core
- 展示口径：对齐 `NetworkVPC`
- 异常/空态：找不到资源时展示 `NOT_FOUND`
- 跳转目标：VPC 详情

### 子网

- 展示重点：名称、所属 VPC、CIDR、网关、状态、创建时间
- 主要来源层：Core
- 展示口径：对齐 `NetworkSubnet`
- 异常/空态：找不到资源时展示 `NOT_FOUND`
- 跳转目标：子网详情

### 安全组

- 展示重点：名称、描述、规则数量、状态、创建时间
- 主要来源层：Core
- 展示口径：对齐 `NetworkSecurityGroup`
- 异常/空态：找不到资源时展示 `NOT_FOUND`
- 跳转目标：安全组详情

### 负载均衡

- 展示重点：名称、VPC、子网、类型、VIP、监听器数量、状态、创建时间
- 主要来源层：Core
- 展示口径：对齐 `NetworkLoadBalancer`
- 异常/空态：找不到资源时展示 `NOT_FOUND`
- 跳转目标：负载均衡详情

### 待补能力说明

- 展示重点：`路由`、`子网 IP 分配列表`、`安全组规则子资源 CRUD`、`安全组绑定解绑`
- 主要来源层：规划项
- 展示口径：当前仅保留规划说明，不形成正式接口契约
- 异常/空态：若后端无能力，入口保持禁用或仅展示说明
- 跳转目标：后续 `Core v1.yaml` 扩充

## 字段级定义

### VPC 字段

| 字段 | 说明 | 展示建议 |
|---|---|---|
| id | VPC ID | 文本；详情页保留复制能力 |
| name | VPC 名称 | 文本；列表可点击 |
| cidr | VPC 网段 | 文本 |
| state | 资源状态 | 标签展示 |
| reason | 状态原因 | 详情页展示 |
| created_at | 创建时间 | 时间 |
| updated_at | 更新时间 | 时间 |

### 子网字段

| 字段 | 说明 | 展示建议 |
|---|---|---|
| id | 子网 ID | 文本 |
| vpc_id | 所属 VPC ID | 文本或可跳转引用 |
| name | 子网名称 | 文本 |
| cidr | 子网网段 | 文本 |
| gateway | 网关地址 | 文本；为空时展示 `-` |
| state | 资源状态 | 标签展示 |
| reason | 状态原因 | 详情页展示 |
| created_at | 创建时间 | 时间 |
| updated_at | 更新时间 | 时间 |

### 安全组字段

| 字段 | 说明 | 展示建议 |
|---|---|---|
| id | 安全组 ID | 文本 |
| name | 安全组名称 | 文本 |
| description | 安全组描述 | 文本 |
| rules[] | 安全组规则数组 | 展示数量和简要规则摘要 |
| state | 资源状态 | 标签展示 |
| reason | 状态原因 | 详情页展示 |
| created_at | 创建时间 | 时间 |
| updated_at | 更新时间 | 时间 |

### 负载均衡字段

| 字段 | 说明 | 展示建议 |
|---|---|---|
| id | 负载均衡 ID | 文本 |
| name | 负载入口名称 | 文本 |
| vpc_id | 所属 VPC | 文本或可跳转引用 |
| subnet_id | 所属子网 | 文本或可跳转引用 |
| scheme | 类型 | `internal / public` 标签 |
| vip | 虚拟 IP | 文本 |
| listeners[] | 监听器数组 | 展示数量和协议/端口摘要 |
| state | 资源状态 | 标签展示 |
| reason | 状态原因 | 详情页展示 |
| created_at | 创建时间 | 时间 |
| updated_at | 更新时间 | 时间 |

## 字段展示规则

- 页面展示的网络资源字段必须直接映射现有 `Core v1.yaml` schema
- 可以在前端 view model 中转为 camelCase，但正文里的契约口径以 `Core v1.yaml` 为准
- 对 `tenant_id` 只视为后端返回字段，不视为前端必传字段
- 对 `rules[]` 和 `listeners[]` 首版以摘要展示为主，不凭空扩展独立资源编辑子路径

## 字段口径与单位

| 字段 | 口径 |
|---|---|
| `cidr` | 使用 CIDR 文本表示，如 `10.20.0.0/16` |
| `scheme` | 仅允许 `internal`、`public` |
| `listeners.port` | 使用整数端口号 |
| `listeners.target_port` | 使用整数端口号 |
| 时间字段 | 使用 ISO 8601 日期时间 |

## 状态与能力口径

### 已冻结的 Core 能力

- `GET /api/v1/networks/vpcs`
- `POST /api/v1/networks/vpcs`
- `GET /api/v1/networks/vpcs/{vpc_id}`
- `DELETE /api/v1/networks/vpcs/{vpc_id}`
- `GET /api/v1/networks/subnets`
- `POST /api/v1/networks/subnets`
- `GET /api/v1/networks/subnets/{subnet_id}`
- `DELETE /api/v1/networks/subnets/{subnet_id}`
- `GET /api/v1/networks/security-groups`
- `POST /api/v1/networks/security-groups`
- `GET /api/v1/networks/security-groups/{security_group_id}`
- `DELETE /api/v1/networks/security-groups/{security_group_id}`
- `GET /api/v1/networks/load-balancers`
- `POST /api/v1/networks/load-balancers`
- `GET /api/v1/networks/load-balancers/{load_balancer_id}`
- `DELETE /api/v1/networks/load-balancers/{load_balancer_id}`
- `GET /api/v1/networks/routes`
- `POST /api/v1/networks/routes`

### OpenAPI 扩展批次（CORE-NET-OPENAPI-A，研发前置）

> 下列路径 **当前 YAML 未声明**；全量子模块交付（含路由详情/删除、安全组 rules 编辑）须先完成本批次，再实现 handler / Console。

| 方法 | 路径 | 用途 |
|------|------|------|
| PATCH | `/api/v1/networks/security-groups/{security_group_id}` | 整包 `rules[]` + 可选 `description` |
| GET | `/api/v1/networks/routes/{route_id}` | 路由详情 |
| DELETE | `/api/v1/networks/routes/{route_id}` | 删除路由 |
| GET `/networks/subnets` 增加 query `vpc_id` | — | 子网按 VPC 服务端筛选 |
| DELETE VPC/子网/SG/LB 响应补充 `409` | — | 存在依赖时拒绝删除 |
| PATCH SG RBAC | `scope:networks:update` | Core 定稿 |

### 待补 Core 契约能力（本期 Non-Goals）
- 子网 IP 分配列表
- 安全组规则**独立**子资源 CRUD（本期用 PATCH 整包 rules，见 `security-group.md`）
- 安全组绑定/解绑实例或网卡

### P1 子模块详文（2026-06-17）

| 子页 | 主维护源 |
|---|---|
| VPC | `compute/network/vpc.md` |
| 子网 | `compute/network/subnet.md` |
| 安全组 | `compute/network/security-group.md` |
| 负载均衡 | `compute/network/load-balancer.md` |
| 路由 | `compute/network/route.md` |

## 创建前置条件

### `POST /api/v1/networks/vpcs`

- 调用方已通过标准鉴权
- 请求体必须包含 `name` 和 `idempotency_key`
- 若提供 `cidr`，必须满足 `Core v1.yaml` 的 CIDR 格式约束

### `POST /api/v1/networks/subnets`

- 调用方已通过标准鉴权
- 请求体必须包含 `vpc_id`、`name` 和 `idempotency_key`
- `vpc_id` 必须存在且当前租户可见
- 若提供 `gateway`，必须落在子网网段内

### `POST /api/v1/networks/security-groups`

- 调用方已通过标准鉴权
- 请求体必须包含 `name` 和 `idempotency_key`
- 若提供 `rules[]`，规则结构必须满足 `Core v1.yaml` 已冻结 schema

### `POST /api/v1/networks/load-balancers`

- 调用方已通过标准鉴权
- 请求体必须包含 `name`、`vpc_id` 和 `idempotency_key`
- `vpc_id` 必须存在且当前租户可见
- 若提供 `subnet_id`，则该子网必须存在且属于目标 VPC
- 若提供 `listeners[]`，协议和端口必须满足 `Core v1.yaml` 约束

## 产品经理补充定义

### 目标用户与权限视角

- 租户管理员：查看并管理当前租户可见的 VPC、子网、安全组与负载均衡
- 业务成员：查看资源关系、进入详情，并在授权前提下执行创建或删除
- 只读用户：仅查看资源列表、详情和依赖关系

### 默认视图与页面状态

- **信息架构（已确认，结构 C）：** 网络管理 **总览页** + 每类资源 **独立列表 / 详情 / 创建** 子页（VPC、子网、安全组、负载均衡、路由）；具体路由 UX 冻结
- 首屏默认展示 `冻结能力概览 + 资源关系说明 + 五类资源入口`
- 当租户尚无网络资源时，页面展示创建顺序引导：优先 VPC，再子网，再安全组，再负载均衡
- 删除相关冲突必须在操作前给出依赖提示，避免用户把 `409/冲突` 理解为系统故障
- 当某一类资源加载失败时，仅对应资源区报错，不影响其他资源区浏览

### 核心任务流

1. 用户先创建 VPC，再在对应 VPC 下创建子网和安全组，最后按需创建负载均衡
2. 用户从实例或服务详情回跳到网络资源详情，确认当前引用关系和影响范围
3. 用户在删除前查看依赖提示，确认不会误删正在被引用的网络对象

### 跨模块协同

- 与 `VM`、`容器实例`、`GPU 容器实例`、`K8s 集群` 协同，只通过引用关系和跳转进入
- 与首页协同，用于承接网络异常或资源不足的钻取入口
- 未冻结的 IP 分配、独立 rules 子路径、绑定解绑只保留边界说明
- 安全组 **rules 内嵌编辑**走 PATCH 整包更新（产品决策 2026-07-05）

### 产品验收补充

- 页面必须把网络资源创建顺序讲清楚，而不是只平铺四类资源列表
- 删除前依赖提示必须可读，用户能够知道风险来自哪个下游资源
- 空态、局部失败态、权限不足态都必须有不同文案，不得混用
- 本页不得把待补网络能力包装成可直接操作的正式入口

## 操作可用性矩阵

| 资源 | list/get | create | delete | 删除前置校验 |
|---|---|---|---|---|
| VPC | 可用 | 可用 | 可用 | 不允许删除仍存在子网或被负载均衡引用的 VPC |
| 子网 | 可用 | 可用 | 可用 | 不允许删除仍有实例落点或关键绑定的子网 |
| 安全组 | 可用 | 可用 | 可用 | 不允许删除仍被资源引用的安全组 |
| 负载均衡 | 可用 | 可用 | 可用 | 删除前需校验无不可删除的活动依赖 |

## 接口冻结规则

### `GET /api/v1/networks/vpcs`

| 项 | 值 |
|---|---|
| operationId | `listNetworkVPCs` |
| summary | `查询 VPC 列表` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| query params | `limit?`、`cursor?` |
| success | `200 + NetworkVPCListResponse` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN` |

### `POST /api/v1/networks/vpcs`

| 项 | 值 |
|---|---|
| operationId | `createNetworkVPC` |
| summary | `创建 VPC` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| requestBody.required | `name`、`idempotency_key` |
| success | `201 + NetworkVPC` |
| error responses | `400 BAD_REQUEST`、`401 UNAUTHORIZED`、`403 FORBIDDEN` |

### `GET /api/v1/networks/vpcs/{vpc_id}`

| 项 | 值 |
|---|---|
| operationId | `getNetworkVPC` |
| summary | `查询 VPC` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `vpc_id` |
| success | `200 + NetworkVPC` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND` |

### `DELETE /api/v1/networks/vpcs/{vpc_id}`

| 项 | 值 |
|---|---|
| operationId | `deleteNetworkVPC` |
| summary | `删除 VPC` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `vpc_id` |
| success | `200 + NetworkVPC` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT` |

### `GET /api/v1/networks/subnets`

| 项 | 值 |
|---|---|
| operationId | `listNetworkSubnets` |
| summary | `查询子网列表` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| query params | `limit?`、`cursor?` |
| success | `200 + NetworkSubnetListResponse` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN` |

### `POST /api/v1/networks/subnets`

| 项 | 值 |
|---|---|
| operationId | `createNetworkSubnet` |
| summary | `创建子网` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| requestBody.required | `vpc_id`、`name`、`idempotency_key` |
| success | `201 + NetworkSubnet` |
| error responses | `400 BAD_REQUEST`、`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND` |

### `GET /api/v1/networks/subnets/{subnet_id}`

| 项 | 值 |
|---|---|
| operationId | `getNetworkSubnet` |
| summary | `查询子网` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `subnet_id` |
| success | `200 + NetworkSubnet` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND` |

### `DELETE /api/v1/networks/subnets/{subnet_id}`

| 项 | 值 |
|---|---|
| operationId | `deleteNetworkSubnet` |
| summary | `删除子网` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `subnet_id` |
| success | `200 + NetworkSubnet` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT` |

### `GET /api/v1/networks/security-groups`

| 项 | 值 |
|---|---|
| operationId | `listNetworkSecurityGroups` |
| summary | `查询安全组列表` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| query params | `limit?`、`cursor?` |
| success | `200 + NetworkSecurityGroupListResponse` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN` |

### `POST /api/v1/networks/security-groups`

| 项 | 值 |
|---|---|
| operationId | `createNetworkSecurityGroup` |
| summary | `创建安全组` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| requestBody.required | `name`、`idempotency_key` |
| success | `201 + NetworkSecurityGroup` |
| error responses | `400 BAD_REQUEST`、`401 UNAUTHORIZED`、`403 FORBIDDEN` |

### `GET /api/v1/networks/security-groups/{security_group_id}`

| 项 | 值 |
|---|---|
| operationId | `getNetworkSecurityGroup` |
| summary | `查询安全组` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `security_group_id` |
| success | `200 + NetworkSecurityGroup` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND` |

### `DELETE /api/v1/networks/security-groups/{security_group_id}`

| 项 | 值 |
|---|---|
| operationId | `deleteNetworkSecurityGroup` |
| summary | `删除安全组` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `security_group_id` |
| success | `200 + NetworkSecurityGroup` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT` |

### `GET /api/v1/networks/load-balancers`

| 项 | 值 |
|---|---|
| operationId | `listNetworkLoadBalancers` |
| summary | `查询负载入口列表` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| query params | `limit?`、`cursor?` |
| success | `200 + NetworkLoadBalancerListResponse` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN` |

### `POST /api/v1/networks/load-balancers`

| 项 | 值 |
|---|---|
| operationId | `createNetworkLoadBalancer` |
| summary | `创建负载入口` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| requestBody.required | `name`、`vpc_id`、`idempotency_key` |
| success | `201 + NetworkLoadBalancer` |
| error responses | `400 BAD_REQUEST`、`401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND` |

### `GET /api/v1/networks/load-balancers/{load_balancer_id}`

| 项 | 值 |
|---|---|
| operationId | `getNetworkLoadBalancer` |
| summary | `查询负载入口` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `load_balancer_id` |
| success | `200 + NetworkLoadBalancer` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND` |

### `DELETE /api/v1/networks/load-balancers/{load_balancer_id}`

| 项 | 值 |
|---|---|
| operationId | `deleteNetworkLoadBalancer` |
| summary | `删除负载入口` |
| tags | `["Networks"]` |
| security | `[{BearerAuth: []}, {ApiKeyAuth: []}]` |
| path params | `load_balancer_id` |
| success | `200 + NetworkLoadBalancer` |
| error responses | `401 UNAUTHORIZED`、`403 FORBIDDEN`、`404 NOT_FOUND`、`409 CONFLICT` |

## 成功响应示例

### VPC 创建成功

```json
{
  "id": "vpc-8f3a",
  "tenant_id": "t-demo",
  "name": "vpc-prod",
  "cidr": "10.20.0.0/16",
  "state": "available",
  "reason": null,
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T10:00:00Z"
}
```

### 安全组详情成功

```json
{
  "id": "sg-2bd1",
  "tenant_id": "t-demo",
  "name": "sg-web",
  "description": "web ingress rules",
  "rules": [
    {
      "direction": "ingress",
      "protocol": "tcp",
      "port_range": "443",
      "cidr": "0.0.0.0/0",
      "action": "allow"
    }
  ],
  "state": "available",
  "reason": null,
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T10:00:00Z"
}
```

## 错误返回示例

```json
{
  "code": "CONFLICT",
  "message": "network vpc is still referenced by subnets",
  "request_id": "req-20260613-001"
}
```

## 错误返回示例

```json
{
  "code": "NOT_FOUND",
  "message": "network subnet not found",
  "request_id": "req-20260613-002"
}
```

## 回填前置依赖

- 后续若要把 `路由` 写入正式接口，必须先扩充 `Core v1.yaml`
- 后续若要增加 `子网 IP 分配列表`，必须先补充正式 schema 与路径
- 后续若要增加 `安全组规则子资源 CRUD` 或 `绑定/解绑`，必须先补充 `Core v1.yaml`

## 待确认项

- 路由表未来是独立资源组，还是仍附着在 VPC/子网之下
- 子网 IP 分配列表是否进入下一轮 `Core v1.yaml` 扩充
- 安全组规则未来是否要拆分为独立子资源

## 回填验收标准

- 正文明确区分已冻结能力与待补能力
- 正文不再出现旧 `/api/v1/network/*`、旧 `/api/v1/console/*` 路径
- 正文不要求前端显式传 `tenant_id / X-Tenant-Id`
- 正文中的路径、返回码、请求字段与现有 `Core v1.yaml` 一致
- `PRD`、`SPEC`、HTML 摘要和本文件一致
- 本文件可以独立作为 `Console / 网络管理` 对齐 `Core` 的主维护材料
