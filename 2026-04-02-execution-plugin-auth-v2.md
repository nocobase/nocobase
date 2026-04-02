# Execution Plan

## 原始计划

# plugin-auth v2 首版方案（优化版）

## Summary
首版目标仍然是“前台认证主链路跑通”，但方案需要再补两点约束，避免后面返工：

1. `plugin-auth` 的 v2 版不仅要把 `/signin` 做出来，还要成为 **v2 的公共路由基线插件**，负责认证页、token 注入、401 跳转这整条链路。
2. 迁移时要严格按两份文档的方向执行：**新增 `client-v2` 插件入口**，并且 **关键页面/组件按需加载**，不要把 v1 的同步页面注册方式原样搬过去。

完成后，未登录访问 `/v2/` 应稳定进入认证页；basic auth 可完成登录；401 能回登录页；认证公共页不再被 `CurrentUserProvider` 重复重定向。

## Key Changes
### 1. 建立标准 `client-v2` 插件入口与包出口
- 为 `@nocobase/plugin-auth` 新增：
  - `src/client-v2`
  - `client-v2.js`
  - `client-v2.d.ts`
- `src/client-v2/index.ts` 负责对外导出；`src/client-v2/plugin.tsx` 作为插件主入口。
- `package.json` 不需要改包名，但实现上要确保 v2 入口只依赖 `@nocobase/client-v2`，不再从 `@nocobase/client` 引页面运行时能力。
- 首版不迁移后台 settings 页面，因此 v2 插件只暴露前台认证能力。

### 2. 插件主入口只做“轻注册”，页面全部按需加载
- 按迁移文档要求，认证路由统一用 `router.add(..., { componentLoader })` 注册，避免首屏同步加载所有认证页面。
- 至少以下页面使用 `componentLoader`：
  - `AuthLayout`
  - `SignInPage`
  - `SignUpPage`
  - `ForgotPasswordPage`
  - `ResetPasswordPage`
- 若 basic auth 表单、语言切换、品牌区块较重，也优先拆到独立模块，避免 `plugin.tsx` 变重。
- 不再在插件入口里静态 import v1 页面或 v1 form schema。

### 3. 认证路由成为 v2 标准免鉴权路由
- 注册一个 pathless `auth` 父路由承载 `AuthLayout`，其下子路由：
  - `/signin`
  - `/signup`
  - `/forgot-password`
  - `/reset-password`
- 这些路由全部标记 `skipAuthCheck: true`。
- 所有跳转都继续使用相对 v2 basename 的路径，即代码里仍写 `/signin`、`/admin`，不手写 `/v2/signin`。
- query 参数约定保持兼容：
  - `/signin?redirect=...`
  - `/signup?name=...`
  - `/forgot-password?name=...`
  - `/reset-password?name=...&resetToken=...`

### 4. 调整 client-v2 的当前用户鉴权逻辑
- `CurrentUserProvider` 需要从“所有页面都先 `/auth:check`”改成“非 `skipAuthCheck` 页面才做 `/auth:check`”。
- 判断方式统一使用 `app.router.isSkippedAuthCheckRoute(location.pathname)`，不要再写死 `/signin` 白名单。
- provider 的行为收敛为：
  - 命中免鉴权页：直接放行 children，不请求 `/auth:check`
  - 非免鉴权页：
    - `/auth:check` 返回有 user：写入 `flowEngine.context.user`
    - 无 user：跳 `/signin?redirect=当前路径`
    - 请求异常：仅在非免鉴权页做跳转
- 这里要顺手补一个 v2 的 `useCurrentUserContext` / `CurrentUserContext` 导出评估：
  - 首版不强制新增公共 hook
  - 但要保证 auth 页面自身不再依赖 v1 的 `refreshAsync` 语义

### 5. 前台认证页面全部用 v2 原生 React + antd 重写
#### AuthLayout
- 继续展示：
  - 系统标题（`useSystemSettings`）
  - 语言切换
  - 底部品牌区
- `SwitchLanguage`、`PoweredBy` 如果 v2 无现成实现，放在 `plugin-auth/src/client-v2/components` 内做最小等价版本，不依赖 v1。
- authenticator 列表请求下沉到 `AuthenticatorsContextProvider`，行为与 v1 保持一致。

#### SignInPage
- 按 authenticator 渲染 tab。
- basic auth 表单字段与校验保持兼容：
  - `account`
  - `password`
- 登录成功后：
  - 调 `api.auth.signIn(values, authenticatorName)`
  - 不再依赖 `useCurrentUserContext().refreshAsync()`
  - 直接 `navigate(redirect || '/admin', { replace: true })`
- 页面标题如需保留，可在组件内直接设置 document title；不要为了标题能力引回 v1 hook。

#### SignUpPage
- 根据 `name` 查 authenticator。
- 只有当：
  - 找到 authenticator
  - 该 auth type 注册了 `SignUpForm`
  - `options.allowSignUp === true`
  才允许进入。
- 否则直接进入 not-found 结果页或 fallback route。

