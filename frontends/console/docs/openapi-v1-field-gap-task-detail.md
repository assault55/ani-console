# OpenAPI v1 字段级查漏任务详情

## 背景

上一轮主要核对了 Core API operation 是否有页面入口和调用覆盖，但没有完整核对 requestBody / response schema 的字段、约束和 UI 展示。实际页面中仍存在大量“只填必填最小字段”或“固定默认值”的实现，和 `design/openapi/v1.yaml` 的字段定义不一致。

本文件用于后续按字段级别补齐 Console 实现。执行原则仍然是：先更新文档，再改代码，再测试；真实后端调用失败先记录并跳过，不伪造成功。

## 校验方案

当前项目没有引入专门的 schema 校验库，且已有 Arco Form。建议先用最小依赖方案：

- 表单层：使用 Arco `Form.Item rules` 做必填、长度、正则、数字范围、枚举选择。
- 类型层：继续使用 `src/api/core-schema.d.ts` 里的 generated types 约束提交 body。
- 工具层：新增轻量 `src/lib/validators.ts`，只放通用规则函数，例如 `requiredString`、`maxLength`、`integerRange`、`patternRule`、`dateTimeRule`。
- 布局层：复杂创建表单统一使用 Modal + 垂直 Form；字段超过 5 个时拆成分组，避免所有操作都挤在表格行内。
- 后续如字段校验继续扩大，再考虑引入 `zod` 或基于 OpenAPI 自动生成 runtime validators；当前不建议先加依赖。

推荐字段映射：

| OpenAPI 约束 | UI 控件 / 校验 |
| --- | --- |
| `required` | `Form.Item required` + rules |
| `maxLength/minLength` | `Input maxLength` + rules |
| `pattern` | rules `match` 或自定义 validator |
| `enum` | `Select` / `Radio.Group` |
| `integer minimum/maximum` | `InputNumber` |
| `boolean` | `Switch` / `Checkbox` |
| `array minItems` | `Select mode="multiple"` 或可增删列表 |
| `format: date-time` | `DatePicker showTime`，提交前转 ISO 字符串 |
| `additionalProperties: string` | key/value 动态行 |

## P0 - API Key 字段与布局补齐

状态：已实现，测试完成；真实后端只读验证被认证阻塞

当前文件：

- `src/routes/_authenticated/settings/api-keys.tsx`

契约来源：

- `POST /auth/api-keys`
- `CreateAPIKeyRequest`
- `CreateAPIKeyResponse`
- `APIKeyInfo`

### 当前问题

1. 已修复：创建 API Key 原先只展示 `name` 一个字段。
2. 已修复：提交 body 原先使用 `scopes: ['*']`，不符合契约正则：
   `^scope:[a-z0-9_-]+:(\*|[a-z0-9_-]+)$`
3. 已修复：补齐 `user_id`、`scopes`、`rate_limit_rpm`、`expires_at` 输入。
4. 已修复：列表补齐 `scopes`、`rate_limit_rpm`、`expires_at`、`last_used_at`、`is_active`。
5. 已修复：创建成功弹窗补充 `key_id`、`key_prefix`，并保留一次性保存提示。
6. 已修复：创建表单按基础信息、权限范围、限制与过期分组。

### 需要实现的字段

创建表单：

| 字段 | 契约 | UI / 校验 |
| --- | --- | --- |
| `name` | required, string, maxLength 128 | Input，必填，最多 128 |
| `user_id` | optional string | Input，可空，提示为空使用当前用户 |
| `scopes` | required array, minItems 1, item pattern | Select multiple 或 Tags 输入；每项校验 `scope:<domain>:<action>` |
| `rate_limit_rpm` | integer 1-10000, default 60 | InputNumber，默认 60，范围 1-10000 |
| `expires_at` | date-time | DatePicker showTime，可空，提交 ISO |

列表字段：

