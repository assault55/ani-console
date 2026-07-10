# ISO 上传 → VM 装机 → noVNC 设计

**日期：** 2026-07-09  
**状态：** 已实现（待联调）  
**范围：** ANI Console 前端（`frontends/console/`）  
**契约：** Core OpenAPI `v1.yaml`（`https://{host}/api/v1`）；禁止 Services API

## 背景与目标

用户需要在 Console 完成闭环：

1. 上传本地 ISO 到 Core Images
2. 用 Ready ISO 创建 VM（空白系统盘 + CD-ROM）
3. VM Running 后打开 noVNC 完成 OS 安装

现有骨架已覆盖：Images 列表/创建上传会话、VM `boot_media.type=iso` 创建、独立 noVNC 页面。本设计只补齐缺口，不做向导页或上传基础设施大重构。

## 已确认决策

| 决策 | 选择 |
|------|------|
| 实现范围 | 端到端补齐（镜像直传 + VM 小修 + noVNC 修补） |
| 实现形态 | 在现有 `/images`、`/instances`、`/instances/console` 上最小修补 |
| 本地 noVNC WebSocket | 直接连接后端返回的 `connect_url`（不改写、不强制 Vite `ws` 代理） |
| console protocol | 固定 `novnc` |
| console API | `POST /instances/{id}/console`（以 OpenAPI 为准，不是 `/actions/console`） |
| 实例字段 | 使用 OpenAPI `kind`（不是提示词中的 `type`） |

## 非目标

- 不改 Core OpenAPI / Gateway / Services
- 不实现 serial 终端 UI
- 不支持 `qcow2` / `raw` / `boot_media.type=disk_image`（本期 UI 固定 iso）
- 不把 ISO 文件 POST 到 Gateway `/images` 请求体
- 不写死 StorageClass；默认不传 `storage_class`
- 不直连 KubeVirt / CDI CR；不把集群凭据放进浏览器

## 架构

```text
[/images]
  选本地 .iso
    → POST /images/uploads { format: iso, size_gib, ... }
    → (可选) 轮询 GET /images/{id} 至可上传
    → HTTP POST/PUT upload_url + Bearer <session.token> 直传文件
    → 轮询 GET /images/{id} 至 ready | failed

[/instances 创建 VM]
  boot_mode=iso
    → POST /instances
       boot_media: { type: iso, image_id, boot_order: 1 }
       root_disk_size_gib
       boot_image: null
    → 列表/详情轮询至 running

[/instances/{id} → 控制台]
  仅 kind=vm && state=running
    → 打开 /instances/console/{id}
    → POST /instances/{id}/console { protocol: novnc }
    → RFB(connect_url)；卸载 disconnect
```

## 1. 镜像上传（`/images`）

### UI

- 主按钮改为「上传 ISO」
- 表单：本地文件选择（必填 `.iso`）、名称（默认文件名）、容量 GiB（可改）、Content-Type（默认 `application/x-iso9660-image`）
- `format` 固定 `iso`；UI 不再提供 qcow2/raw
- **移除** `storage_class` 表单字段（或仅高级可选且默认空且不提交）
- 上传进度条；列表展示 `state`；`failed` 展示 `reason`/`message`
- 删除前确认；文案提示仍被实例引用时后端可能拒绝

### `size_gib`

- 默认：`Math.max(1, Math.ceil(file.size / (1024 ** 3)))`，建议再 +1 余量（实现取 `ceil + 1`，用户可改）
- 提交前校验 ≥ 1

### API 与直传

1. `POST /images/uploads`  
   body：`idempotency_key`、`name`、`format: "iso"`、`size_gib`、可选 `content_type`  
   **不传** `storage_class`
2. 直传：使用会话 `method`（默认 POST）请求 `upload_url`  
   - Header：`Authorization: Bearer <session.token>`（会话 token，不是用户 JWT）  
   - Body：文件二进制  
   - Content-Type：`application/octet-stream` 或 ISO MIME  
   - 进度：优先 XHR `upload.onprogress`（或等价能力）
3. 轮询 `GET /images/{image_id}`：  
   - `pending` / `uploading` / `processing` → 继续  
   - `ready` → 成功  
   - `failed` → 展示原文，允许用**新** idempotency_key 重试  
4. 会话 `expires_at` 过期：提示重新创建会话，禁止继续用旧 token 上传

### 实现落点

- 新增 helper（建议 `src/lib/image-upload.ts`）：创建会话 + 直传 + 可选轮询；与 `object-upload.ts` 分离（鉴权头语义不同）
- 改造 `src/routes/_authenticated/images/index.tsx`：文件选择、进度、轮询、去掉「只展示 URL/token」的主路径
- 更新 `e2e/images.spec.ts`：覆盖选文件 → 会话 → mock 直传 → 状态