#### ForgotPasswordPage
- 只有 `enableResetPassword` 为真时可进入。
- 提交时继续调用 `api.auth.lostPassword(values)`。
- 成功后提示并清空表单。

#### ResetPasswordPage
- 进入页先 `checkResetToken(resetToken)`。
- token 缺失/失效时展示过期态和回登录按钮。
- 提交成功后提示并回 `/signin`。

### 6. 迁移 auth type 扩展机制，但明确 v2 兼容边界
- 继续保留 `authTypes.register()` 机制和 `AuthOptions` 类型。
- 但首版要明确一条兼容规则：**注册到 v2 的自定义组件必须是 v2 可运行的 React 组件**。
- 也就是说：
  - basic auth 首版保证可用
  - 其他自定义 auth type 如果仍返回 v1 组件，不在首版兼容范围内
- 这条规则要写进类型注释或实现注释里，避免后续误会“注册就一定能在 v2 用”。

### 7. 迁移 401 interceptor
- 复用 v1 语义，但改成 v2 app 版本：
  - 处理 `x-new-token`
  - 识别认证相关错误码
  - 清空 token / role / authenticator
  - 非认证页且非免鉴权页时跳 `/signin?redirect=...`
  - 已在认证页时不重复跳
- 这里建议保留 debounce 跳转逻辑，避免多个并发 401 导致连续 navigate。
- interceptor 安装时机放在 plugin `load()` 内，与路由注册同一阶段完成。

### 8. AuthProvider 也要迁过去，不能漏
- `AuthProvider` 负责读取 URL 上的 `token`、`authenticator` 参数并写入本地 auth 状态。
- 这是登录跳转链路的一部分，不能只迁路由不迁它。
- v2 版继续保持：
  - 读 query
  - `setToken`
  - `setAuthenticator`
  - 清掉 URL 中的敏感 query 参数并 replace 导航

### 9. 首版明确不做的内容
- 不迁移后台 settings 页面：
  - `auth.authenticators`
  - `security.token-policy`
- 不迁移依赖 v1 `SchemaComponent` 的后台管理表单。
- 不做“v1 auth 自定义组件自动兼容到 v2”的适配层。
- 不把 `plugin-auth` 作为 v1/v2 双运行时共享页面层处理，避免后续继续耦合。

## Public Interfaces / Types
- 新增 `@nocobase/plugin-auth/client-v2` 入口。
- `src/client-v2` 对外导出：
  - `default` / `PluginAuthClientV2`
  - `AuthLayout`
  - `AuthenticatorsContextProvider`
  - `AuthenticatorsContext`
  - `useAuthenticator`
  - `useRedirect`
  - `useSignIn`
  - `AuthOptions`
  - `Authenticator`
- `AuthOptions` 的语义保持不变，但实现说明里补充：传入的组件必须是 v2 兼容组件。
- 不新增 `refreshAsync` 风格的新全局用户态接口；首版避免把认证页面和当前用户 provider 重新强耦合。

## Test Plan
- 插件加载
  - 启用 `plugin-auth` 后，`pm:listEnabledV2` 能返回其 v2 bundle。
  - `/v2/signin` 不再 404。
- 路由与免鉴权
  - `/signin`、`/signup`、`/forgot-password`、`/reset-password` 命中 `skipAuthCheck`。
  - 这些页面不再触发 `CurrentUserProvider` 循环跳转。
- 登录
  - basic auth 登录成功后，token 与 authenticator 被写入。
  - 有 `redirect` 参数时按参数跳转；无参数默认 `/admin`。
- URL token 注入
  - 带 `?token=...&authenticator=...` 进入认证页时，`AuthProvider` 能落 token 并清理 URL。
- 注册/找回/重置密码
  - `allowSignUp`、`enableResetPassword` 条件控制与 v1 一致。
  - `resetToken` 校验失败时显示过期态。
- 401 拦截
  - 受保护页 token 失效时回 `/signin?redirect=...`
  - 认证页本身不重复跳、不抖动
  - 多个并发 401 时只触发一次主跳转
- 懒加载
  - 认证页面 bundle 不应全部进入首屏主包；至少路由页面走 `componentLoader`
- 回归
  - 已登录访问 `/v2/admin` 仍能正常渲染
  - v1 `client` 的 `plugin-auth` 行为不受影响

## Assumptions
- 首版成功标准是“basic auth 主链路在 v2 可用”，不是“plugin-auth 全量后台功能完成迁移”。
- 认证页 UI 允许与 v1 不完全一致，但接口行为、URL 形状和跳转语义必须兼容。
- `skipAuthCheck` 将作为 v2 公共页的统一机制，后续其他公共插件也复用这套做法。
- 后台 settings 页迁移留到第二阶段单独处理，不为首版预埋复杂兼容层。

## To do list

- [x] 创建 plugin-auth 的 client-v2 入口和基础导出
- [x] 实现 client-v2 认证插件主入口、路由注册和拦截器安装
- [x] 实现认证公共组件与页面（layout、provider、sign in/up、forgot/reset）
- [x] 调整 client-v2 CurrentUserProvider，支持 skipAuthCheck 短路
- [x] 本地执行 lint 与关键路径验证
