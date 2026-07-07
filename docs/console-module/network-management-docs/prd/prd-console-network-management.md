# PRD: Console 网络管理（总 PRD · Core + Console）

> Revised: 2026-07-05
> 状态：已确认（含 §9 产品决策）
> 详文：`repo/services/docs/console-modules/compute/network-management.md`
> UX：`repo/services/tasks/modules/ux/console/compute/ux-console-network-management.md`

## 1. Introduction / Overview

`Console / 算力与云资源 / 网络管理` 帮助租户管理 **VPC、子网、安全组、负载均衡、路由** 五类 Core 网络资源，并为 VM/容器等实例提供网络关联回指。

本 PRD 为 **Core + Console 联合交付**，用于研发任务分配：

| 决策 | 内容 |
|------|------|
| 1C | Core handler + Console UI 联合 |
| 2D | 五类子模块 **全量** CRUD（含路由 GET/DELETE、安全组 rules PATCH — 需 OpenAPI 扩展） |
| 3B | 总 PRD + 5 份子 PRD |
| 4C | **路由 Console 先做**；Core route handler **独立批次** CORE-NET-ROUTES |
| 5B | 安全组 **rules 内嵌编辑**：PATCH 整包 `rules[]`，不新增 rules 子路径 |

**权威契约：** `repo/api/openapi/v1.yaml` `Networks` 组；扩展路径见 §6。

## 2. Goals

- Core 落地 VPC/子网/安全组/负载均衡 handler（对齐现有 YAML）；补充 OpenAPI 扩展并实现对应 handler。
- Console 提供网络管理总览 + 五类资源 **列表 / 详情 / 创建 / 删除**；安全组 **rules 编辑**；路由 **list/create**（+ 扩展后 detail/delete）。
- 明确 **已冻结 / OpenAPI 扩展 / 待补** 三层边界，供研发并行不踩坑。
- 创建类 POST 一律 `idempotency_key`；租户边界来自认证上下文。

## 3. User Stories（总览）

| ID | 标题 | 负责层 | 子 PRD |
|----|------|--------|--------|
| US-001 | 网络管理总览与资源关系 | Console | 本文 |
| US-002 | VPC CRUD | Core + Console | vpc |
| US-003 | 子网 CRUD | Core + Console | subnet |
| US-004 | 安全组 CRUD + rules PATCH 编辑 | Core + Console | security-group |
| US-005 | 负载均衡 CRUD | Core + Console | load-balancer |
| US-006 | 路由 list/create + 扩展后 detail/delete | Console 优先；Core 批次 | route |
| US-007 | OpenAPI 扩展批次 CORE-NET-OPENAPI-A | Core | 本文 §6 |
| US-008 | Core 边界与 RBAC 一致 | Core | 本文 |

各 US 验收细节见子 PRD；下文仅列跨模块 US。

### US-001: 网络管理总览

**Description:** 作为租户用户，我希望在一个入口理解五类网络资源及创建顺序，以便正确建网。

**Acceptance Criteria:**

- [ ] 总览页展示 VPC → 子网 → 安全组 → 负载均衡 → 路由 的推荐创建顺序
- [ ] 五类资源区可独立 loading/error；一类失败不阻断其它类
- [ ] 空态引导「先创建 VPC」
- [ ] 待补能力（IP 分配、SG 绑定）仅文案说明，无假按钮
- [ ] browser 验证：空租户 / 部分失败 / 只读用户

### US-007: OpenAPI 扩展

**Description:** 作为 Core 研发，我需要先扩展 OpenAPI，再实现 PATCH SG 与 route GET/DELETE。

**Acceptance Criteria:**

- [ ] `v1.yaml` 新增 `PATCH .../security-groups/{id}`、`GET/DELETE .../routes/{route_id}`
- [ ] 新增 `UpdateNetworkSecurityGroupRequest`（至少 `idempotency_key` + `rules`）
- [ ] SDK/regenerate 与 architecture 校验通过
- [ ] 详文与 PRD 同步扩展路径

### US-008: Core 边界

**Acceptance Criteria:**

- [ ] 路径仅 `/api/v1/networks/*`；无 Services 路径
- [ ] RBAC：`scope:networks:read|create|update|delete`
- [ ] 错误体含 `code`、`message`、`request_id`

## 4. Functional Requirements

- **FR-1:** 系统必须提供 VPC/子网/安全组/负载均衡的 list、get、create、delete，与现有 YAML 一致。
- **FR-2:** 系统必须扩展并实现安全组 **PATCH 整包 rules**（5B）。
- **FR-3:** 系统必须扩展并实现路由 **GET by id、DELETE**（2D）。
- **FR-4:** 系统必须提供路由 **list、create**；Console 不得等待 Core route handler 才启动 UI（4C），但不得自造路径。
- **FR-5:** Console 安全组详情必须提供 rules 表格与整包编辑提交 PATCH。
- **FR-6:** 所有 POST create 必须 `idempotency_key`。
- **FR-7:** 删除前 UI 必须 Popconfirm + 依赖风险提示；**DELETE 冲突须返回 `409`**（Core 补充 YAML，见 §9 OQ-2）。
- **FR-8:** 子网创建必须校验 `vpc_id` 存在（404）。
- **FR-9:** 负载均衡创建必须 `vpc_id`；listeners 首版创建时可带数组，详情只读摘要。
- **FR-10:** 不得向 Console 暴露 Kube-OVN / provider 内部 ID（仅 ANI 资源 id）。

## 5. Non-Goals

