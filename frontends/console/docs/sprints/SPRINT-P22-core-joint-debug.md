# SPRINT-P22 · Core 联调增强

> 状态：**计划中**（2026-06-30）  
> 验收：执行阶段必须以 `npm run verify` 通过为准；本文仅为执行计划，尚未粘贴验收输出。

---

## 1. 目标

本阶段面向 ANI Console 与 ANI Core Gateway 的联合调试，优先增强已有 Core 页面在真实 Gateway 下的可用性与可验证性：

1. 以 Registry、API Key、概览 Dashboard 为联调主线，覆盖 Core `/api/v1` 的读取、创建、撤销、查询与错误态。
2. 补齐 Registry Pull Secret Kubernetes Apply 的前端入口，对齐 Sprint 13 P6-B3 后端能力。
3. 固化前端联调流程：本地 Vite 代理指向真实 Gateway，类型生成严格来自唯一 Core OpenAPI 契约。

---

## 2. 全局硬约束

### 2.1 唯一 API 契约

| 项 | 规则 |
|----|------|
| Core API 唯一真实来源 | `/root/kubercon/ANI/repo/api/openapi/v1.yaml` |
| 前端契约镜像 | `/root/kubercon/design/openapi/v1.yaml` 只能作为同步后的 codegen 输入，不得成为独立事实来源 |
| 类型生成 | 只能通过 `npm run codegen` 生成 `src/api/core-schema.d.ts` |
| API 调用 | 所有 Core 请求必须使用 `src/api/client.ts` 暴露的 `coreApi`，禁止手写 `fetch('/api/v1/...')` |
| 写操作 | POST 与有副作用 PUT/PATCH 必须携带 `idempotency_key`，使用 `src/lib/idempotency.ts` |
| Services 边界 | 本阶段不接入 `/api/v1/svc`，不开发模型、推理、知识库等 Services 页面能力 |

执行前必须先同步契约：

```bash
cp /root/kubercon/ANI/repo/api/openapi/v1.yaml /root/kubercon/design/openapi/v1.yaml
cd /root/kubercon/design/frontends/console
npm run codegen
```

如果 `core-schema.d.ts` 生成后出现类型变化，前端实现必须按新类型修正；不得通过 `as any`、手写 interface 或绕开 `coreApi` 规避契约。

### 2.2 前端项目规范

必须遵循：

- `frontends/console/CLAUDE.md`
- `frontends/console/CONVENTIONS.md`
- `frontends/console/docs/CONSOLE-TASK-PLAN.md`
- `DESIGN-SPEC-FREEZE.md`
- `UI规范-2.0.md` 与 `产品设计规范-*-2.0.md` 只读，不修改正文

实现规则：

- 页面必须位于 `src/routes/**/*.tsx`，路由与页面同文件。
- UI 只使用 Arco Design React。
- Tailwind 仅用于布局 utilities，不替代 Arco Token。
- 列表页必须具备 loading、empty、error 三态。
- 新增或修改用户可见流程必须补 E2E。

---

## 3. 变更清单

### 3.1 新增文件

| 路径 | 说明 |
|------|------|
| `docs/sprints/SPRINT-P22-core-joint-debug.md` | 本阶段计划与执行记录 |
| `e2e/core-joint-debug.spec.ts` | 建议新增真实/模拟联调主路径 E2E，覆盖 Registry、API Key、Dashboard 冒烟 |

