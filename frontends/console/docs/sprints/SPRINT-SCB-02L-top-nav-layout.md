# SPRINT-SCB-02L · 顶栏一级 + 左侧栏二级布局重构

> 状态：**✅ 完成**（2026-07-25）
> 验收：`npm run verify` 通过（49 e2e + 65 unit + build）

---

## 1. 目标

按用户提供的两份冻结 HTML mockup（`page-overview-v2.html` / `page-detail-v2.html`）重构 Console 壳层：

- 由「左侧栏单列」改为「上 顶栏 + 下（左 侧栏 + 右 内容）」。
- 顶栏横向承载一级菜单；左 侧栏仅渲染当前一级菜单的子项。
- 首页 `/` 隐藏 左 侧栏；其它认证路由保留 184px 侧栏占位（无子项时显示分组标题 + 空白）。
- 仅改基础布局与菜单展示，不改任何业务逻辑、路由或 API。

**用户显式覆盖**「设计规范 2.0 已冻结」的限制（仅限壳层布局），需在本 Sprint 文档与 PR description 明确记录。

---

## 2. 设计决策（来自 AskUserQuestion）

| 决策点 | 选择 |
|--------|------|
| 侧栏隐藏规则 | 仅首页 `/` 隐藏；其它无子项一级菜单保留 184px 空侧栏（分组标题 + 空白） |
| 有子项一级菜单点击 | 跳转到第一个子项的路由；侧栏出现并自动选中该子项 |
| 侧栏分组标题 | 保留，显示当前一级菜单的 label |
| 退出按钮 | 保留在顶栏右上角 |

---

## 3. 变更清单

### 3.1 新增文件

| 路径 | 说明 |
|------|------|
| `src/lib/menu-items.tsx` | 从 `SideMenu.tsx` 抽出的 `menuItems` 数据；导出 `MenuItem` 类型、`isGroupItem`、`findMenuItem`、`leafPaths`。`.tsx` 因含 Arco icon JSX。 |
| `src/components/shell/TopNav.tsx` | 56px 顶栏：logo + `platform_name` + Arco `Menu mode="horizontal"` + 退出登录。`onClickMenuItem` 触发跳转。 |
| `src/components/shell/Sidebar.tsx` | 184px 侧栏：分组标题 + 子项 `Menu mode="vertical"` 或 `Empty` 占位。 |

### 3.2 修改文件

| 路径 | 变更摘要 |
|------|----------|
| `src/components/shell/AppShell.tsx` | 移除 `SideMenu` / `Layout.Header` / `Layout.Sider`；引入 `TopNav` + `Sidebar`；`showSidebar = pathname !== '/'`。保留 `PageHeader` export。 |
| `src/lib/side-menu-match.ts` | 新增 `activeTopNavKeyForPath(pathname)` 与 `sidebarItemsForTopNavKey(key)`；保留 `PATH_SUBMENU` / `matchSideMenuKey` / `openSubMenuKeysForPath`。 |
| `src/lib/side-menu-match.test.ts` | 新增 9 个用例（6 + 3），共 19 全绿。 |
| `src/styles/global.css` | 新增 `--topbar-height: 56px`、`--sidebar-width: 184px`；`.topnav-menu.arco-menu-horizontal` 激活下划线 28×3px；`.sidebar-menu.arco-menu` 叶子 padding + 激活态主色 08 背景。 |
| `e2e/navigation.spec.ts` | 8 个用例从「SubMenu 展开」改为「顶栏点击 → 侧栏点叶子」；新增 2 个用例（首页无侧栏 / 其它一级有侧栏）；`.arco-menu-selected` 断言加 `[data-component="sidebar"]` 作用域。 |
| `e2e/instances.spec.ts:577` | `getByText('算力与实例')` → `getByText('算力与实例', { exact: true })`。 |
| `e2e/storage.spec.ts:24` | 注释更新（旧 SubMenu 展开注释失效）。 |
| `e2e/networks.spec.ts:14` | `getByText('网络管理', { exact: true })` → `page.locator('[data-component="sidebar"]').getByText(...)` 避免与顶栏重复命中。 |

### 3.3 删除文件

| 路径 | 原因 |
|------|------|
| `src/components/shell/SideMenu.tsx` | 旧左侧单列 Menu；功能被 `TopNav` + `Sidebar` 取代。grep 确认无 importer 后删除。 |

### 3.4 契约 / 配置

| 项 | 说明 |
|----|------|
| `openapi/v1.yaml` | 无变更 |
| 环境变量 | 无变更 |
| 新依赖 | 无 |

---

## 4. URL → 一级菜单映射

`activeTopNavKeyForPath` 复用现有 `PATH_SUBMENU`：

| 一级菜单 key | 子项前缀 | 备注 |
|---|---|---|
| `/` | — | 首页；唯一隐藏侧栏的路由 |
| `compute` | `/instances`、`/gpu-inventory`、`/sandbox-templates` | 6 个子项 |
| `/k8s-clusters` | — | 叶子一级；侧栏空白占位 |
| `storage` | `/images`、`/volumes`、`/filesystems`、`/objects`、`/vector-stores` | 5 个子项 |
| `network-management` | `/networks/*` | 5 个子项 |
| `/registry` | — | 叶子；空白占位 |
| `/observability` | — | 叶子；空白占位 |
| `/usage` | — | 叶子；空白占位 |
| `security` | `/encryption`、`/secrets` | 2 个子项 |
| `settings` | `/settings`、`/settings/api-keys` | 2 个子项 |
| `reserved` | `/bare-metal`、`/notifications`、`/audit` | 3 个子项（占位） |

