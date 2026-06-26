# SPRINT-SCB-02 · 认证与设置（规范合规）

> 状态：**✅ 完成**（2026-06-25）  
> 验收：`npm run verify` 通过

---

## 1. 目标

对齐登录、OIDC 回调、设置与 API Key 页面至冻结规范。

| 路由 | 页面模板 |
|------|----------|
| `/login` | 模板 E 表单页（单主操作 OIDC） |
| `/login/callback` | 加载 / 错误 / 缺参三态 |
| `/settings` | 设置摘要 + 危险操作分离 |
| `/settings/api-keys` | 模板 B 列表 + 模板 E 创建表单 |

**Arco**：`Card`、`Button`、`Form`、`Modal`、`Table`（经 `CursorTable`）、`Result`、`Spin`、`Grid`、`Space`。

---

## 2. 变更清单

### 2.1 新增

| 路径 | 说明 |
|------|------|
| `src/components/shell/AuthCenterLayout.tsx` | 无壳层页居中布局 |
| `e2e/auth-settings.spec.ts` | 设置 → API Key E2E |

### 2.2 修改

| 路径 | 变更摘要 |
|------|----------|
| `src/routes/login.tsx` | `AuthCenterLayout` + `ApiErrorAlert` 错误态 |
| `src/routes/login.callback.tsx` | loading / missing / error 三态；不再静默跳回登录 |
| `src/routes/_authenticated/settings/index.tsx` | 退出 `Modal.confirm`；`navigate` 替代 Link 套 Button |
| `src/routes/_authenticated/settings/api-keys.tsx` | `CursorTable` 三态；撤销危险确认强化；创建密钥 Modal 文案 |

---

## 3. 验收

```bash
cd frontends/console && npm run verify
# unit 24 ✓ | e2e 9 ✓ | build ✓
```

---

## 4. 评审自检

- [x] 登录页单一 `primary` 按钮
- [x] API Key 列表 loading / empty / error
- [x] 撤销 Key、退出登录均有 `Modal` 确认
- [x] Arco + Token + Tailwind 布局

---

## 5. 下一批

**SCB-03** 概览 Dashboard `/`
