# UX: Console 网络管理

> Interaction specification derived from: `repo/services/tasks/modules/prd/console/compute/prd-console-network-management.md`
> Part of ani-workflow artifact triad — next: `/prd-to-spec`
> Generated: 2026-07-05 | Product: **Console** | UI stack: **TDesign React + TanStack Router + React Query**
> Module main doc: `repo/services/docs/console-modules/compute/network-management.md`

**范围：** Console 网络总览 + VPC / 子网 / 安全组 / 负载均衡 / 路由 五类资源 UI；不含 Core handler、OpenAPI 扩展实现、Kube-OVN provider（→ SPEC）。

**已确认 IA（结构 C）：** 网络 **总览页** + 每类资源 **独立列表 / 详情 / 创建** 子页。

---

## 1. Page Type

### 1.1 Classification

| Screen | Page type | In app shell? | Route |
|--------|-----------|---------------|-------|
| 网络管理总览 | dashboard / hub（模板 C 混合） | 是 | `/_authenticated/compute/network` |
| VPC 列表 | list（模板 B） | 是 | `/_authenticated/compute/network/vpcs` |
| VPC 详情 | detail | 是 | `/_authenticated/compute/network/vpcs/$vpcId` |
| 创建 VPC | form（Dialog 或子路由） | 是 | 列表页 Dialog **或** `.../vpcs/create` |
| 子网列表/详情/创建 | 同上 | 是 | `.../subnets`、`.../subnets/$subnetId` |
| 安全组列表/详情/创建 | 同上 + rules 编辑 Dialog | 是 | `.../security-groups`、`.../security-groups/$sgId` |
| 负载均衡列表/详情/创建 | 同上 | 是 | `.../load-balancers`、`.../load-balancers/$lbId` |
| 路由列表/详情/创建 | 同上 | 是 | `.../routes`、`.../routes/$routeId`（详情依赖 OPENAPI-A） |

> **推荐：** 创建类操作用 **Dialog**（减少路由数量）；详情用 **独立路由** 便于深链与面包屑。

### 1.2 Pattern Reference

| 参考 | 说明 |
|------|------|
| 页面模板 §2 通用骨架 | PageHeader + Content Body |
| 页面模板 §4 模板 B | 列表 + Table + 分页 |
| 页面模板 §6 模板 C | 总览摘要卡 + 跳转 |
| 页面模板 §8 模板 E | 创建表单、listeners/rules 动态行 |
| `_authenticated/index.tsx` | `ConsolePage`、Card、Empty、Alert |
| `models/index.tsx` 等现有列表 | Table + 主操作 + Popconfirm 删除 |

---

## 2. Information Architecture

### 2.1 Routes & Entry Points

| Route | Entry | Auth required |
|-------|-------|---------------|
| `/compute/network` | 侧栏「网络管理」；总览卡「查看详情」 | 是 |
| `/compute/network/vpcs` | 总览 VPC 卡；面包屑 | 是 |
| `/compute/network/subnets?vpc_id=` | 总览；VPC 详情「子网」链接 | 是 |
| `/compute/network/security-groups` | 总览 | 是 |
| `/compute/network/load-balancers` | 总览 | 是 |
| `/compute/network/routes?vpc_id=` | 总览；VPC 详情 | 是 |

**侧栏：** 新增一级菜单 **「网络管理」** → `/compute/network`（总览）；子资源 **不**占侧栏五项，由总览 Card 与面包屑进入。

### 2.2 Navigation Relationship

```text
Console 壳
  └── 算力与云资源
        └── 网络管理（总览 /compute/network）
              ├── VPC        → /vpcs → /vpcs/$id
              ├── 子网       → /subnets → /subnets/$id
              ├── 安全组     → /security-groups → /security-groups/$id
              ├── 负载均衡   → /load-balancers → /load-balancers/$id
              └── 路由       → /routes → /routes/$id（扩展后）
```

**面包屑示例：**

- `算力与云资源 / 网络管理 / VPC / prod-vpc`
- `算力与云资源 / 网络管理 / 子网 / subnet-a`

**推荐创建顺序（总览 Steps）：**

`VPC → 子网 → 安全组 → 负载均衡 → 路由`

### 2.3 PRD Coverage Map