| 字段 | 展示建议 |
| --- | --- |
| `name` | 主列 |
| `key_prefix` | 次列 |
| `scopes` | Tag 列，过多时折叠 |
| `rate_limit_rpm` | 数值列 |
| `is_active` | 状态 Tag |
| `created_at` | 时间列 |
| `expires_at` | 时间列，空显示“永不过期” |
| `last_used_at` | 时间列，空显示“从未使用” |

创建结果：

| 字段 | 展示建议 |
| --- | --- |
| `key_id` | Descriptions |
| `key_prefix` | Descriptions |
| `key_value` | 只读 TextArea，强调仅显示一次 |

### 推荐交互布局

- 页面顶部：`PageHeader` + “创建 API Key”主按钮。
- 表格：展示完整字段，危险操作“撤销”放在最后一列。
- 创建 Modal：分为“基础信息”“权限范围”“限制与过期”三组。
- 创建成功 Modal：只做保存密钥，不放其他操作；用户点击“已保存”后关闭。

### 测试

- 单元测试：scope pattern validator。
- E2E：打开 API Key 页面，创建 Modal 可见完整字段，scope 非法时不能提交。
- 真实后端：优先只读 `GET /auth/api-keys`；创建 API Key 属于真实状态变更，执行前需明确是否允许。

验证记录：

- 2026-06-26：`npm run typecheck` 通过。
- 2026-06-26：`npm run test` 通过，新增 `src/lib/validators.test.ts`，总计 10 个测试文件、29 个测试。
- 2026-06-26：`npm run build` 通过。
- 2026-06-26：真实后端只读验证 `GET /api/v1/auth/api-keys` 返回 401：
  `invalid or expired token`。已按规则记录并跳过真实后端字段验证；未执行创建 API Key，避免修改真实后端状态。

## P0 - 通用字段校验基础设施

状态：已实现，测试完成

新增或整理：

- `src/lib/validators.ts`
- `src/lib/validators.test.ts`

建议包含：

- `scopePattern = /^scope:[a-z0-9_-]+:(\*|[a-z0-9_-]+)$/`
- `bucketNamePattern = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/`
- `requiredTrimmed(message)`
- `maxLengthRule(max)`
- `integerRangeRule(min, max)`
- `dateTimeToISOString(value)`

实现记录：

- 已新增 `src/lib/validators.ts`。
- 已新增 `src/lib/validators.test.ts`。
- 当前实现包含 scope 校验、bucket name pattern、必填字符串、最大长度、整数范围、可选 ISO 日期时间转换。

目标：

- 避免每个页面重复写正则和数字范围。
- 保持轻量，不引入新依赖。
- 与 Arco Form rules 配合，而不是替代 Arco Form。

## P1 - 实例创建字段补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/instances/index.tsx`

契约：

- `CreateInstanceRequest`

缺口：

- 已修复：创建表单补齐 `image`、`cpu`、`memory`、`auto_start`、`boot_image`、`ssh_username`、`ssh_key_ref`、`termination_protection`、`gpu`、`replicas`、`sandbox_config`。
- 已修复：按 `kind` 动态展示 VM / container / gpu_container / sandbox 字段。
- 已修复：提交 body 使用 `CreateInstanceRequest` 约束，并补齐契约要求的 `replicas`。
- 已修复：`sandbox_config` 已按 `SandboxConfig` 拆成 `runtime_class`、`session_timeout`、`network_egress_policy` 控件。

建议：

- 按 `kind` 动态展示字段：
  - VM：`boot_image`、`ssh_username`、`ssh_key_ref`、`cpu`、`memory`。
  - container：`image`、`cpu`、`memory`、`replicas`、`auto_start`。
  - gpu_container：container 字段 + `gpu.vendor/model/count`。
  - sandbox：`sandbox_config`。
- `kind` 与 `instance_type` 不需要同时暴露；如后端兼容字段需要传，也必须和 `kind` 一致。

