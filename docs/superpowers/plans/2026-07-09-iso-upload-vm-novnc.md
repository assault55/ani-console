# ISO Upload → VM → noVNC Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax. Prefer TDD. Do **not** auto-commit unless the user asks.

**Goal:** Console 端到端补齐：本地 ISO 直传、Ready ISO 创建 VM（已有则小修）、Running VM 打开 noVNC（`protocol: novnc`）。

**Architecture:** 在现有 `/images`、`/instances`、`/instances/console` 上最小修补；新增 `image-upload` helper 负责会话+直传+轮询；noVNC 直连 `connect_url`。

**Tech Stack:** React 18、Arco Design、TanStack Query/Router、openapi-fetch、`@novnc/novnc`、Vitest、Playwright

**Spec:** `docs/superpowers/specs/2026-07-09-iso-upload-vm-novnc-design.md`

## Global Constraints

- 只改 Console 前端；不改 Core OpenAPI / Gateway / Services
- 契约以 `openapi/v1.yaml` / `core-schema.d.ts` 为准
- ISO 直传用会话 `token`，不用用户 JWT；不传 `storage_class`
- noVNC 固定 `protocol: 'novnc'`；本地直连 `connect_url`
- 验收：`cd frontends/console && npm run verify`
- 完成后更新 sprint development record；不改冻结设计规范

---

### Task 1: `image-upload` helper

**Files:**
- Create: `frontends/console/src/lib/image-upload.ts`
- Create: `frontends/console/src/lib/image-upload.test.ts`

**Interfaces:**
- Produces:
  - `suggestImageSizeGib(fileSizeBytes: number): number` → `max(1, ceil(bytes/1GiB) + 1)`
  - `uploadImageFile(input: { file: File; name?: string; sizeGib?: number; contentType?: string; onProgress?: (pct: number) => void; signal?: AbortSignal }): Promise<Image>`
  - 内部：`POST /images/uploads`（`format: 'iso'`，不传 `storage_class`）→ XHR 直传 `upload_url`（`Authorization: Bearer <session.token>`）→ 轮询 `GET /images/{id}` 至 `ready|failed`

- [ ] **Step 1:** 写失败单测（size 建议、创建会话 body、直传 header、ready 轮询）
- [ ] **Step 2:** 实现 helper 使单测通过
- [ ] **Step 3:** `npx vitest run src/lib/image-upload.test.ts`

---

### Task 2: `/images` 页面直传 UI

**Files:**
- Modify: `frontends/console/src/routes/_authenticated/images/index.tsx`
- Modify: `frontends/console/e2e/images.spec.ts`

- [ ] **Step 1:** 主按钮「上传 ISO」；文件选择；去掉 format/qcow2/raw 与 storage_class 主路径
- [ ] **Step 2:** 调用 `uploadImageFile`；进度条；列表轮询；failed 展示 reason/message
- [ ] **Step 3:** 更新 e2e：选文件 → mock uploads + mock upload_url → 不再只断言展示 token

---

### Task 3: noVNC 修补

**Files:**
- Modify: `frontends/console/src/components/instances/InstanceVncConsole.tsx`
- Modify: `frontends/console/src/components/instances/InstanceVncConsole.test.tsx`
- Modify: `frontends/console/src/routes/_authenticated/instances/$instanceId.tsx`
- Modify: `frontends/console/e2e/instances.spec.ts`

- [ ] **Step 1:** 默认 `protocol: 'novnc'`；`getErrorMessage`；`expires_at` + 重新连接；卸载 disconnect
- [ ] **Step 2:** 详情页仅 `kind==='vm' && state==='running'` 启用控制台
- [ ] **Step 3:** 单测/e2e 断言 `novnc`

---

### Task 4: 验证与记录

**Files:**
- Modify: `frontends/console/docs/sprints/SPRINT-P22-core-joint-debug.md`（追加执行记录）
- Optionally: `frontends/console/docs/CONSOLE-TASK-PLAN.md` 一行

- [ ] **Step 1:** `cd frontends/console && npm run verify`
- [ ] **Step 2:** 更新 development record；`git diff --check`
- [ ] **Step 3:** 不自动 commit（除非用户要求）

---

## Spec coverage check

| Spec 项 | Task |
|---------|------|
| ISO 直传 + 进度 + 轮询 | 1–2 |
| 不传 storage_class / 固定 iso | 1–2 |
| VM ISO 创建（已有） | 仅缺口时小修于 Task 2/4 |
| noVNC novnc + running + 直连 | 3 |
| verify + sprint 记录 | 4 |
