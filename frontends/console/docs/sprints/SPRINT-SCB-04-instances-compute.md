# SPRINT-SCB-04 · 实例与算力（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐实例、GPU 清单、Sandbox 模板页面至冻结规范。

| 路由 | 页面模板 |
|------|----------|
| `/instances` | 模板 B 列表 + 三态 |
| `/instances/$id` | 模板 C 详情（单一 primary + Tab 区三态） |
| `/instances/$id/operations` | 模板 B 列表（`CursorTable`） |
| `/gpu-inventory` | 模板 A 分区指标 + 饼图 + 表格 |
| `/sandbox-templates` | 模板 B 列表（空态文案） |

**Arco**：`Card`、`Button`、`Descriptions`、`Tabs`、`Modal`、`Statistic`（经 `MetricCard`）、`Spin`、`Grid`、`Space`、`Empty`。

---

## 2. 变更清单

### 2.1 新增

| 路径 | 说明 |
|------|------|
| `e2e/instances.spec.ts` | 实例列表进详情、GPU 清单指标 E2E |

### 2.2 修改

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/instances/index.tsx` | `space-y-4` 分区；空态文案 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 详情模板 C：单一 primary（控制台）；`TabQueryBody` 三态；删除 `Modal.confirm`；去掉 JSON 堆砌；`Descriptions` 响应式列 |
| `src/routes/_authenticated/instances/$instanceId.operations.tsx` | 改用 `CursorTable` |
| `src/routes/_authenticated/gpu-inventory/index.tsx` | `MetricCard`；Arco 色饼图；分区 loading |
| `src/routes/_authenticated/sandbox-templates/index.tsx` | `emptyDescription` 对齐规范 |
| `e2e/support/api-mock.ts` | 新增 `GET /instances/{id}` fixture |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 11 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 实例列表符合列表模板 + 三态
- [x] 实例详情单一 primary；危险删除 `Modal.confirm`
- [x] 操作记录 Tab 使用 `CursorTable` loading / empty / error
- [x] GPU 清单指标卡 + 图表色板对齐 Arco 主色
- [x] Arco + Token + Tailwind 布局 only

---

## 5. 下一批

**SCB-05** 存储：`/volumes/*`、`/filesystems/*`、`/objects`