### 3.2 修改文件

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/_authenticated/registry/index.tsx` | 增强 Pull Secret 弹窗，支持 Kubernetes Apply 模式 |
| `src/routes/_authenticated/settings/api-keys.tsx` | 加固真实 Gateway 下的创建、撤销、错误态与一次性密钥展示 |
| `src/routes/_authenticated/index.tsx` | 保持概览聚合逻辑，增强局部错误态，不因单个 API 失败导致整页不可用 |
| `e2e/registry.spec.ts` | 补 Registry Pull Secret Kubernetes Apply 交互覆盖 |
| `e2e/api-keys.spec.ts` | 补 API Key 创建失败、撤销后刷新或成功提示覆盖 |
| `e2e/mock-server-smoke.spec.ts` | 扩展 Mock Server smoke，确认契约同步后页面仍可运行 |
| `e2e/support/api-mock.ts` | 如新增 operation mock，仅按 `openapi/v1.yaml` schema 返回字段 |
| `.env.example` | 明确真实 Gateway 联调变量 `VITE_API_PROXY_TARGET=http://127.0.0.1:8080` |
| `docs/CONSOLE-TASK-PLAN.md` | 执行完成后新增 P22 状态与覆盖说明 |
| `docs/CONSOLE-SPRINT-PHASES.md` | 执行完成后新增 P22 活跃/完成索引 |

### 3.3 删除 / 废弃

| 路径 | 原因 |
|------|------|
| 无 | 本阶段不删除存量页面，不做大规模重构 |

### 3.4 契约 / 配置

| 项 | 说明 |
|----|------|
| `/root/kubercon/ANI/repo/api/openapi/v1.yaml` | 唯一 Core API 契约；前端执行前必须同步 |
| `/root/kubercon/design/openapi/v1.yaml` | 前端 codegen 输入；必须来自上游 Core 契约 |
| `VITE_API_PROXY_TARGET` | 本地联调指向真实 Gateway：`http://127.0.0.1:8080` |
| `VITE_OIDC_REDIRECT_URI` | 默认 `http://localhost:5173/login/callback` |

---

## 4. 功能设计

### 4.1 Registry Pull Secret Kubernetes Apply

当前页面已有 Registry 项目、仓库、制品、权限、Pull Secret、扫描查询。P22 在现有页面上做最小增强：

- Pull Secret 弹窗增加操作模式：
  - `仅创建 Pull Secret`
  - `创建并应用到 Kubernetes Namespace`
- `仅创建 Pull Secret` 保持调用：
  - `POST /registry/projects/{project}/pull-secret`
- `创建并应用到 Kubernetes Namespace` 调用：
  - `POST /registry/projects/{project}/pull-secret/kubernetes-apply`
- 请求体字段必须来自 `core-schema.d.ts` 类型，不手写 schema。
- `namespace` 对 apply 模式必填；为空时前端阻止提交并提示。
- 成功后显示结果摘要：
  - Project
  - Secret name
  - Namespace
  - Secret type：`kubernetes.io/dockerconfigjson`
- 失败时显示后端错误，不吞错。

### 4.2 API Key 管理联调加固

保持现有 API Key 页面结构，仅增强真实 Gateway 下的可诊断性：

- `GET /auth/api-keys` 加载失败时展示错误态。
- `POST /auth/api-keys` 成功后继续只展示一次 `key_value`。
- `DELETE /auth/api-keys/{key_id}` 成功后刷新列表。
- 创建表单继续校验：
  - name 非空且不超过 128
  - scopes 至少一项
  - rate_limit_rpm 在 1 到 10000
  - expires_at 为合法 ISO 时间或空

### 4.3 Dashboard Core 冒烟页

概览页保持前端聚合，不新增后端聚合 API：

- `/instances`
- `/gpu-inventory/occupancy`
- `/observability/alert-rules`
- `/metering/usage`

要求：

- 核心指标区支持 loading。
- 某个 API 失败时展示局部错误，其他区块继续展示。
- 空数据展示 Empty，不使用假数据兜底。
- 仅通过 Core `/api/v1` 获取数据。

---

## 5. 实施任务

### Task 1：同步 Core OpenAPI 并生成类型

命令：

```bash
cp /root/kubercon/ANI/repo/api/openapi/v1.yaml /root/kubercon/design/openapi/v1.yaml
cd /root/kubercon/design/frontends/console
npm run codegen
```

检查：

