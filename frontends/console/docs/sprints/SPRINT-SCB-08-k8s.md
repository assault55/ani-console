# SPRINT-SCB-08 · K8s 集群（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐 `/k8s-clusters` 列表与详情至冻结规范（模板 B 列表 + 模板 C 详情 + Tab 检查器）。

| 视图 | 页面模板 |
|------|----------|
| 列表 | 模板 B + `CursorTable` 三态 |
| 详情 | 模板 C：单一 primary（Kubeconfig）+ Tab（节点池 / Workloads / API Proxy） |

**Arco**：`Card`、`Descriptions`、`Tabs`、`Modal`、`Empty`、`Spin`、`Space`。

---

## 2. 变更清单

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/k8s-clusters/index.tsx` | 拆分 `ClusterList` / `ClusterDetail`；列表 `CursorTable`；详情 loading 分区；子表三态；去掉 inline style |
| `e2e/support/api-mock.ts` | K8s GET 详情 / 节点池 / workloads / kubeconfig fixture |
| `e2e/k8s-clusters.spec.ts` | 列表进详情 + 节点池 E2E |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 16 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 列表三态 + 空态文案
- [x] 详情分区 loading；单一 primary + outline 次要操作
- [x] 节点池 / Workloads `CursorTable` 三态
- [x] API Proxy 未请求时 `Empty` 引导
- [x] 删除集群/节点池 `Modal.confirm` 含资源名
- [x] Arco + Token + Tailwind 布局 only

---

## 5. 下一批

**SCB-09** Registry：`/registry`
