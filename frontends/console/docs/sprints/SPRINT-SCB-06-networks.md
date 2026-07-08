# SPRINT-SCB-06 · 网络（规范合规 + P18 详情 Drawer）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐网络五类列表页至冻结规范，并落地 **P18 网络 GET 详情 Drawer**（路由无单条 GET API，仅列表合规）。

| 路由 | 页面模板 | 详情 |
|------|----------|------|
| `/networks/vpcs` | 模板 B 列表 + Drawer | `getNetworkVPC` |
| `/networks/subnets` | 同上 | `getNetworkSubnet` |
| `/networks/security-groups` | 同上 + 规则表 | `getNetworkSecurityGroup` |
| `/networks/load-balancers` | 同上 + 监听器表 | `getNetworkLoadBalancer` |
| `/networks/routes` | 模板 B 列表（自定义列） | 无 GET 详情 API |

**Arco**：`Drawer`、`Descriptions`、`Table`、`Modal`、`Button`、`Spin`。

---

## 2. 变更清单

### 2.1 修改

| 路径 | 变更摘要 |
|------|----------|
| `src/components/crud/SimpleResourceCrud.tsx` | `space-y-4`；`emptyDescription`；详情 Drawer 三态；`showState`；自定义列；规则/监听器表辅助 |
| `src/routes/_authenticated/networks/vpcs/index.tsx` | 详情 Drawer + 状态列 |
| `src/routes/_authenticated/networks/subnets/index.tsx` | 同上 |
| `src/routes/_authenticated/networks/security-groups/index.tsx` | 同上 + 规则表 |
| `src/routes/_authenticated/networks/load-balancers/index.tsx` | 同上 + 监听器表 |
| `src/routes/_authenticated/networks/routes/index.tsx` | 自定义列；说明无 GET 详情 |
| `src/components/shell/StatusTag.tsx` | 新增 `available` 状态色 |
| `e2e/support/api-mock.ts` | 网络五类 list + VPC GET fixture |
| `e2e/networks.spec.ts` | 新增 VPC Drawer、路由列表 E2E |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 14 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 五类列表符合列表模板 + 三态
- [x] VPC/子网/安全组/LB 点击名称打开 Drawer（loading / error / 内容）
- [x] 删除操作 `Modal.confirm` 含资源名
- [x] Arco + Token + Tailwind 布局 only

---

## 5. P18 备注

网络 GET 详情 Drawer 已覆盖 4 类；**路由**契约无 `GET /networks/routes/{id}`，P18 向量库详情留待 **SCB-07**。

---

## 6. 下一批

**SCB-07** 向量库：`/vector-stores`

---

## 7. 真实联调补丁（2026-07-03）

| 路径 | 变更摘要 |
|------|----------|
| `src/components/shell/SideMenu.tsx` | 将“存储与网络”拆为“存储”和“网络”两个侧栏分组 |
| `src/lib/side-menu-match.ts` | 同步侧栏展开 key：存储 `storage`，网络 `network` |
| `src/routes/_authenticated/networks/subnets/index.tsx` | 子网创建表单的 VPC 改为下拉选择 |
| `src/routes/_authenticated/networks/load-balancers/index.tsx` | 负载均衡创建表单的 VPC/子网改为下拉选择 |
| `src/routes/_authenticated/networks/routes/index.tsx` | 路由创建表单的 VPC 改为下拉选择 |
| `src/lib/side-menu-match.test.ts`、`e2e/networks.spec.ts` | 补充分组拆分验证 |
| `src/lib/validators.ts`、`src/routes/_authenticated/networks/{vpcs,subnets,routes}/index.tsx` | VPC/子网/路由创建前校验 IPv4 CIDR，并在表单内展示 CIDR 错误态；子网网关校验 IPv4 |
| `src/components/forms/Ipv4CidrInput.tsx` | IPv4 输入固定单行显示；默认输出纯 IP，传 `withPrefix` 时显示/输出 CIDR 掩码 |
| `src/routes/_authenticated/networks/subnets/index.tsx` | 子网选择 VPC 后自动建议 VPC 范围内 CIDR；VPC 固定 octet 置灰禁改；CIDR 变化时联动网关；提交前校验子网 CIDR 与网关范围 |
| `AGENTS.md`、`frontends/console/CLAUDE.md`、`frontends/console/CONVENTIONS.md` | 将 `docs/console-module/**` PRD / UX / 详文加入 Console 开发必读入口 |

验收：

```bash
npm run test -- src/lib/side-menu-match.test.ts
npm run test -- src/lib/validators.test.ts
npm run test -- src/components/forms/Ipv4CidrInput.test.tsx src/lib/validators.test.ts
npm run typecheck
npx playwright test e2e/networks.spec.ts
npx playwright test e2e/instances.spec.ts
npm run build
```

---

## 8. 网络管理 IA 对齐（2026-07-06）

