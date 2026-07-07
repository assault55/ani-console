# PRD: Console 网络子网

> Revised: 2026-07-05
> 父 PRD：`prd-console-network-management.md`
> 详文：`docs/console-modules/compute/network/subnet.md`

## 1. Introduction

VPC 内子网 **list / get / create / delete**。

## 2. Goals

- POST 必填 `vpc_id`、`name`、`idempotency_key`
- 创建表单 VPC 下拉来自 `listNetworkVPCs`
- list 必须支持 query **`vpc_id`** 服务端筛选（OPENAPI-A 补充；禁止仅前端全量过滤）

## 3. User Stories

### US-001: Core — Subnet handlers

**Acceptance Criteria:**

- [ ] 四 operation 与 YAML 一致
- [ ] create 时无效 `vpc_id` → 404
- [ ] gateway 校验（若提供）→ 400

### US-002: Console — 子网列表与详情

**Acceptance Criteria:**

- [ ] Table：name、vpc_id（可跳转）、cidr、gateway、state
- [ ] VPC 筛选 Select
- [ ] browser：loading / empty / error

### US-003: Console — 创建子网

**Acceptance Criteria:**

- [ ] 表单：vpc_id、name、cidr、可选 gateway
- [ ] idempotency_key 自动生成
- [ ] vpc 404 时表单级错误提示

### US-004: Console — 删除子网

**Acceptance Criteria:**

- [ ] Popconfirm；成功 200 刷新

## 4. Functional Requirements

- FR-1: 不得自造 IP 分配 API
- FR-2: 子网 CIDR 展示为文本，非数值输入混用

## 5. Non-Goals

- 子网 PATCH、IP 池 list

## 6. ANI Boundaries

| idempotency_key | POST create |

## References

- `vpc.md`、父 PRD
