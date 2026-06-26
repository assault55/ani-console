# SPRINT-SCB-01 · 壳层与共享组件（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

按冻结的 [产品设计规范 2.0](../../UI规范-2.0.md) 对齐 Console **App Shell** 与跨页共享组件，作为后续 SCB-02+ 页面改造基座。

**页面模板**：页面模板 2.0 §3（Console 应用壳层）+ §2.1 Page Header + 列表基座三态。

**Arco 组件**：`Layout`、`Menu`、`Table`、`Empty`、`Spin`、`Alert`、`Tag`、`Button`、`Modal`、`Typography`、`Space`。

**三态**：`CursorTable` 统一 error（`ApiErrorAlert`）/ loading（`Spin`）/ empty（`Empty`）。

---

## 2. 变更清单

### 2.1 修改文件

| 路径 | 变更摘要 |
|------|----------|
| `src/components/shell/AppShell.tsx` | 壳层尺寸常量（60px/232px）；Tailwind 布局 + Arco Token；PageHeader 20px 标题 |
| `src/components/shell/SideMenu.tsx` | 整理结构；`openKeys` 随路由展开；图标 `gap-2`；Link 样式 |
| `src/lib/side-menu-match.ts` | 新增 `openSubMenuKeysForPath` |
| `src/components/tables/CursorTable.tsx` | 三态 Tailwind 布局；移除无效 Pagination；支持 `emptyDescription` |
| `src/components/feedback/ApiErrorAlert.tsx` | `className` 替代 inline margin |
| `src/components/PlaceholderPage.tsx` | Tailwind `space-y-4` |
| `e2e/storage.spec.ts` | 修正已展开子菜单下重复点击折叠 |

### 2.2 新增文件

| 路径 | 说明 |
|------|------|
| `src/components/tables/CursorTable.test.tsx` | 三态单元测试 |

### 2.3 删除

| 路径 | 原因 |
|------|------|
| `CursorTable` 内 `useCursorList` | 无引用，移除死代码 |

---

## 3. 测试

### 3.1 单元测试

| 文件 | 新增 |
|------|------|
| `lib/side-menu-match.test.ts` | `openSubMenuKeysForPath` ×3 |
| `components/tables/CursorTable.test.tsx` | error / empty / rows ×3 |

### 3.2 验收结果

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 8 ✓ | build ✓
```

---

## 4. 评审清单自检（摘要）

- [x] Arco `Layout` / `Menu` / `Table`，无平行组件库
- [x] Token 用于壳层背景/边框；Tailwind 仅布局 class
- [x] 列表基座三态统一
- [x] 侧栏分组与页面模板 2.0 §3 一致

---

## 5. 下一批

**SCB-02** 认证与设置：`login`、`login.callback`、`settings/*`