依据 `docs/console-module/network-management-docs/prd/prd-console-network-management.md` 与 `ux/ux-console-network-management.md`，网络模块从侧栏五资源入口调整为“网络管理总览 + 五类资源页”。

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/networks/index.tsx` | 新增 `/networks` 总览页，展示 VPC → 子网 → 安全组 → 负载均衡 → 路由的推荐创建顺序、五类资源计数、管理/创建入口和当前能力边界说明 |
| `src/components/shell/SideMenu.tsx` | 侧栏只保留独立“网络管理”入口，存储分组不再承载网络资源 |
| `src/lib/side-menu-match.ts` | `/networks/*` 高亮 `/networks`，不再展开网络子菜单 |
| `src/routeTree.gen.ts` | 同步 TanStack Router 新增 `/networks` 路由 |
| `e2e/networks.spec.ts`、`e2e/navigation.spec.ts`、`src/lib/side-menu-match.test.ts` | 覆盖网络总览、侧栏入口、子路径选中和导航定位 |

验收：

```bash
npm run test -- src/lib/side-menu-match.test.ts
npm run typecheck
npx playwright test e2e/networks.spec.ts e2e/navigation.spec.ts
```

---

## 9. 后端新契约接入（2026-07-06）

根目录最新 `v1.yaml` 已同步到 `openapi/v1.yaml` 并重新生成 Console Core schema。本轮只接已进入契约的能力，不自造未声明路径。

| 路径 | 变更摘要 |
|------|----------|
| `openapi/v1.yaml`、`src/api/core-schema.d.ts` | 接入 `PATCH /networks/security-groups/{security_group_id}`、`GET/DELETE /networks/routes/{route_id}`、`GET /networks/subnets?vpc_id=` |
| `src/components/crud/SimpleResourceCrud.tsx` | 支持数组 query key、列表筛选区、详情 Drawer 内删除当前资源 |
| `src/routes/_authenticated/networks/subnets/index.tsx` | 子网列表增加 VPC Select，按 `vpc_id` 服务端筛选；未选 VPC 时显示空态 |
| `src/routes/_authenticated/networks/routes/index.tsx` | 路由列表增加 VPC Select，接入路由详情 GET 与删除 DELETE |
| `src/routes/_authenticated/networks/security-groups/index.tsx` | 安全组详情增加 rules 编辑 Dialog，PATCH 整包提交 `rules[]`、`description`、`idempotency_key` |
| `src/routes/_authenticated/networks/vpcs/index.tsx` | VPC 列表补 CIDR 列，详情补子网/路由关联入口 |
| `e2e/networks.spec.ts`、`e2e/support/api-mock.ts` | 覆盖 subnet vpc_id 请求、route detail/delete、SG PATCH body |

验收：

```bash
npm run codegen
npm run typecheck
npx playwright test e2e/networks.spec.ts
```

---

## 10. 网络创建表单动态行（2026-07-06）

继续对齐 network-management PRD/UX，把面向用户的 JSON 输入改为结构化表单。

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/networks/security-groups/index.tsx` | 安全组创建 rules 改为动态规则行，复用详情 rules PATCH 编辑行 |
| `src/routes/_authenticated/networks/load-balancers/index.tsx` | 负载均衡创建 listeners 改为动态监听器行 |
| `e2e/networks.spec.ts` | 覆盖安全组创建 rules POST body、负载均衡创建 listeners POST body |

验收：

```bash
npm run typecheck
npx playwright test e2e/networks.spec.ts --grep "动态"
```

---

## 11. 网络管理侧栏子菜单（2026-07-06）

根据实际使用反馈，网络资源不再只通过总览卡进入；侧栏恢复为“网络管理”分组，下挂五个资源子菜单。

| 路径 | 变更摘要 |
|------|----------|
| `src/components/shell/SideMenu.tsx` | “网络管理”改为 SubMenu，包含 VPC、子网、安全组、负载均衡、路由五项 |
| `src/lib/side-menu-match.ts` | `/networks/*` 自动展开 `network-management` 分组 |
| `src/lib/side-menu-match.test.ts` | 覆盖网络子路由选中与展开行为 |
| `e2e/navigation.spec.ts`、`e2e/networks.spec.ts` | 更新侧栏导航与网络页面断言 |

验收：

```bash
npm run test -- src/lib/side-menu-match.test.ts
npx playwright test e2e/navigation.spec.ts e2e/networks.spec.ts
```

## 12. 移除网络总览页（2026-07-06）

网络管理改为侧栏五个资源子菜单后，独立总览页不再保留，减少一次跳转。

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/networks/index.tsx` | 删除 `/networks` 总览路由 |
| `e2e/networks.spec.ts` | 移除网络总览页 E2E 断言 |

验收：

```bash
npm run typecheck
npx playwright test e2e/navigation.spec.ts e2e/networks.spec.ts
```

---

## 13. 子网默认加载与 VPC 筛选（2026-07-07）

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/networks/subnets/index.tsx` | 子网页进入后默认请求 `/networks/subnets?limit=50` 展示全部子网；左上角 VPC Select 仅作为筛选条件，选中后请求带 `vpc_id`，清空后回到全部 |
| `e2e/networks.spec.ts` | 子网用例改为验证默认展示 `app-subnet`，并保留选择 VPC 后发起 `vpc_id` 服务端筛选请求 |

验收：

```bash
npm run typecheck
npx playwright test e2e/networks.spec.ts -g "子网列表默认展示全部并支持按 VPC 筛选"
npx playwright test e2e/networks.spec.ts
```