- `src/api/core-schema.d.ts` 发生变化时，逐项确认新增/变更 operation。
- 若契约中不存在计划使用的路径，停止实现，回到 ANI Core 契约确认，不在前端伪造 API。

### Task 2：实现 Registry Kubernetes Apply 入口

修改：

- `src/routes/_authenticated/registry/index.tsx`

步骤：

1. 在 Pull Secret Modal 中增加模式选择。
2. apply 模式增加 namespace 必填校验。
3. 按类型调用 `coreApi.POST('/registry/projects/{project}/pull-secret/kubernetes-apply', ...)`。
4. 成功后展示返回结果摘要。
5. 保持原 `/pull-secret` 路径可用。

### Task 3：补 Registry E2E

修改：

- `e2e/registry.spec.ts`
- `e2e/mock-server-smoke.spec.ts`
- `e2e/support/api-mock.ts`

覆盖：

1. 进入 `/registry`。
2. 选择项目与仓库。
3. 打开 Pull Secret。
4. 选择 Kubernetes Apply。
5. 填写 namespace。
6. 提交成功后看到 namespace 与 secret type。

### Task 4：加固 API Key 页面

修改：

- `src/routes/_authenticated/settings/api-keys.tsx`
- `e2e/api-keys.spec.ts`

覆盖：

1. API Key 列表加载成功。
2. 创建 API Key 后弹出一次性密钥。
3. 关闭弹窗后密钥不再显示。
4. 撤销 API Key 后列表刷新。
5. 创建失败时显示错误。

### Task 5：增强 Dashboard 局部错误态

修改：

- `src/routes/_authenticated/index.tsx`
- `e2e/core-joint-debug.spec.ts`

覆盖：

1. `/` 能展示概览标题。
2. 任一聚合 API mock 失败时，对应区块显示错误。
3. 其他区块仍可显示数据或空态。

### Task 6：补联调环境说明

修改：

- `.env.example`
- `docs/CONSOLE-TASK-PLAN.md`
- `docs/CONSOLE-SPRINT-PHASES.md`
- `docs/sprints/SPRINT-P22-core-joint-debug.md`

建议 `.env.local`：

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:8080
VITE_OIDC_REDIRECT_URI=http://localhost:5173/login/callback
```

真实 Gateway 前置条件：

```bash
# /root/kubercon/ANI
kubectl proxy --address=127.0.0.1 --port=18003 --accept-hosts=.*
```

Gateway debug env 至少包含：

- `ANI_AUTH_MODE=dev`
- `DATABASE_URL`
- `GATEWAY_REDIS_URL`
- `REGISTRY_PROVIDER=harbor`
- `REGISTRY_ENDPOINT=docker.kubercon.local`
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- `REGISTRY_SECURE=true`
- `REGISTRY_TLS_INSECURE=true`
- `SECRET_PROVIDER_MODE=kubernetes_rest`
- `KUBERNETES_API_HOST=http://127.0.0.1:18003`

---

## 6. 测试

### 6.1 单元测试

| 文件 | 新增用例说明 |
|------|--------------|
| `src/lib/validators.test.ts` | 如新增 namespace 或 scope 校验工具，在此补单元测试 |
| 无纯逻辑变更时 | 在本文件验收记录中说明“本阶段仅页面交互变更，无新增纯逻辑单元测试” |

### 6.2 E2E

| 文件 | 场景 |
|------|------|
| `e2e/registry.spec.ts` | Registry Pull Secret Kubernetes Apply 主路径 |
| `e2e/api-keys.spec.ts` | API Key 创建、一次性展示、撤销 |
| `e2e/core-joint-debug.spec.ts` | Dashboard Core 聚合冒烟与局部错误态 |
| `e2e/mock-server-smoke.spec.ts` | Mock Server 对契约同步后的 smoke 覆盖 |

### 6.3 验收命令与结果

执行阶段必须运行：

```bash
cd /root/kubercon/design/frontends/console
npm run codegen
npm run typecheck
npm run test
npm run test:e2e
npm run test:e2e:mock-server
npm run build
npm run verify
```