| PRD 项 | UX 区域 |
|--------|---------|
| US-001 总览 | §4.1 |
| US-002 VPC | §4.2 |
| US-003 子网 | §4.3 |
| US-004 安全组 + PATCH | §4.4 |
| US-005 负载均衡 | §4.5 |
| US-006 路由 | §4.6 |
| FR-7 删除 409 | §6 删除态、§7.2 |
| OQ-UI-1 结构 C | §2 全文 |
| OQ-3 子网 vpc_id query | §4.3 筛选 |
| OQ-4 路由 mock | §4.6 mock 横幅 |

---

## 3. User Flow

### 3.1 Primary Flow（建网）

```text
1. 用户进入 /compute/network 总览
2. 阅读 Steps：先 VPC → 子网 → …
3. 点击「创建 VPC」→ Dialog → POST → Message.success → VPC 列表刷新
4. 从 VPC 详情点击「创建子网」或进入子网列表，Select 筛选 vpc_id
5. 创建安全组（可选初始 rules）→ 详情页「编辑规则」→ PATCH
6. 创建负载均衡（选 vpc、subnet、listeners）
7. 路由 list 按 VPC 筛选 → 创建路由
8. 自实例详情回跳时：深链到对应资源详情（只读）
```

### 3.2 Secondary Flows

| 流程 | 行为 |
|------|------|
| 删除 VPC 有子网 | Popconfirm → DELETE → **409** → Alert 展示 message + 引导查看子网 |
| 只读用户 | 隐藏「创建」「删除」「编辑规则」；列表/详情可读 |
| 子网 list | **必须**带 `vpc_id` query 请求（OPENAPI-A 前可 client 过滤 + 标注「待 API」） |
| SG PATCH 未上线 | 「编辑规则」disabled + Tooltip |
| 路由 Core 未就绪 | 列表顶 `Alert theme="info"`「当前为开发/mock 数据」；仍走正式路径契约 |
| 路由 DELETE 未上线 | 行内删除 hidden 或 disabled |
| 分页 | cursor：Table 底部「加载更多」 |

### 3.3 Flow Diagram

```mermaid
flowchart TD
  A[/compute/network 总览] --> B{选择资源}
  B --> C[VPC 列表]
  C --> D[创建 VPC Dialog]
  D --> E[VPC 详情]
  E --> F[子网列表 vpc_id 筛选]
  F --> G[安全组 / LB / 路由...]
  G --> H{删除?}
  H -->|409| I[Alert 依赖冲突]
  H -->|200| J[刷新列表]
```

---

## 4. Layout Regions

### 4.1 网络管理总览

```text
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: 网络管理 + 副标题「租户网络资源与创建引导」          │
├─────────────────────────────────────────────────────────────┤
│ Steps（横向）: VPC → 子网 → 安全组 → 负载均衡 → 路由          │
├─────────────────────────────────────────────────────────────┤
│ Row gutter=16: 5 × Card（每类资源摘要）                       │
│   标题 | 数量 Statistic | 状态摘要 | Link「管理」| Btn「创建」│
├─────────────────────────────────────────────────────────────┤
│ Alert info: 待补能力（IP 分配、SG 绑定）— 纯文案，无按钮       │
└─────────────────────────────────────────────────────────────┘
```

| Card | 数据 | 跳转 |
|------|------|------|
| VPC | `listNetworkVPCs` total 或 items.length | `/vpcs` |
| 子网 | `listNetworkSubnets` | `/subnets` |
| 安全组 | `listNetworkSecurityGroups` | `/security-groups` |
| 负载均衡 | `listNetworkLoadBalancers` | `/load-balancers` |
| 路由 | `listNetworkRoutes` | `/routes` |

每 Card **独立** loading / error（`Alert` + 重试），不阻断其它 Card。

### 4.2 VPC 列表 / 详情

**列表 Toolbar：** `Button primary` 创建 VPC | `Input` 名称搜索（客户端）

**Table columns：** name（Link）、cidr、state Tag、updated_at、操作（详情 | 删除）

**详情 PageHeader：** name + state Tag + 复制 id

**详情 Body：**

- Descriptions：cidr、reason、created_at、updated_at
- 关联入口 Link：「该 VPC 下的子网」「路由」
- 危险区：`Button theme="danger" variant="outline"` 删除

**创建 Dialog：** name*、cidr（默认 10.0.0.0/16）；提交 POST + idempotency_key

### 4.3 子网列表 / 详情

