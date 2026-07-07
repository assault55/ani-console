# PRD: Console 网络负载均衡

> Revised: 2026-07-05
> 父 PRD：`prd-console-network-management.md`
> 详文：`docs/console-modules/compute/network/load-balancer.md`

## 1. Introduction

负载均衡 **list / get / create / delete**；`listeners[]` 创建时可配置，详情只读摘要。

## 2. Goals

- scheme：`internal` / `public`
- 创建必填 `vpc_id`；可选 `subnet_id`、`listeners`
- VIP 只读展示（provider 分配）

## 3. User Stories

### US-001: Core — Load balancer handlers

**Acceptance Criteria:**

- [ ] 四 operation 与 YAML 一致
- [ ] 无效 vpc_id → 404
- [ ] listeners schema 校验

### US-002: Console — 列表与详情

**Acceptance Criteria:**

- [ ] Table：name、scheme Tag、vip、listeners 数量、state
- [ ] 详情 listeners 子 Table：protocol、port、target_port
- [ ] vpc_id / subnet_id 可跳转
- [ ] browser：loading / empty / error

### US-003: Console — 创建负载均衡

**Acceptance Criteria:**

- [ ] 表单：name、vpc_id、subnet_id、scheme、listeners 动态行
- [ ] idempotency_key
- [ ] 至少 0 个 listener 允许（YAML 默认空数组）

### US-004: Console — 删除

**Acceptance Criteria:**

- [ ] Popconfirm

## 4. Functional Requirements

- FR-1: 不得自造 listeners 子路径 CRUD
- FR-2: 不得自造 target group / 健康检查 API

## 5. Non-Goals

- listeners 独立 CRUD
- LB PATCH
- 后端实例绑定

## 6. ANI Boundaries

| idempotency_key | POST create |

## References

- `vpc.md`、`subnet.md`、父 PRD