完成后把输出摘要粘贴在此处：

```text
待执行：unit N ✓ | e2e M ✓ | mock-server smoke K ✓ | build ✓
```

---

## 7. 文档更新

- [x] `docs/sprints/SPRINT-P22-core-joint-debug.md`（本计划）
- [ ] `docs/CONSOLE-SPRINT-PHASES.md` 活跃表（执行时更新）
- [ ] `docs/CONSOLE-TASK-PLAN.md` 待办/覆盖表（执行完成后更新）
- [ ] `.env.example`（执行时补真实 Gateway 联调说明）

---

## 8. 已知限制 / 后续

- 本阶段不做 Services API 页面联调；模型中心、推理服务、知识库等由外部 Services 团队提供 mock 或后端后再规划。
- 默认 E2E 使用浏览器层 mock；通过默认 E2E 不代表真实 Gateway 可用。
- `test:e2e:mock-server` 只证明 Core Mock Server smoke；真实 Harbor / Kubernetes Apply 仍需人工联调或后续 live smoke。
- 如果 `/registry/projects/{project}/pull-secret/kubernetes-apply` 在同步后的 `openapi/v1.yaml` 中不存在，必须先回 ANI Core 修契约与实现，前端不得先写隐藏 API。

---

## 9. 下一阶段入口

- P23 建议：Core 真实 Gateway smoke 分层，把 Mock Server smoke 与 Gateway smoke 拆成独立 Playwright profile。
- P24 建议：存储与对象上传联调增强，覆盖 `202 + AsyncTask` 轮询路径。

---

## 10. 执行记录：Images / VM ISO 契约同步（2026-07-09）

根目录最新 Core `v1.yaml` 已同步到 `openapi/v1.yaml` 并重新生成 `src/api/core-schema.d.ts`。本轮接入新增 `Images` 组：`/images` 列表、`/images/uploads` 创建上传会话、`/images/{image_id}` 删除；并在 VM 创建表单中新增 `containerDisk / ISO 安装` 启动介质切换，ISO 模式提交 `boot_media.type=iso`、`image_id`、`boot_order=1` 与 `root_disk_size_gib`，不再同时提交 `boot_image`。

| 文件/区域 | 说明 |
|-----------|------|
| `openapi/v1.yaml`、`src/api/core-schema.d.ts` | 同步 Core Images 与 VM boot media 契约 |
| `src/routes/_authenticated/images/index.tsx` | 新增可启动镜像页面，展示上传会话 URL/token |
| `src/routes/_authenticated/instances/index.tsx` | VM 创建支持 Ready ISO 选择与空白系统盘大小 |
| `src/components/shell/SideMenu.tsx`、`src/lib/side-menu-match.ts` | 存储分组新增“可启动镜像”入口 |
| `e2e/images.spec.ts`、`e2e/instances.spec.ts`、`e2e/navigation.spec.ts` | 覆盖上传会话、VM ISO 提交体与侧栏入口 |

验证：`npm run verify` 通过，包含 codegen、typecheck、unit 68/68、E2E 42/42 与 production build。

---

## 11. 执行记录：ISO 直传 + noVNC 闭环补齐（2026-07-09）

按 `docs/superpowers/specs/2026-07-09-iso-upload-vm-novnc-design.md`，在现有 Images / VM ISO / VNC 骨架上补齐浏览器直传与控制台协议。

| 文件/区域 | 说明 |
|-----------|------|
| `src/lib/image-upload.ts`、`src/lib/image-upload.test.ts` | 新增 helper：`POST /images/uploads`（固定 `format=iso`，不传 `storage_class`）→ 会话 token 直传 `upload_url` → 轮询至 `ready/failed` |
| `src/routes/_authenticated/images/index.tsx` | 「上传 ISO」选本地文件、进度条、列表轮询；去掉 format/qcow2/raw 与 storage_class 主路径 |
| `src/components/instances/InstanceVncConsole.tsx` | 默认 `protocol: novnc`；后端错误原文；过期/断开可重新连接；卸载 disconnect |
| `src/routes/_authenticated/instances/$instanceId.tsx` | 仅 `kind=vm && state=running` 启用「控制台」 |
| `e2e/images.spec.ts`、`e2e/instances.spec.ts`、`e2e/support/api-mock.ts` | 覆盖直传 Authorization、不传 storage_class、console `novnc` |