- 子网 IP 分配 list API
- 安全组 **独立** rules 子资源 CRUD
- 安全组绑定/解绑实例或网卡
- listeners 独立 CRUD 子路径
- 路由 PATCH
- VPC/子网/LB PATCH（rename 等）
- BOSS 平台网络池运营页
- Kube-OVN real provider live gate（本 PRD 定义契约与 UI；provider 另批次）

## 6. Design Considerations — 研发批次

```text
CORE-NET-OPENAPI-A   OpenAPI 扩展（route GET/DELETE, SG PATCH）
        ↓
CORE-NET-HANDLERS    VPC/Subnet/SG/LB handlers + SG PATCH handler
        ↓
CORE-NET-ROUTES      Route list/create/(GET/DELETE) handlers  ← 可并行 Console，但晚验收
        ↓
CONSOLE-NET-UI       总览 + 5 子模块页面（TDesign；路由可先对接 list/create）
```

### OpenAPI 扩展清单（CORE-NET-OPENAPI-A）

| 方法 | 路径 | operationId | 说明 |
|------|------|-------------|------|
| PATCH | `/api/v1/networks/security-groups/{security_group_id}` | `updateNetworkSecurityGroup` | 整包 `rules[]` + 可选 `description` |
| GET | `/api/v1/networks/routes/{route_id}` | `getNetworkRoute` | 路由详情 |
| DELETE | `/api/v1/networks/routes/{route_id}` | `deleteNetworkRoute` | 删除路由 |

**同批次或紧随的补充（产品决策 §9）：**

| 变更 | 说明 |
|------|------|
| `GET /networks/subnets` 增加 query `vpc_id` | 服务端筛选，禁止仅前端全量过滤 |
| DELETE VPC/子网/SG/LB 补充响应 `409 CONFLICT` | 存在依赖时拒绝删除 |
| PATCH SG RBAC | `scope:networks:update`（Core 定义，产品不指定复用 create） |

### 研发分配建议

| 模块 | Core | Console | 依赖 |
|------|------|---------|------|
| VPC | CORE-NET-HANDLERS | CONSOLE-NET-VPC | — |
| 子网 | CORE-NET-HANDLERS | CONSOLE-NET-SUBNET | VPC |
| 安全组 | OPENAPI-A + HANDLERS | CONSOLE-NET-SG | OPENAPI-A for PATCH UI |
| 负载均衡 | CORE-NET-HANDLERS | CONSOLE-NET-LB | VPC, 子网 |
| 路由 | CORE-NET-ROUTES | CONSOLE-NET-ROUTE | list/create 无阻塞；DELETE UI 等 OPENAPI-A |
| 总览 | — | CONSOLE-NET-SHELL | 各子模块 |

## 7. Technical Considerations

- 部分 Gateway handler 已有 `network_resources.go` 边界；OpenAPI 已声明 ≠ 全部 production ready。
- **Console 信息架构（已确认）：** 总览页 + 每类资源独立列表/详情/创建路由（结构 C）；具体路径 UX/SPEC 冻结。
- list 默认 `limit=20`；cursor 分页。
- `NetworkResourceState`：pending / available / failed / deleting / deleted — Tag 映射见 UX。
- 路由 Console 在 Core handler 未就绪时 **允许 dev mock**；不得自造正式 API 路径。

## 8. Success Metrics

- 租户 30 秒内找到目标 VPC 并完成子网创建
- 五类资源 CRUD 主路径可通过 API + Console 验收
- 安全组 rules 可编辑并 PATCH 持久化
- 文档与 YAML 无「路由仍待补」类冲突

## 9. Product Decisions（已关闭）

| ID | 决策 | 影响 |
|----|------|------|
| — | Core + Console 联合（1C） | 总 PRD 范围 |
| — | 全量子模块含 OpenAPI 扩展（2D） | OPENAPI-A |
| — | 总 PRD + 5 子 PRD（3B） | 文档结构 |
| — | 路由 Console 先行 + mock；Core handler 批次 CORE-NET-ROUTES（4C） | route 子 PRD |
| — | SG rules PATCH 整包 + **含 description**（5B） | security-group |
| OQ-UI-1 | **页面结构 C**：网络总览 + 每类独立列表/详情/创建 | UX / Console 路由 |
| OQ-2 | **删除冲突返回 409**；Core 补充 DELETE 响应码 | VPC/子网/SG/LB 详文、Core |
| OQ-3 | **子网 list 增加 `vpc_id` query**（服务端筛选） | OpenAPI + subnet 子 PRD |
| OQ-4 | 路由 Console **允许 dev mock** 至 Core 就绪 | route 子 PRD |
| OQ-5 | PATCH SG 使用 **`scope:networks:update`** | Core RBAC（产品交 Core 定稿） |

## 10. ANI Boundaries

| Item | Value |
|------|-------|
| Product line | core + console |
| Code scope | Core：`repo/services/ani-gateway/`、`repo/pkg/adapters/` network；Console：`repo/frontends/console/` |
| OpenAPI authority | **Core 扩展批次** 改 `v1.yaml`；Console consume only |
| idempotency_key | required on: 全部 POST create + PATCH security-group |
| Module main doc | `network-management.md` + `network/*.md` |
| Frozen exclusions | Services、Boss 网络池、独立 rules 子 API |

## References

- `repo/api/openapi/v1.yaml`
- `repo/services/docs/console-modules/compute/network-management.md`
- `repo/pkg/adapters/runtime/` / `network_resources.go`
- 子 PRD 五份