## P1 - 网络创建字段补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/networks/vpcs/index.tsx`
- `src/routes/_authenticated/networks/subnets/index.tsx`
- `src/routes/_authenticated/networks/security-groups/index.tsx`
- `src/routes/_authenticated/networks/load-balancers/index.tsx`
- `src/routes/_authenticated/networks/routes/index.tsx`

缺口：

- 已修复：VPC 创建表单暴露 `cidr`。
- 已修复：Subnet 创建表单暴露 `vpc_id`、`cidr`、`gateway`，不再硬编码 `default`。
- 已修复：Security Group 创建表单暴露 `description`、`rules` JSON。
- 已修复：Load Balancer 创建表单暴露 `vpc_id`、`subnet_id`、`scheme`、`listeners` JSON。
- 已修复：Route 创建表单暴露 `vpc_id`、`destination_cidr`、`next_hop_type`、`next_hop_id`、`description`。

建议：

- 统一网络资源创建 Modal，不再使用隐藏默认值。
- `vpc_id` 应来自 VPC 列表选择，不能硬编码 `default`。
- CIDR 暂用 pattern 或最小自定义校验，不新增 IP/CIDR 库。

验证记录：

- 2026-06-26：`npm run typecheck` 通过。
- 2026-06-26：`npm run test` 通过，10 个测试文件、29 个测试。
- 2026-06-26：`npm run build` 通过。
- 2026-06-26：本批网络接口均为创建/删除类真实状态变更，未执行真实后端写入验证；待明确允许后再调用。

## P1 - 存储创建字段补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/volumes/index.tsx`
- `src/routes/_authenticated/filesystems/index.tsx`
- `src/routes/_authenticated/objects/index.tsx`

缺口：

- 已修复：Volume 创建表单暴露 `size_gib`、`storage_class`。
- 已修复：Filesystem 创建表单暴露 `protocol`、`size_gib`。
- 已修复：Bucket 创建表单暴露 `region`、`access_mode`，并按 pattern 校验 `name`。
- 已修复：Object metadata `POST /objects` 已增加创建入口，覆盖 `bucket`、`key`、`size_bytes`、`content_type`。
- Upload：`bucket_id` 是 UUID 格式，但真实后端 bucket 列表 id 是否稳定为 UUID 需要继续验证。

建议：

- 存储类字段使用 `InputNumber` / `Select`。
- bucket name 按 OpenAPI pattern 校验。
- 已同时提供 `POST /objects` metadata 创建和 `/objects/upload` 上传入口；后续只需根据产品职责调整文案。

验证记录：

- 2026-06-26：`npm run typecheck` 通过。
- 2026-06-26：`npm run test` 通过，10 个测试文件、29 个测试。
- 2026-06-26：`npm run build` 通过。
- 2026-06-26：本批存储创建接口会修改真实后端状态，未执行真实后端写入验证；待明确允许后再调用。

## P1 - Vector Store 字段补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/vector-stores/index.tsx`

缺口：

- 已修复：创建表单补齐 `dimension` InputNumber 和 `metric` Select。
- 已修复：search 补齐 `top_k` InputNumber 和 `filter` JSON TextArea。
- 已修复：document insert 补齐单条文档的 `id`、`content`、`metadata`。
- 已修复：`documents` 支持 JSON 数组批量插入，覆盖 `content`、`metadata`、`id`。

建议：

- 创建 Modal 增加 `dimension` InputNumber 和 `metric` Select。
- Search 区增加 `top_k` InputNumber。
- filter 可先用 JSON TextArea，并做 JSON parse 校验。

## P1 - Observability 告警规则字段补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/observability/index.tsx`

缺口：

- 已修复：创建规则补齐 `name`、`promql`、`duration`、`severity`、`labels`、`annotations`、`enabled`。
- 已修复：编辑规则补齐可更新字段，不再只编辑 `promql`。
- 已修复：删除规则增加确认弹窗。
- 已整理：原页面压缩成单行实现，已重写为展开结构，便于后续维护。

建议：