**列表 Toolbar：** VPC `Select`（必选筛选，触发 `GET .../subnets?vpc_id=`）| 创建子网

**Table columns：** name、cidr、gateway、vpc_id（Link）、state、操作

**创建 Dialog：** vpc_id*（Select 来自 VPC list）、name*、cidr、gateway（可选）

**空态：** 未选 VPC 时 Empty「请先选择 VPC」

### 4.4 安全组列表 / 详情

**列表 columns：** name、description 摘要、rules 数量、state、操作

**详情：**

- Descriptions：description、state、时间
- **rules Table**（只读）：direction、protocol、port_range、cidr、action（Tag allow=success deny=danger）
- `Button`「编辑规则与描述」→ 打开 **编辑 Dialog**

**编辑 Dialog（PATCH 整包）：**

```text
┌─ 编辑安全组 ─────────────────────────┐
│ Textarea: description                 │
│ Divider: 规则列表                      │
│ Editable Table / 动态 FormList 行：     │
│   direction Select | protocol | port   │
│   cidr | action                        │
│ [+ 添加规则]                           │
│ Footer: 取消 | 保存（PATCH）           │
└────────────────────────────────────────┘
```

PATCH 未上线：保存 disabled + Tooltip「待 Core 接入」。

**创建 Dialog：** name*、description、可选 rules 编辑器（同结构）

### 4.5 负载均衡列表 / 详情

**列表 columns：** name、scheme Tag、vip、listeners 数量、vpc_id、state、操作

**创建 Dialog：**

- name*、vpc_id* Select、subnet_id Select（联动 VPC）、scheme Radio internal/public
- listeners **动态行**：protocol Select、port InputNumber、target_port InputNumber；[+ 添加监听器]

**详情：** listeners 子 Table 只读；vip/scheme/vpc/subnet Descriptions

### 4.6 路由列表 / 详情

**列表 Toolbar：** VPC Select | 创建路由

**mock 横幅（Core 未就绪）：** `Alert theme="info"`「路由数据来自开发环境/mock，正式 API 就绪后自动切换」

**Table columns：** destination_cidr、next_hop_type、next_hop_id、description、created_at、操作（详情 | 删除*）

*删除：OPENAPI-A + Core DELETE 可用后显示

**创建 Dialog：** vpc_id*、destination_cidr*、next_hop_type Select、next_hop_id*、description

**详情（扩展后）：** 同字段 Descriptions + 删除

---

## 5. Component Mapping

### 5.1 公共

| UI 元素 | TDesign | 说明 |
|---------|---------|------|
| 页面容器 | `ConsolePage` 或 `.cp-page` | gap 16px |
| 页头 | `Typography.Title` + `Space` | 主操作右对齐 |
| 面包屑 | `Breadcrumb` | 含「网络管理」 |
| 资源 state | `Tag` | 见 §5.2 |
| 列表 | `Table` | `pagination={false}` + 底部加载更多 |
| 创建 | `Dialog` + `Form` | `destroyOnClose` |
| 删除 | `Popconfirm` + `Button danger` | 409 用 Message/Alert |
| 空态 | `Empty` | 带 CTA「创建 xxx」 |
| 错误 | `Alert theme="error"` | 含 request_id |
| idempotency | 前端 `crypto.randomUUID()` | 每次 create/patch 新生成 |

### 5.2 NetworkResourceState → Tag

| state | Tag theme |
|-------|-----------|
| pending | warning |
| available | success |
| failed | danger |
| deleting | warning |
| deleted | default |

### 5.3 字段 → API（禁止自造字段）

| 资源 | Table/Form 字段来源 |
|------|---------------------|
| VPC | `NetworkVPC` |
| 子网 | `NetworkSubnet`；list query `vpc_id` |
| 安全组 | `NetworkSecurityGroup`、`NetworkSecurityGroupRule` |
| 负载均衡 | `NetworkLoadBalancer`、`NetworkLoadBalancerListener` |
| 路由 | `NetworkRoute` |

---

## 6. State Design

### 6.1 总览页

| State | Trigger | UI |
|-------|---------|-----|
| loading | 各 Card fetch | Card 内 `Skeleton` |
| idle | 200 | Statistic + Link |
| empty | count=0 | Statistic 0 + Empty 小字 +「创建」 |
| error | 4xx/5xx | Card 内 Alert + 重试 |
| partial | 部分 Card 失败 | 其它 Card 正常 |

