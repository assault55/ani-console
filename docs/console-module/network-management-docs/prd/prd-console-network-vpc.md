# PRD: Console 网络 VPC

> Revised: 2026-07-05
> 父 PRD：`prd-console-network-management.md`
> 详文：`docs/console-modules/compute/network/vpc.md`

## 1. Introduction

租户 VPC 的 **list / get / create / delete**；Core `Networks` 组已冻结路径。

## 2. Goals

- Core + Console 完成 VPC 四接口闭环
- POST 带 `idempotency_key`
- 详情可跳转同 VPC 下子网/路由

## 3. User Stories

### US-001: Core — VPC handlers

**Acceptance Criteria:**

- [ ] `listNetworkVPCs`、`getNetworkVPC`、`createNetworkVPC`、`deleteNetworkVPC` 与 YAML 一致
- [ ] RBAC：`scope:networks:read|create|delete`
- [ ] create 201；get/delete 404 跨租户
- [ ] 单元/集成测试覆盖

### US-002: Console — VPC 列表与详情

**Acceptance Criteria:**

- [ ] Table：name、cidr、state、updated_at
- [ ] cursor 分页；Empty 空态
- [ ] 详情：复制 id、state Tag、关联资源入口
- [ ] browser：loading / empty / error

### US-003: Console — 创建 VPC

**Acceptance Criteria:**

- [ ] Dialog/Drawer：name（必填）、cidr（默认 10.0.0.0/16）、自动生成 idempotency_key
- [ ] 成功 Message + 刷新列表或跳详情
- [ ] 400/403 展示 API message + request_id

### US-004: Console — 删除 VPC

**Acceptance Criteria:**

- [ ] Popconfirm 风险提示（存在子网时）
- [ ] 成功刷新列表；404/409 错误态

## 4. Functional Requirements

- FR-1: 不得自造 VPC schema 字段
- FR-2: 删除成功 HTTP 200 + NetworkVPC body

## 5. Non-Goals

- VPC PATCH、对等连接（409 依赖删除见 OPENAPI-A）

## 6. ANI Boundaries

| Item | Value |
|------|-------|
| OpenAPI | consume（四路径已冻结） |
| idempotency_key | POST create |

## References

- 详文、父 PRD