- 创建/编辑共用同一个 Rule Form。
- `severity` 用 Select：`info` / `warning` / `critical`。
- `enabled` 用 Switch。
- `labels`、`annotations` 先用 key/value 动态行或 JSON TextArea。

## P2 - K8s 节点池 GPU 字段补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/k8s-clusters/index.tsx`

缺口：

- 已修复：节点池 create/update 补齐 `gpu.vendor`、`gpu.model`、`gpu.count`、`gpu.resource_name`。
- 已修复：`node_count` 改为 InputNumber，create 最小 1，update 最小 0。
- 已修复：节点池详情展示 GPU JSON 摘要。

建议：

- 节点池表单增加可选 GPU 分组。
- `node_count` 用 InputNumber，create 最小 1，update 最小 0。

## P2 - Registry 字段补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/registry/index.tsx`

缺口：

- 已修复：Project 创建补齐 `public` Switch。
- 已修复：Permission 设置补齐 `subject` 输入和 `actions` 多选。
- 已修复：Pull Secret 创建补齐 `name` 和 `namespace`。

建议：

- Project 创建增加 public Switch。
- Permission Modal 暴露 subject 和 actions 多选。
- Pull Secret Modal 暴露 name 和 namespace。

## P2 - Encryption / Secret 细节补齐

状态：已实现，测试完成；真实后端变更验证待确认

当前文件：

- `src/routes/_authenticated/encryption/index.tsx`
- `src/routes/_authenticated/secrets/index.tsx`
- `src/routes/_authenticated/secrets/$secretId.tsx`

缺口：

- 已修复：Encryption revoke 增加 reason Modal 输入，并提交 `reason`。
- 已修复：Secret 创建支持多 key/value 动态行，提交为 `data` object。
- 已修复：Secret type 为 `dockerconfigjson` / `tls` 时自动预填 `.dockerconfigjson`、`tls.crt`、`tls.key` 模板。

建议：

- Revoke Modal 增加 reason。
- Secret 创建支持动态 key/value 多行。
- 已补充 dockerconfigjson / tls 常用 key 模板；后续可继续增强为更细的字段向导。

## 操作布局调整总原则

当前不少页面把复杂操作压在表格行内，或创建 Modal 只展示一个字段。后续统一调整：

- 表格行内只保留轻操作：详情、编辑、删除/撤销。
- 创建类操作放页面右上角主按钮。
- 复杂操作使用 Modal / Drawer，不在行内直接提交固定值。
- 详情类信息使用 Drawer 或详情页，不用 alert 或纯 JSON 堆叠。
- 危险操作必须 `Modal.confirm`，按钮使用 `status="danger"`。
- 多字段表单按分组排列，避免一个 Modal 里无结构堆字段。

## 建议实施顺序

1. P0：API Key 字段与校验补齐。
2. P0：新增通用 validators，并补单元测试。
3. P1：存储和网络创建表单去硬编码默认值。
4. P1：Observability Rule Form 补全。
5. P1：Vector Store 创建/Search 字段补齐。
6. P2：实例创建按 kind 动态字段补齐。
7. P2：K8s GPU 字段、Registry 权限/Pull Secret 字段补齐。
8. P2：Secret 多 key/value、Encryption revoke reason。

## 验收标准

- 每个涉及 requestBody 的 UI，必须能在表单中覆盖必填字段和主要可选字段。
- 所有 OpenAPI 明确的 `required`、`enum`、`minimum/maximum`、`minLength/maxLength`、`pattern` 至少在前端有基础校验。
- 列表和详情应展示 response schema 中的关键字段，不只展示 name/id。
- 不再提交明显违反契约的值，例如 API Key `scopes: ['*']`。
- 每批完成后运行：
  - `npm run typecheck`
  - `npm run test`
  - 相关 E2E；如 E2E 环境阻塞，记录原因。
- 真实后端验证只读优先；会产生真实状态变更的创建/删除/PATCH，执行前需要明确确认。
