# PRD: Console 网络安全组

> Revised: 2026-07-05
> 父 PRD：`prd-console-network-management.md`
> 详文：`docs/console-modules/compute/network/security-group.md`

## 1. Introduction

安全组 CRUD + **rules 内嵌整包 PATCH 编辑**（产品决策 5B）。

## 2. Goals

- 创建时可带初始 `rules[]`
- 详情页 rules 表格 + 编辑 Dialog 提交 PATCH
- **不**做 `/rules` 子资源 API

## 3. User Stories

### US-001: Core — Security group CRUD handlers

**Acceptance Criteria:**

- [ ] list/get/create/delete 与现有 YAML 一致
- [ ] rules 结构符合 `NetworkSecurityGroupRule`

### US-002: Core — PATCH updateNetworkSecurityGroup（OPENAPI-A）

**Acceptance Criteria:**

- [ ] OpenAPI 新增 PATCH + `UpdateNetworkSecurityGroupRequest`
- [ ] `UpdateNetworkSecurityGroupRequest` 含 `idempotency_key`、`rules`、可选 **`description`**
- [ ] 200 返回完整 `NetworkSecurityGroup`
- [ ] RBAC：`scope:networks:update`

### US-003: Console — 列表与详情

**Acceptance Criteria:**

- [ ] 列表展示 rules 数量摘要
- [ ] 详情 rules Table：direction、protocol、port_range、cidr、action
- [ ] browser：loading / empty / error

### US-004: Console — 创建安全组

**Acceptance Criteria:**

- [ ] name、description、可选 rules 编辑器（可空数组）
- [ ] POST idempotency_key

### US-005: Console — 编辑 rules

**Acceptance Criteria:**

- [ ] 「编辑规则」打开 Dialog，可增删改 rules 行
- [ ] 提交 PATCH 整包 `rules[]` + 可选 `description` + 新 idempotency_key
- [ ] 成功关闭 Dialog 并刷新详情
- [ ] PATCH 未上线时按钮 disabled + tooltip「待 Core 接入」
- [ ] browser：编辑成功 / 400 校验失败

### US-006: Console — 删除安全组

**Acceptance Criteria:**

- [ ] Popconfirm 引用风险提示

## 4. Functional Requirements

- FR-1: rules 编辑必须整包提交，禁止单条 rules 子 API
- FR-2: direction 仅 ingress/egress；action 仅 allow/deny

## 5. Non-Goals

- rules 独立 CRUD 路径
- SG 绑定/解绑实例
- SG rename PATCH — **Non-Goal**（description 随 PATCH 更新）

## 6. ANI Boundaries

| OpenAPI | 扩展 PATCH（Core 批次 OPENAPI-A） |
| idempotency_key | POST create + PATCH update |

## References

- 详文、父 PRD
