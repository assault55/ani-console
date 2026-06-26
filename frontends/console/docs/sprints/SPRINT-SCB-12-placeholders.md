# SPRINT-SCB-12 · 占位页（阻塞态收尾）

> 状态：**⏸ 阻塞于 Core API 契约**（2026-06-25）  
> 验收：`npm run verify` 通过（占位页与 E2E smoke）

---

## 1. 目标

在 API 未就绪时，统一 `/bare-metal`、`/notifications`、`/audit` 的占位页模板与可访问性。

| 路由 | 现状 |
|------|------|
| `/bare-metal` | `PlaceholderPage` 占位 |
| `/notifications` | `PlaceholderPage` 占位 |
| `/audit` | `PlaceholderPage` 占位 |

---

## 2. 本批新增

| 路径 | 变更摘要 |
|------|----------|
| `e2e/placeholders.spec.ts` | 三个占位页 smoke：路由可达 + 占位文案可见 |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 20 ✓ | build ✓
```

---

## 4. 结论

- [x] 占位页模板统一
- [x] 路由可访问与文案可见
- [ ] 真实业务页面实现（等待 Core API 契约）