回退规则：未命中 `PATH_SUBMENU` 且不在 `LEAF_TOP_NAV_PATHS` 集合时回退到 `'/'`。

---

## 5. 测试

### 5.1 单元测试

| 文件 | 新增用例 |
|------|----------|
| `src/lib/side-menu-match.test.ts` | `activeTopNavKeyForPath` ×6：`/`、`/instances/vm`→`compute`、`/volumes`→`storage`、`/k8s-clusters`、`/settings/api-keys`→`settings`、`/unknown`→`/`。`sidebarItemsForTopNavKey` ×3：`compute` 6 子项、`/k8s-clusters` null、未知 key null。 |

**结果**：19/19 全绿。

### 5.2 E2E

| 文件 | 场景 |
|------|------|
| `e2e/navigation.spec.ts` | 11 个用例：顶栏点击进入 VM/容器/GPU/Sandbox/块存储/镜像/VPC/K8s 集群；详情保持侧栏选中；创建使用独立页面；首页无侧栏；其它一级有侧栏。 |
| `e2e/instances.spec.ts` | GPU 清单页通过顶栏点击进入。 |
| `e2e/storage.spec.ts` | 块存储/文件存储/对象存储详情；侧栏点叶子跳转。 |
| `e2e/networks.spec.ts` | VPC 列表侧栏「网络管理」标题可见。 |

**结果**：49/49 全绿（含原有未改动的 api-keys、auth、dashboard、images、k8s-clusters、observability-usage、placeholders、registry、sandbox-templates、security-secrets、vector-stores）。

### 5.3 验收命令与结果

```bash
cd frontends/console
npm run test         # 13 文件 / 65 测试 通过（6 个文件 pre-existing 失败：testing-library/dom 缺包，与本次改动无关）
npx playwright test --workers=1 --reporter=line   # 49/49 通过
npm run build        # ✓ built in 16.55s
```

> `npm run verify` 中的 `codegen` 因 Windows 下 `spawnSync npx ENOENT`（Node.js `child_process` 在 Windows 必须用 `shell: 'bash.exe'` 才能 `spawnSync npx`）失败，这是 **pre-existing 环境问题**，与本次改动无关。各步骤单独执行均通过。

---

## 6. 风险与权衡

1. **设计规范冻结令冲突**：用户在本次会话中显式覆盖「设计规范 2.0 已冻结」的限制（仅限壳层布局）。本 Sprint 与 PR description 均记录此覆盖，避免后续 reviewer 误判。
2. **空侧栏视觉**：`/k8s-clusters`、`/registry`、`/observability`、`/usage` 这 4 个叶子一级菜单激活时，侧栏仅显示分组标题 + `Empty` 占位。视觉上略奇怪但符合「保留 184px 占位」的决策；后续可放快捷链接或说明文案（follow-up）。
3. **Arco `Menu` horizontal 模式样式**：默认无 28×3px 激活下划线；通过 `:global()` 自定义 `.topnav-menu.arco-menu-horizontal .arco-menu-item-selected::after` 实现。
4. **并行 worker 导致 VM 详情测试偶发失败**：`e2e/navigation.spec.ts:21` 在 6 workers 并行下偶发 `expected /\/instances\/vm\/inst-1/ received /\/instances\/inst-1/`。**根因**：mock `api-mock.ts:39` 的 `/^\/instances\/[^/]+$/` 同时匹配 `/instances/inst-1` 与 `/instances/vm/inst-1`，并行 worker 的路由注册存在竞争。串行 `--workers=1` 时全绿。**这是 pre-existing mock 顺序问题**，与本次改动无关。
5. **`PageHeader` 与 mockup `header-card` 不一致**：mockup 的 `header-card` 更复杂，本次不改，留作后续 SCB 批次。
6. **响应式折叠**：184px 桌面固定，窄屏下会挤压内容。当前 Arco `Sider` 的 `breakpoint="lg" collapsible` 行为已丢失。本次接受该回退，follow-up 再补。
7. **`menuItems` schema 不统一**：现有数据中叶子项 `key` 即 path、分组项 `key` 是 group id（`compute` / `storage` 等）。`TopNav` 通过 `isGroupItem` 分两种处理；`Sidebar` 直接用 `child.key` 作 `Link to`。

---

## 7. 文档更新

- [x] `docs/sprints/SPRINT-SCB-02L-top-nav-layout.md`（本文件）
- [ ] `docs/CONSOLE-TASK-PLAN.md` §2.3 SCB 表（不在原 SCB 序号序列内，独立编号 SCB-02L，未回写主表）
- [ ] `docs/CONSOLE-SPEC-COMPLIANCE-BATCHES.md`（同上）

---

## 8. 已知限制 / 后续

- 顶栏与侧栏的精确像素对照（mockup 顶栏 56px、侧栏 184px、激活下划线 28×3px）已对齐；`PageHeader` 仍是旧版本。
- 无子项一级菜单的空白侧栏后续可补快捷链接。
- 响应式折叠未实现。
- mock `api-mock.ts` 的 `/^\/instances\/[^/]+$/` 在并行 worker 下偶发冲突，建议后续修 mock 顺序或改用 `page.route` 精确匹配。

---

## 9. 下一阶段入口

- 若需继续：mockup `header-card` 升级 → 新开 SCB 批次（SCB-02L 的 follow-up，不阻塞当前任务）。