### 6.2 列表页（通用）

| State | UI |
|-------|-----|
| loading | Table loading |
| idle | 展示 rows |
| empty | Empty + 创建 CTA |
| error | Alert + 重试 |
| loading-more | 底部 Button loading |

### 6.3 创建 Dialog

| State | UI |
|-------|-----|
| idle | 表单可编辑 |
| submitting | 确定 Button loading；表单 disabled |
| success | Message.success；关闭 Dialog；invalidate query |
| error 400 | 字段下 inline + Message |
| error 404 | Message（如 vpc_id 无效） |
| error 409 | Message（路由冲突） |

### 6.4 删除

| State | UI |
|-------|-----|
| confirm | Popconfirm 文案含依赖风险 |
| submitting | Popconfirm loading |
| success 200 | Message.success；navigate 列表 |
| error 409 | **Alert/Message**：`{message}` +「请先删除关联的子网/资源」 |
| error 404 | Message |

### 6.5 安全组编辑 rules

| State | UI |
|-------|-----|
| disabled | PATCH 不可用：Button disabled |
| editing | Dialog 打开 |
| submitting | 保存 loading |
| validation | port_range/cidr 格式错误 inline |
| success | 关闭 Dialog；刷新详情 |

### 6.6 权限

| 无 create | 隐藏创建 Button |
| 无 delete | 隐藏删除 |
| 无 update | 隐藏「编辑规则」 |
| 只读 | 列表/详情可访问 |

---

## 7. Copy & Feedback

### 7.1 Labels

| 元素 | Copy (zh-CN) |
|------|----------------|
| 侧栏 | 网络管理 |
| 总览标题 | 网络管理 |
| 创建 VPC | 创建 VPC |
| 创建子网 | 创建子网 |
| 编辑规则 | 编辑规则与描述 |
| 加载更多 | 加载更多 |

### 7.2 Messages

| 场景 | 类型 | Copy |
|------|------|------|
| 创建成功 | Message.success | {资源类型}已创建 |
| 删除成功 | Message.success | 已删除 |
| 409 冲突 | Message.error | 无法删除：{message} |
| 409 路由 | Message.error | 路由 destination 已存在 |
| PATCH 成功 | Message.success | 安全组已更新 |
| 未选 VPC 筛子网 | Empty | 请先选择 VPC |
| mock 路由 | Alert info | 当前为开发/mock 数据，正式环境以 API 为准 |
| API 失败 | Alert error | {message}（请求 ID：{request_id}） |
| Popconfirm 删 VPC | Popconfirm | 删除后不可恢复。若仍有子网或关联资源，操作将失败。 |

---

## 8. Boundaries & Non-Goals

### 8.1 In Scope (UX)

- 结构 C：总览 + 五类独立列表/详情/创建
- cursor 分页、409 删除反馈、子网 vpc_id 服务端筛选
- SG rules + description PATCH Dialog
- 路由 mock 横幅、扩展前隐藏删除

### 8.2 Out of Scope (UI)

- 子网 IP 分配页
- SG 绑定实例 UI
- listeners 独立 CRUD 页
- 路由 PATCH
- VPC/LB rename
- Prometheus / Boss 网络池

### 8.3 Open UX Questions

- 无（PRD §9 已关闭）

### 8.4 Assumptions

- 创建用 Dialog 而非独立 `/create` 路由（SPEC 可二选一，UX 推荐 Dialog）
- 侧栏仅「网络管理」一项；子资源不进 Menu
- 名称搜索为客户端过滤（YAML 无 search query）
- `next_hop_id` 首期文本 Input；实例 picker 待 SPEC

---

## 9. Browser Verification Checklist

| 场景 | 验证点 |
|------|--------|
| 总览空租户 | 五 Card 空态 + Steps 可见 |
| 总览 partial error | 单 Card Alert，其它正常 |
| 创建 VPC | Dialog → 列表出现新行 |
| 删 VPC 409 | Popconfirm → 错误 message |
| 子网未选 VPC | Empty 提示 |
| 子网 vpc_id 筛选 | Select 变更 → 请求带 query |
| SG 编辑 rules | Dialog 增删行 → PATCH（或 disabled） |
| 路由 mock | info Alert 展示 |
| 只读用户 | 无创建/删除按钮 |
