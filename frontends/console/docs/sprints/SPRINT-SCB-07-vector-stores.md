# SPRINT-SCB-07 · 向量库（规范合规 + P18 详情）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐 `/vector-stores` 至冻结规范，并完成 **P18 向量库 GET 详情 Drawer**。

| 能力 | 页面模板 |
|------|----------|
| 列表 | 模板 B + 三态 |
| 详情 Drawer | `getVectorStore` + 检索/插入 Tab（检查器） |

**Arco**：`Drawer`、`Descriptions`、`Tabs`、`Modal`、`Empty`、`Spin`、`CursorTable`。

---

## 2. 变更清单

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/vector-stores/index.tsx` | `space-y-4`；状态列；删除 `Modal.confirm`；详情 Drawer 三态；检索结果 `CursorTable` 替代 JSON |
| `e2e/support/api-mock.ts` | vector-stores list/GET + search POST fixture |
| `e2e/vector-stores.spec.ts` | 新增 Drawer + 检索 E2E |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 15 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 列表三态 + 空态文案
- [x] 点击名称打开 GET 详情 Drawer（loading / error / 内容）
- [x] Drawer 内检索/插入分区；检索结果表格化
- [x] 删除 `Modal.confirm`
- [x] Arco + Token + Tailwind 布局 only

---

## 5. P18 完成

网络（4 类 Drawer）+ 向量库详情均在 SCB-06/07 交付，**P18 可标记完成**。

---

## 6. 下一批

**SCB-08** K8s：`/k8s-clusters`
