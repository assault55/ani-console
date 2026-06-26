# OpenAPI v1 表单组件类型核对

## 核对范围

本轮按 `../../openapi/v1.yaml` 的 requestBody / query 参数类型核对 Console 表单控件。重点不是“字段是否存在”，而是字段类型是否使用合适组件：

| OpenAPI 类型 | 推荐组件 |
| --- | --- |
| `string` | `Input` |
| `string + format: date-time` | `DatePicker showTime` / `RangePicker showTime` |
| `integer` / `number` | `InputNumber` |
| `boolean` | `Switch` |
| `enum` | `Select` |
| `array` | `Select mode="multiple"`、动态行或 JSON 数组 TextArea |
| `object additionalProperties` | 动态 key/value 或 JSON TextArea |

## 已调整

1. `CreateAPIKeyRequest.expires_at`
   - OpenAPI：`type: string, format: date-time`
   - 调整前：普通 `Input`
   - 已调整：改为 `DatePicker showTime`，提交前转 ISO 字符串。

2. `/metering/usage` 查询参数 `start_time` / `end_time`
   - OpenAPI：`type: string, format: date-time`
   - 调整前：页面固定近 30 天，无表单
   - 已调整：增加 `RangePicker showTime`，并补 `group_by` Select、`resource_type` Input。

3. `CreateInstanceConsoleSessionRequest.protocol`
   - OpenAPI：`string enum [console, vnc, novnc, serial]`
   - 已修复：实例详情页不再固定提交 `novnc`。
   - 调整结果：增加 Console Session Modal，使用 `Select` 选择 protocol。

4. `CreateInstanceExecSessionRequest`
   - OpenAPI：`command` array、`tty` boolean、`rows/cols` integer、`container` string nullable
   - 已修复：实例详情页不再固定提交 `/bin/sh`、`tty=true`、`rows=24`、`cols=80`。
   - 调整结果：增加 Exec Session Modal，`command` 用 TextArea 按行输入，`tty` 用 Switch，`rows/cols` 用 InputNumber。

5. `K8sClusterProxyRequest.method`
   - OpenAPI：`string enum [GET, POST, PUT, PATCH, DELETE]`
   - 已修复：K8s 详情页不再固定提交 `GET`。
   - 调整结果：API Proxy 表单增加 `method` Select；`query` / `body` 继续以 JSON TextArea 覆盖 object 类型。

## 已核对通过

- API Key：`name` Input、`scopes` TextArea 数组输入、`rate_limit_rpm` InputNumber，`expires_at` DatePicker showTime。
- Instance：`kind` enum 使用 Select，`replicas` / `gpu.count` 使用 InputNumber，`auto_start` / `termination_protection` 使用 Switch，`sandbox_config.network_egress_policy` 使用 Select。
- Network：VPC/Subnet CIDR 使用 Input，Route `next_hop_type` 使用 Select，LB `scheme` 使用 Select，复杂规则/listeners 使用 JSON TextArea。
- Storage：Volume/Filesystem size 使用 InputNumber，protocol/access_mode 使用 Select，Object metadata size 使用 InputNumber。
- Vector Store：`dimension` / `top_k` 使用 InputNumber，`metric` 使用 Select，`filter` / `documents` 使用 JSON TextArea。
- Observability Alert Rule：`severity` 使用 Select，`enabled` 使用 Switch，labels/annotations 使用 JSON TextArea。
- K8s NodePool：`node_count` / `gpu.count` 使用 InputNumber。
- Registry：Project `public` 使用 Switch，permission actions 使用 multiple Select。
- Secret：`type` 使用 Select，`data` 使用动态 key/value。
- Encryption：`algorithm` 使用 Select，revoke `reason` 使用 TextArea。

## 后续增强项

- `InstanceLifecycleRequest` 当前页面只提供 start/stop/delete 等轻操作；`resize`、`snapshot`、`attach_volume`、`rollback` 等需要额外字段的动作尚未做成完整 Modal。该项属于实例操作扩展，不是本轮已存在固定值表单的直接修复。

## 登录 / 登出核对

- 登录：已有 OIDC begin / callback token exchange，符合 `BeginOIDCLoginRequest`、`CompleteOIDCLoginRequest`。
- 登出：已修复。原设置页按钮将 `LogoutRequest.jti` 写死为 `current`，不符合 `v1.yaml` 中“从当前 AccessToken claims 读取 JWT ID”的要求。
- 调整结果：新增从 access token payload 解析 `jti` 的工具方法；设置页和顶栏登出入口统一使用真实 `jti` 调用 `/auth/logout`，调用结束后清理本地 token 并跳转 `/login`。

## 验证记录

- 2026-06-26：`npm run typecheck` 通过。
- 2026-06-26：`npm run test` 通过，10 个测试文件、29 个测试。
- 2026-06-26：`npm run build` 通过。
- 2026-06-26：修复实例 Console/Exec、K8s Proxy 的固定 requestBody 字段；`npm run typecheck` 通过。
- 2026-06-26：`npm run test` 通过，10 个测试文件、29 个测试。
- 2026-06-26：`npm run build` 通过。
- 2026-06-26：修复登出 `jti` 写死问题，改为从 access token claims 读取；新增 auth store 单元测试。
- 2026-06-26：`npm run typecheck` 通过。
- 2026-06-26：`npm run test` 通过，10 个测试文件、31 个测试。
- 2026-06-26：`npm run build` 通过。

真实后端写入类接口不在本轮直接调用；只调整前端表单组件和请求参数转换。
