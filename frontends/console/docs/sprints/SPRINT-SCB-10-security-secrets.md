# SPRINT-SCB-10 · 安全与密钥（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐 `/encryption`、`/secrets/*` 至冻结规范（列表+详情+表单）。

| 路由 | 页面模板 |
|------|----------|
| `/encryption` | 模板 B 列表 + 安全操作区 |
| `/secrets` | 模板 B 列表 |
| `/secrets/$id` | 模板 C 详情 + 绑定表单 |

**Arco**：`Card`、`Descriptions`、`Empty`、`Modal`、`CursorTable`、`StatusTag`。

---

## 2. 变更清单

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/encryption/index.tsx` | `CursorTable` 三态；状态列；Seal/Unseal 区结构化展示，移除 `alert` |
| `src/routes/_authenticated/secrets/index.tsx` | 增加类型/状态/时间列与空态文案 |
| `src/routes/_authenticated/secrets/$secretId.tsx` | 详情 loading 三态；绑定结果 `Descriptions` |
| `e2e/support/api-mock.ts` | 新增 encryption fixture |
| `e2e/security-secrets.spec.ts` | 新增安全与密钥 E2E |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 19 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 列表与详情统一三态
- [x] 危险操作 `Modal.confirm` 含资源名
- [x] 表单区无 inline 样式堆叠
- [x] Arco + Token + Tailwind 布局 only

---

## 5. 下一批

**SCB-11** 监控与用量：`/observability`、`/usage`、`/instance-operations/*`
