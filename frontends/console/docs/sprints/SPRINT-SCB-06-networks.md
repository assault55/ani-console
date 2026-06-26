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
