# SPRINT-SCB-05 · 存储（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐块存储、文件存储、对象存储页面至冻结规范。

| 路由 | 页面模板 |
|------|----------|
| `/volumes` | 模板 B 列表 + 三态 |
| `/volumes/$id` | 模板 C 详情（单一 primary + 子表三态） |
| `/filesystems` | 模板 B 列表 + 三态 |
| `/filesystems/$id` | 模板 C 详情 + 挂载目标 `CursorTable` |
| `/objects` | 模板 B 列表（Tab 分区：存储桶 / 对象） |

**Arco**：`Card`、`Button`、`Descriptions`、`Tabs`、`Modal`、`Upload`、`Empty`、`Spin`、`Space`。

---

## 2. 变更清单

### 2.1 修改

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/volumes/index.tsx` | `space-y-4`；空态文案；删除确认强化 |
| `src/routes/_authenticated/volumes/$volumeId.tsx` | 详情 loading 分区；`CursorTable` 快照三态；响应式 `Descriptions` |
| `src/routes/_authenticated/filesystems/index.tsx` | `space-y-4`；空态文案 |
| `src/routes/_authenticated/filesystems/$filesystemId.tsx` | 详情 loading 分区；挂载目标 `CursorTable` 三态 |
| `src/routes/_authenticated/objects/index.tsx` | Tab 切换选桶；`Empty` 未选桶态；对象表三态；删除 `Modal.confirm` |
| `e2e/support/api-mock.ts` | 新增 `GET /objects` fixture |
| `e2e/storage.spec.ts` | 新增对象存储 E2E |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 12 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 块存储 / 文件存储列表符合列表模板 + 三态
- [x] 详情页分区 loading；子资源表使用 `CursorTable`
- [x] 对象存储 Tab 分区清晰；未选桶 `Empty` 引导
- [x] 危险删除均有 `Modal.confirm`
- [x] Arco + Token + Tailwind 布局 only

---

## 5. 下一批

**SCB-06** 网络：`/networks/*` 五类（可与 P18 GET 详情 Drawer 合并）
