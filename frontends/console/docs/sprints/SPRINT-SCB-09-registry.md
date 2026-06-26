# SPRINT-SCB-09 · Registry（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐 `/registry` 三级导航（项目 → 仓库 → 制品）至冻结规范。

| 层级 | 页面模板 |
|------|----------|
| 项目列表 | 模板 B + `CursorTable` 三态 |
| 仓库列表 | 选中项目后展示；扫描报告 `Descriptions` |
| 制品列表 | 选中仓库后展示；权限 / Pull Secret / 镜像扫描 |

**Arco**：`Card`、`Descriptions`、`Empty`、`Modal`、`Spin`、`StatusTag`。

---

## 2. 变更清单

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/registry/index.tsx` | `space-y-4`；三级 `CursorTable`；未选层级 `Empty` 引导；扫描报告/结果结构化展示 |
| `e2e/support/api-mock.ts` | Registry 项目/仓库/制品/扫描 fixture |
| `e2e/registry.spec.ts` | 三级导航 E2E |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 17 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 项目列表三态 + 空态文案
- [x] 多级导航：未选项目/仓库时有 `Empty` 引导
- [x] 各层表格 loading / error / empty
- [x] 扫描报告与镜像扫描结果用 `Descriptions`，非 JSON 堆砌
- [x] Arco + Token + Tailwind 布局 only

---

## 5. 下一批

**SCB-10** 安全与密钥：`/encryption`、`/secrets/*`
