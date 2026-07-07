# PRD: Console 网络路由

> Revised: 2026-07-05
> 父 PRD：`prd-console-network-management.md`
> 详文：`docs/console-modules/compute/network/route.md`

## 1. Introduction

VPC 路由 **list / create**（已冻结）+ **get / delete**（OpenAPI 扩展）；**Console 先行，Core handler 独立批次**（4C）。

## 2. Goals

- Console 路由 UI 不阻塞在 Core route handler 完成
- list 按 `vpc_id` 筛选（YAML 已支持 query）
- create 处理 409 路由冲突
- 扩展 API 落地后补详情页与删除

## 3. User Stories

### US-001: Core — Route list/create handlers（CORE-NET-ROUTES）

**Acceptance Criteria:**

- [ ] `listNetworkRoutes`、`createNetworkRoute`
- [ ] create：404 vpc、409 冲突
- [ ] **可晚于** VPC/SG/LB handler 验收

### US-002: Core — Route GET/DELETE（OPENAPI-A + CORE-NET-ROUTES）

**Acceptance Criteria:**

- [ ] OpenAPI 扩展 `getNetworkRoute`、`deleteNetworkRoute`
- [ ] GET 404；DELETE 200

### US-003: Console — 路由列表与创建

**Acceptance Criteria:**

- [ ] VPC Select 筛选 + Table：destination_cidr、next_hop_type、next_hop_id、created_at
- [ ] 创建 Dialog：vpc_id、destination_cidr、next_hop_type、next_hop_id、description
- [ ] idempotency_key；409 展示冲突文案
- [ ] Core list/create 未就绪时 **允许 dev mock**（产品决策）；不得自造正式 API 路径
- [ ] browser：loading / empty / error

### US-004: Console — 路由详情与删除（依赖扩展 API）

**Acceptance Criteria:**

- [ ] GET by id 详情页或 Drawer
- [ ] 列表行删除 + Popconfirm → DELETE
- [ ] API 未就绪时入口 hidden 或 disabled + tooltip

## 4. Functional Requirements

- FR-1: 不得自造 `{route_id}` 路径 before OpenAPI 扩展
- FR-2: next_hop_type 枚举：gateway / instance / nat

## 5. Non-Goals

- 路由 PATCH
- 路由优先级 UI（schema 未冻结）

## 6. ANI Boundaries

| Console 先行 | list/create UI |
| Core 批次 | CORE-NET-ROUTES |
| OpenAPI 扩展 | GET/DELETE route |

## References

- `vpc.md`、父 PRD