验证：`npm run verify` 通过（codegen、typecheck、unit 72、E2E 42、build）。
本地 noVNC 策略：直接连接后端返回的 `connect_url`（不改写同源代理）。

---

## 12. 执行记录：大 ISO 直传进度/入库修复（2026-07-10）

修复大 ISO（如 openEuler DVD）在浏览器进度到 100% 后误判失败的问题：发送完成 ≠ 镜像 ready。

| 文件/区域 | 说明 |
|-----------|------|
| `src/lib/image-upload.ts` | 直传固定 `Content-Type: application/octet-stream` + `xhr.send(file)`；进度封顶 99%；发送完成后进入 `importing` 并轮询；会话 POST 同步 `Idempotency-Key` 头 |
| `src/routes/_authenticated/images/index.tsx` | 两段进度文案（上传中 / 上传完成，正在入库…）；`size_gib` 按文件计算，去掉写死 5 |
| `src/lib/image-upload.test.ts`、`e2e/images.spec.ts` | 覆盖 octet-stream、幂等头、按文件算 size、发送失败 HTTP 原文 |

验证：`npm run verify` 通过。

---

## 13. 执行记录：ISO 上传准备门禁（2026-07-10）

按方案 A 只改前端状态机：创建上传会话后先轮询 `GET /images/{image_id}`，仅当 `state === uploading` 时才开始 `xhr.send(file)`，避免 CDI upload pod / upload-prime 还未就绪时浏览器进度条提前启动。

| 文件/区域 | 说明 |
|-----------|------|
| `src/lib/image-upload.ts` | 新增 `preparing → uploading → processing → ready/failed` 状态机；`preparing` 最多等待 5 分钟；`failed/deleting/deleted` 立即失败 |
| `src/routes/_authenticated/images/index.tsx` | 文案改为“正在准备存储（等待上传服务就绪）…”、“正在发送文件…”，“发送完成，平台入库中…”；`preparing` 用不确定进度 |
| `src/lib/image-upload.test.ts` | 新增回归测试：`pending` 阶段禁止调用 `xhr.send`，进入 `uploading` 后才发送原始文件 |
| `e2e/images.spec.ts` | 上传流程 mock 先返回 `uploading` 门禁，再返回 `ready`，覆盖 UI 准备态 |

验证：`npm run verify` 通过（codegen、typecheck、unit 75/75、E2E 42/42、build）。

---

## 14. 执行记录：ISO 上传 503 重试与真实进度（2026-07-10）

继续按方案 A 只改前端：上传服务门禁通过后再稳定等待 3 秒；直传阶段如果 upload proxy 返回 503，不立即失败，最多重试 6 次，每次等待 5 秒；进度条只使用 `xhr.upload.onprogress` 的 `loaded/total` 字节，不使用定时器或估算。

| 文件/区域 | 说明 |
|-----------|------|
| `src/lib/image-upload.ts` | `state=uploading` 后额外稳定等待；503 退避重试；`ImageUploadProgress` 增加 `loadedBytes/totalBytes` |
| `src/routes/_authenticated/images/index.tsx` | `preparing/processing` 改为 Spin，不显示百分比；`uploading` 显示真实发送百分比与已传/总量 |
| `src/lib/image-upload.test.ts` | 覆盖 503 自动重试、同一个 File 原始二进制重发、真实 loaded/total 进度 |

验证：`npm run verify` 通过（codegen、typecheck、unit 76/76、E2E 42/42、build）。