## 2. 创建 VM（`/instances`）

### 已有行为（保持）

- VM +「ISO 安装」：提交  
  `boot_media: { type: 'iso', image_id, boot_order: 1 }`、`root_disk_size_gib`、`boot_image: null`
- Ready ISO 下拉：`GET /images?format=iso&state=ready`

### 本轮小修（仅必要时）

- 确认创建 body 与 OpenAPI `CreateInstanceRequest` 一致（`kind`，非 `type`）
- ISO 模式必填 `boot_media_image_id` 与 `root_disk_size_gib`（已有校验则不动）
- 不引入新向导页

## 3. noVNC

### 入口

- 实例详情：仅 `kind === 'vm' && state === 'running'` 启用「控制台」按钮；否则禁用并提示「实例未运行」
- 点击打开独立窗口 `/instances/console/{instanceId}`（保持现有交互）

### Session 与 RFB

- `POST /instances/{instance_id}/console`，body：`{ protocol: 'novnc' }`
- 使用返回的 `connect_url`（兼容 `url`）初始化：

```ts
import RFB from '@novnc/novnc'
const rfb = new RFB(containerEl, session.connect_url)
rfb.scaleViewport = true
rfb.resizeSession = true
```

- **禁止**：直连 KubeVirt、拼 `?token=`、改写为 localhost 同源代理（本轮本地策略为直连）
- API 失败：`getErrorMessage(error)` 展示后端原文
- `expires_at` 过期或断开后提示重新申请；提供「重新连接」
- 组件卸载：`rfb.disconnect()`

### 实现落点

- `InstanceVncConsole.tsx`：默认 protocol `novnc`；错误与过期处理
- `$instanceId.tsx`：running 门禁
- 单测 / e2e：期望 `protocol: 'novnc'`

## 4. 鉴权与幂等

- Gateway 请求：`Authorization: Bearer <access_token>`（现有 `coreApi` middleware）
- 有副作用 POST：body 必须带 `idempotency_key`；重试复用同一 key
- 若联调发现 Gateway 强制要求 `Idempotency-Key` 头：与 body 同值一并设置（在 client middleware 或单次请求 headers 中统一，避免只改一处）
- 直传 uploadproxy：**只用会话 token**，不用用户 JWT

## 5. 错误与状态

| 场景 | 行为 |
|------|------|
| 非 `.iso` 文件 | 表单校验拦截 |
| 上传会话失败 | Alert/Message 展示后端原文 |
| 直传 HTTP 非 2xx | 展示状态码/响应文本；允许重试（新会话） |
| 镜像 `failed` | 列表/详情展示 `reason`/`message` |
| 实例非 running 开控制台 | 按钮禁用 |
| console 无权限 / 过期 | 控制台页明确错误，不白屏 |
| RFB 安全握手失败 | 展示 reason |

## 6. 测试与验收

### 自动化

- Unit：`image-upload` helper；`InstanceVncConsole` protocol/disconnect；ISO create body（已有则更新断言）
- E2E：镜像上传流程（mock uploads + mock upload_url）；VM ISO 提交体；控制台打开且 `protocol=novnc`
- 门禁：`cd frontends/console && npm run verify`

### 手工联调（isolated）

- Gateway：`http://<node-ip>:30080`
- CDI uploadproxy：`https://<node-ip>:31001`（开发环境可能需信任自签证书）
- Running VM：Network 面板可见 `.../console/{session}?token=...` WebSocket `101`
- 不出现旧错误：`upgrade token not found in Connection header`

## 7. 进度记录

实现完成后按 development-record skill 更新：

- `frontends/console/docs/sprints/SPRINT-P22-core-joint-debug.md`（或当前 sprint 文件）
- 必要时一行更新 `CONSOLE-TASK-PLAN.md`
- **不**修改冻结的设计规范 2.0 正文

## 文件影响预估

| 文件 | 变更 |
|------|------|
| `src/lib/image-upload.ts` | 新增：会话 + 直传 + 轮询 helper |
| `src/routes/_authenticated/images/index.tsx` | 文件选择、进度、轮询、去掉 storage_class 主路径 |
| `src/components/instances/InstanceVncConsole.tsx` | `novnc`、错误原文、过期重连 |
| `src/routes/_authenticated/instances/$instanceId.tsx` | running 门禁 |
| `src/routes/instances/console/$instanceId.tsx` | 必要时传 protocol / 重连入口 |
| `src/components/instances/InstanceVncConsole.test.tsx` | 断言 `novnc` |
| `e2e/images.spec.ts`、`e2e/instances.spec.ts` | 直传与 protocol 断言 |
| sprint 记录 | 执行记录追加 |

VM 创建页 `instances/index.tsx` 仅在发现缺口时小改。
