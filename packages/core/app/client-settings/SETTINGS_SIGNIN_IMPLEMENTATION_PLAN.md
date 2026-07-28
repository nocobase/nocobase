# Client V2 Settings 独立登录页实施计划

## 1. 背景与目标

当前独立 Settings SPA 在访问受保护的 `/settings/**` 页面且用户未登录时，会整页跳转到 Client V2 Admin 的登录页：

```text
/v/signin?redirect=<原 Settings 地址>
```

目标是让 Settings SPA 自己承载完整的 Client V2 登录流程：

```text
/settings/signin?redirect=<原 Settings 地址>
```

这不是复制一份简化登录页，而是在 Settings SPA 中复用 Client V2 已有的 `AuthProvider`、`AuthLayout`、`SignInPage`、认证器注册表和认证插件 lane，使账号密码、短信、注册、密码重置、外部认证及 2FA 的功能和原 Client V2 登录页保持一致。

普通 Client V2 Application 仍使用 `/v/signin`；Client V1 的登录页和 `/admin/settings/**` 也保持不变。

## 2. 成功标准

完成后必须同时满足：

1. 主应用 Settings 登录路由为 `/settings/signin`。
2. 子应用 Settings 登录路由分别为：
   - `/apps/:app/settings/signin`
   - `/_app/:app/settings/signin`
3. 配置 `APP_PUBLIC_PATH=/nocobase/` 时，以上地址统一位于 `/nocobase/` 下。
4. `/v/signin`、`/v/apps/:app/signin` 及自定义 modern prefix 对应的登录地址完全不变。
5. Settings 登录页使用原 Client V2 登录界面和认证器注册机制，不出现 Settings 顶栏、侧栏或 Admin Layout。
6. 未登录、会话过期、401、退出登录和修改密码后重新登录均进入当前 Application 对应的登录页。
7. 登录成功后准确回到原 Settings 深链，并保留 query 和 hash。
8. 账号密码、短信、注册、忘记密码、重置密码、2FA、OIDC、SAML 和 CAS 均形成闭环。
9. 非法、跨域或跨应用 `redirect` 不被接受，回退到当前应用作用域的 Settings 根页。
10. Settings 登录文档仍由独立 Settings 构建产物提供，assets、CDN 和缓存策略不变。

## 3. 不在范围内

- 不改变 Client V1 登录页、`/admin/settings/**` 或 V1 Email OAuth callback。
- 不把普通 Client V2 Admin 的登录页迁出 `/v`。
- 不增加新的认证器协议、插件 lane、公开 Application option 或公开路由 API。
- 不改变 token、session、认证 API payload、数据库结构或认证器配置结构。
- App SSO 的 `/app-sso` 启动页、IDP OAuth interaction 页面继续属于原 Portal；只验证它们不会把 Settings 登录链路错误带到其他 SPA。
- 不为 Settings SPA 单独复制认证组件或认证器实现。

## 4. 当前实现与缺口

### 4.1 Settings 仍指向 `/v/signin`

`packages/core/client-v2/src/authRedirect.ts` 中的 `getV2SigninPath()` 会把独立 Settings Application 映射到 modern client prefix 下的登录页。Settings 的初始鉴权失败、运行时 401、退出和修改密码都会间接使用该逻辑。

现有测试也明确锁定了 `/v/signin`：

- `packages/core/client-v2/src/__tests__/authRedirect.test.ts`
- `packages/core/client-v2/src/__tests__/settings-layout-root.test.tsx`
- `packages/plugins/@nocobase/plugin-auth/src/client-v2/__tests__/plugin.test.tsx`
- `packages/plugins/@nocobase/plugin-users/src/client-v2/__tests__/plugin.test.ts`

### 4.2 Settings Router 当前丢弃认证路由

`SettingsRouterManager` 目前只接受：

- `settings.*`
- `settingsDetails.*`
- `not-found`

因此同一条 `pm:listEnabledV2` 插件 lane 虽然会加载 `plugin-auth` 和 2FA 插件，但下列路由会被过滤：

- `auth.signin` → `/signin`
- `auth.signup` → `/signup`
- `auth.forgotPassword` → `/forgot-password`
- `auth.resetPassword` → `/reset-password`
- `2fa.verify` → `/2fa`

### 4.3 登录组件包含根路径硬编码

以下 Client V2 组件直接使用 `/signin`、`/signup` 或 `/forgot-password`：

- `BasicSignInForm.tsx`
- `BasicSignUpForm.tsx`
- `ForgotPasswordPage.tsx`
- `ResetPasswordPage.tsx`
- `TwoFactorAuthLayout.tsx`

如果只注册 `/settings/signin` 而不处理这些链接，注册、忘记密码、重置密码和 2FA 异常回退会离开 Settings SPA。

### 4.4 SettingsShell 会包裹所有路由

`SettingsApplication` 当前把 `SettingsShell` 注册为全局 Provider。即使认证路由成功注册，登录页也会显示 Settings 精简顶栏。认证路由需要直接渲染原 `AuthLayout` 或 `TwoFactorAuthLayout`，不经过 Settings 顶栏和设置侧栏。

### 4.5 2FA 服务端返回固定 `/2fa`

2FA 服务端登录中间件返回：

```text
/2fa?redirect=<target>
```

普通 V1/V2 客户端依靠各自 basename 解析它。Settings SPA 需要在 Client V2 2FA 响应拦截器中，根据当前已注册的 `2fa.verify` 路由把它映射为当前 Settings 作用域下的 `/settings/2fa`。服务端响应结构和固定路径保持不变。

### 4.6 外部认证失败回跳无法识别 Settings shell

SAML、OIDC 和 CAS 的服务端 callback 使用 `resolveSigninPrefix()` 判断失败后应返回 V1 还是 modern V2 登录页。该判断目前只识别 modern prefix，不识别 `/settings/**`，因此外部认证失败时可能回到 `/signin`，而不是 `/settings/signin`。

外部认证成功时，回调目标仍应是原 Settings 深链，由 Settings SPA 中已存在的 `AuthProvider` 消费 callback 中的 token。

### 4.7 SSO 自动跳转和 multi-space 仍按旧登录路径识别

- SAML/OIDC 自动跳转 Provider 只把精确的 `/signin` 当作登录页。
- multi-space 在早期请求阶段用固定认证路径列表判断是否跳过空间初始化。

两者都需要通过当前 Router 的认证路由或 Settings 认证路径识别 `/settings/signin` 等公共页面，避免登录页循环跳转或携带已失效的空间请求头。

## 5. 路由设计

### 5.1 路由名称保持不变

Settings SPA 继续使用插件已经注册的 route name，不引入新的认证路由协议：

| Route name | 普通 Client V2 path | Settings SPA path |
| --- | --- | --- |
| `auth.signin` | `/signin` | `/settings/signin` |
| `auth.signup` | `/signup` | `/settings/signup` |
| `auth.forgotPassword` | `/forgot-password` | `/settings/forgot-password` |
| `auth.resetPassword` | `/reset-password` | `/settings/reset-password` |
| `2fa.verify` | `/2fa` | `/settings/2fa` |

实际 document URL 再叠加 `APP_PUBLIC_PATH` 和当前应用作用域。

### 5.2 SettingsRouterManager 所有权

扩展 Settings Router 的内部所有权规则：

- 保留现有 `settings.*`、`settingsDetails.*` 和 fallback。
- 接受 `auth`、`auth.*`、`2fa` 和 `2fa.*`。
- route name、组件 loader、`skipAuthCheck` 和其他路由元数据保持不变。
- 对认证族的绝对 path 加上 Settings route root；普通 `Application` 的 RouterManager 不做任何改动。
- 不接受同一插件 lane 中的 Admin、public、mobile、multi-portal 或其他非认证路由。

路径根必须从当前 Settings Manager 动态获取，不重复硬编码 `/settings`，以保证内部实现仍与 Settings route namespace 一致。

### 5.3 认证组件内部导航

在 `plugin-auth/src/client-v2` 内增加不从包入口导出的内部路径解析逻辑：

- 优先从 `app.router` 中已注册的 route name 获取当前 path。
- 普通 Client V2 得到 `/signin` 等原路径。
- Settings Application 得到 `/settings/signin` 等重写后的路径。
- Link、Navigate、延迟跳转和错误回退统一使用解析结果。
- `redirect`、`name`、`resetToken`、`authenticator` 和 `error` 等查询参数继续保留。

不新增 `@nocobase/client-v2` 或 `@nocobase/plugin-auth/client-v2` 的公开导出。

### 5.4 登录页壳

`SettingsShell` 根据当前 Router match 判断页面所属分支：

- `auth.*` 和 `2fa.*`：直接渲染 children，不渲染 Settings Header、User Center、Help、侧栏或 embed container。
- `settings.*` 和 `settingsDetails.*`：保持现有 Settings 壳行为。

登录页本身继续使用原 `AuthLayout`；2FA 继续使用原 `TwoFactorAuthLayout`。语言切换、系统标题、Powered by、主题 token 和认证器 UI 不复制、不分叉。

## 6. 跳转与会话设计

### 6.1 未登录和运行时 401

修改 `authRedirect.ts` 的独立 Settings 分支：

```text
主应用:
/settings/workflow?tab=list#recent
  -> /settings/signin?redirect=%2Fsettings%2Fworkflow%3Ftab%3Dlist%23recent

子应用:
/apps/demo/settings/workflow
  -> /apps/demo/settings/signin?redirect=%2Fapps%2Fdemo%2Fsettings%2Fworkflow
```

普通 Client V2 仍生成：

```text
/v/signin
/v/apps/demo/signin
```

`resolveV2SigninRedirect()` 的同源白名单也改为按当前 Application 接受自己的登录页，拒绝其他应用或其他 runtime 的登录地址。

### 6.2 默认回跳

当 `/settings/signin` 没有 `redirect` 参数时：

- Settings Application 默认回到当前作用域的 Settings 根页。
- 普通 Client V2 默认回到当前作用域的 `/admin`。

`SignInPage` 在规范化 `redirect` 时使用同一默认值，避免 UI 地址与最终提交行为不一致。

### 6.3 登录成功

- 本地账号、短信认证和 2FA 完成后继续使用 `useRedirect()`。
- 已校验的 `/settings/**` 目标使用 `window.location.replace()` 做 document navigation，避免被其他 SPA basename 重写。
- `redirect` 中的 query 和 hash 必须原样保留。
- 无效、跨域、协议相对、路径穿越或指向其他子应用的目标回退到当前 Settings 根页。

### 6.4 退出、修改密码和会话过期

继续复用现有 `redirectToV2Signin()` 调用点，通过 Application-aware URL 解析改变目标：

- Settings → 当前作用域的 `/settings/signin`
- 普通 V2 → 当前作用域的 `/v/signin`

覆盖入口包括：

- 初次 `/auth:check` 失败
- API 响应 401 / `EXPIRED_SESSION`
- User Center 退出登录
- 修改密码成功后重新登录

服务端若返回不属于当前 Application 的旧登录地址，客户端拒绝该地址并回退到当前 Application 的登录页。

## 7. 认证功能闭环

### 7.1 账号密码、注册和密码重置

- Basic 登录和注册继续调用同一 `apiClient.auth`。
- `/settings/signup`、`/settings/forgot-password`、`/settings/reset-password` 都保持 `skipAuthCheck`。
- 从 Settings 忘记密码页发起请求时，SDK 现有 `baseURL` 计算会以 `/settings` 为根生成邮件地址；增加测试锁定邮件链接为 `/settings/reset-password?...`。
- Reset token 检查失败时停留在 Settings reset 页面并显示原错误，不因 401 跳回登录页。
- 注册完成、重置完成和“返回登录”链接统一回到当前 Application 的 signin route。

### 7.2 短信认证

短信认证仍通过 `plugin-auth-sms` 注册的 `signInFormLoader` 和共享 `useSignIn()`，不增加专用适配。验证 OTP 获取、提交、自动注册和回跳均可在 Settings signin 中完成。

### 7.3 2FA

Client V2 2FA 插件执行以下内部适配：

1. Settings Router 接受并重写 `2fa.*` 路由。
2. 响应拦截器收到服务端 `/2fa?redirect=...` 后，使用当前 `2fa.verify` route path 构造 document URL。
3. 2FA 过期时的“重新登录”按钮使用当前 `auth.signin` route path。
4. 验证或绑定成功后复用 Application-aware `useRedirect()` 返回原 Settings 深链。

不修改 2FA API、服务端 302 payload 或 V1/V2 的原 `/2fa` 行为。

### 7.4 OIDC、SAML 和 CAS

成功流程：

- 登录按钮继续把规范化后的 Settings `redirect` 传给服务端。
- callback 成功后返回原 Settings 路径并携带 token。
- Settings SPA 的 `AuthProvider` 在 CurrentUserProvider 之前消费 token，清理 URL 后继续渲染目标页面。

失败流程：

- 扩展服务端共享 URL 解析，使其识别主应用、`apps` 和 `_app` 三类 Settings redirect。
- SSO 失败时返回当前作用域的 `/settings/signin`，保留 `redirect`、`authenticator` 和 `error`。
- 普通 V1/V2 的失败回跳规则保持不变。

如果 callback 目标原本包含 query/hash，构造 token/error 参数时必须使用 URL 解析和参数合并，不能直接追加第二个 `?` 或把参数追加到 hash 后面。

### 7.5 SAML/OIDC 自动跳转

自动跳转 Provider 用 Router match 识别 `auth.signin`，而不是只比较字面值 `/signin`：

- 在 `/settings/signin` 上不再次触发自动 SSO 检查。
- 在 Settings 受保护页面仍保持原自动跳转能力。
- 带 callback token 的目标页先交给 `AuthProvider` 消费 token，避免循环。

### 7.6 multi-space

multi-space 的早期请求判断同时识别普通和 Settings 认证公共路由：

- signin、signup、forgot-password、reset-password 和 2FA 页面不启动空间 bootstrap。
- 未登录请求不携带空间 header。
- 普通 `/v/**` 和已登录 Settings 页面原行为不变。

## 8. 后端与 API 边界

完整覆盖外部认证需要把后端改动严格限制在认证 URL 构造层，不修改认证业务逻辑或接口协议：

1. 扩展 `plugin-auth` 的共享 signin prefix 解析，使 Settings-shaped redirect 返回 Settings signin prefix。
2. SAML、OIDC、CAS callback 在目标已有 query/hash 时安全合并 token/error 参数，保证 Settings 深链不被破坏。

推荐方案：在共享 URL resolver 中识别已经通过安全校验的 Settings redirect，供 SAML、OIDC、CAS 继续复用。

不推荐的替代方案：

- 让 Gateway 根据 `redirect` query 再把 `/signin` 重定向到 `/settings/signin`：Gateway 会开始理解认证协议，耦合更高。
- 外部认证失败仍回 `/v/signin`：功能可用但不满足 Settings 自持完整登录流程。
- 为 Settings 新增独立认证 API 或 callback 协议：没有必要，且会扩大兼容面。

这些调整不改变 HTTP API payload、数据库或插件注册 API，但会扩展既有路由解析行为。开始实现前应按仓库 API 规则确认采用推荐方案；如果共享 helper 需要新增参数或导出，则必须单独提出 API 方案并获得确认，默认实现应优先保持现有函数签名。

2FA 不需要后端改动；其固定 `/2fa` 响应由 Client V2 插件根据当前 route record 做 Application-aware 映射。

## 9. 构建、Gateway 与开发环境

现有 Gateway 和开发代理已经按 `/settings/**`、`/apps/:app/settings/**`、`/_app/:app/settings/**` 返回 Settings HTML，因此认证子路由原则上不需要新的构建 stage 或代理分支。

仍需增加回归测试证明：

- `/settings/signin`、signup、forgot-password、reset-password 和 2FA 深链返回 Settings HTML。
- 两种子应用路径返回 Settings HTML。
- `APP_PUBLIC_PATH` 下的路径正确。
- `/settings/assets/**`、CDN asset prefix 和长期缓存策略不变。
- `/v/signin` 仍返回 Client V2 HTML；`/signin` 和 V1 页面分流不变。
- Settings dev proxy 接受全部认证 document path，且不会把 assets 当作 document 代理。

不新增 Settings 构建产物，继续使用：

```text
dist/client/settings/index.html
dist/client/settings/assets/**
```

## 10. 风险 TDD 实施顺序

### 阶段 A：先建立核心红测

先修改或新增测试，但不改实现，确认以下断言按预期失败：

1. `authRedirect.test.ts`
   - Settings 构造 `/settings/signin`。
   - 主应用、`apps`、`_app` 和 `APP_PUBLIC_PATH` 矩阵。
   - 普通 V2 `/v/signin` 锁定不变。
   - 同源、跨应用和恶意 redirect 校验。
2. `settings-application.test.ts`
   - Settings Router 接受并重写 `auth.*` 和 `2fa.*`。
   - Admin/public/mobile 路由仍被过滤。
3. `settings-layout-root.test.tsx`、`settings-shell.test.tsx`
   - 初始鉴权失败进入 Settings signin。
   - auth/2FA 页面不显示 Settings Header。
   - 普通 Settings 页面仍显示原壳。

红测必须因当前仍生成 `/v/signin`、过滤 auth route 或显示 SettingsShell 而失败；若没有按预期失败，先修正测试再进入实现。

### 阶段 B：核心路由和跳转实现

实现：

- Settings Router 认证路由所有权和 path 重写。
- Settings Application signin URL 构造。
- redirect 默认值、安全校验和跨应用约束。
- SettingsShell 对 auth/2FA 分支的壳隔离。

随后重跑阶段 A 的同一批测试并确认绿色。

### 阶段 C：plugin-auth 完整页面族

先为以下行为增加红测：

- 登录页内部注册链接和忘记密码链接。
- signup、forgot-password、reset-password 返回登录。
- 无 `redirect` 时 Settings 默认回 Settings 根页。
- 重置邮件链接位于 Settings route root。
- Reset token 失效不触发登录循环。

再把硬编码路径改为当前 Router route record 派生，并运行：

- `SignInPage.test.tsx`
- `hooks.test.tsx`
- `plugin.test.tsx`
- 新增的表单/页面路由测试
- `lostPassword.test.ts`
- `resetPassword.test.ts`

服务端测试按仓库规则串行运行。

### 阶段 D：退出、修改密码、401 和 multi-space

覆盖：

- `plugin-users` 的 SignOut 和 ChangePassword。
- `plugin-auth` 初始鉴权失败及运行时 401。
- multi-space 在 Settings 公共认证页跳过 bootstrap/header。
- 普通 V2 对应测试继续保持原断言。

### 阶段 E：2FA

先增加失败测试锁定：

- Settings 中服务端 `/2fa` 被映射到 `/settings/2fa`。
- query 中的原 redirect 完整保留。
- 2FA 过期回 `/settings/signin`。
- 普通 V2 仍为 `/v/2fa`，V1 行为不变。

实现 client-v2 插件适配后，运行 2FA client-v2 单测和相关服务端回归测试。

### 阶段 F：OIDC、SAML、CAS

先为每种认证增加成功和失败红测：

- Settings 成功 callback 回原深链并被 `AuthProvider` 消费 token。
- Settings 失败 callback 回当前作用域 `/settings/signin`。
- main、`apps`、`_app`、`APP_PUBLIC_PATH`。
- query/hash 与 callback 参数正确合并。
- 原 V1 和 `/v` callback 断言不变。
- SAML/OIDC 自动跳转在 Settings signin 上不会循环。

再实现共享服务端 URL 解析和两个自动跳转 Provider 的 route-aware 判定。

### 阶段 G：基础设施与构建回归

运行并补充：

- Gateway Settings 分流测试。
- Settings dev proxy 测试。
- Settings runtime scope/public path 测试。
- 独立 Settings Rsbuild 构建。
- 相关 build-stage 测试。

确认没有增加新的 HTML、assets 目录或复制协议。

## 11. 浏览器验收矩阵

### 11.1 基础路由

| 场景 | 入口 | 预期登录页 | 登录后 |
| --- | --- | --- | --- |
| 主应用 | `/settings/system-settings` | `/settings/signin` | 回原页 |
| `apps` 子应用 | `/apps/demo/settings/system-settings` | `/apps/demo/settings/signin` | 回原页 |
| `_app` 子应用 | `/_app/demo/settings/system-settings` | `/_app/demo/settings/signin` | 回原页 |
| public path | `/nocobase/settings/system-settings` | `/nocobase/settings/signin` | 回原页 |
| 普通 V2 | `/v/admin` | `/v/signin` | 回 `/v/admin` |

每个场景至少使用一个包含 query/hash 的深链并验证返回值完全一致。

### 11.2 功能验收

- Basic 正确密码、错误密码及错误提示。
- 多认证器 Tabs、无可用认证器空态。
- 注册成功后回 Settings signin。
- 忘记密码邮件指向 Settings reset 页面。
- Reset token 有效、无效和过期三种状态。
- SMS 获取验证码、登录和自动注册。
- 2FA 已绑定验证、首次绑定、过期后重新登录。
- OIDC、SAML、CAS 成功、取消/失败及 callback token 清理。
- SAML/OIDC auto redirect 无循环。
- 会话过期、401、退出和修改密码后重新登录。
- Email OAuth Settings callback 在登录后准确返回原 callback URL。

### 11.3 非回归验收

- `/v/signin` 全部原功能仍可用。
- Client V1 登录、`/admin/settings/**` 和 V1 Workflow/OAuth 不变。
- Settings 正常页面仍显示精简顶栏；auth/2FA 页面不显示。
- Workflow、AI、Mail OAuth 等 Settings 全宽详情的鉴权回跳不变。
- Portal task center、Mail manager、API docs、mobile 和 embed 路由不被 Settings Router 接管。

## 12. 预计触及范围

### 主仓库

- `packages/core/client-v2/src/authRedirect.ts`
- `packages/core/client-v2/src/settings-app/SettingsRouterManager.ts`
- `packages/core/client-v2/src/settings-app/SettingsShell.tsx`
- `packages/plugins/@nocobase/plugin-auth/src/client-v2/**`
- `packages/plugins/@nocobase/plugin-auth/src/server/utils/buildRedirectPath.ts`
- `packages/plugins/@nocobase/plugin-users/src/client-v2/**`
- 对应单元测试、Gateway/dev proxy 回归测试

### `packages/pro-plugins` 仓库

- `@nocobase/plugin-two-factor-authentication/src/client-v2/**`
- `@nocobase/plugin-auth-saml/src/client-v2/**`
- `@nocobase/plugin-auth-saml/src/server/actions/**`
- `@nocobase/plugin-auth-saml/src/server/__tests__/**`
- `@nocobase/plugin-auth-cas/src/server/actions/**`
- `@nocobase/plugin-auth-cas/src/server/__tests__/**`
- `@nocobase/plugin-multi-space/src/client-v2/**`

### 独立 OIDC 仓库

- `packages/pro-plugins/plugin-auth-oidc/src/client-v2/**`
- `packages/pro-plugins/plugin-auth-oidc/src/server/actions/**`
- `packages/pro-plugins/plugin-auth-oidc/src/server/__tests__/**`

实施前先确认各仓库工作树；若需要分别提交 PR，所有仓库使用同一分支名，并分别完成红绿测试和 lint。

## 13. 完成门槛

只有同时满足以下条件才可结束任务：

1. 所有风险行为均有先红后绿证据。
2. 主仓库、pro-plugins 和 OIDC 仓库相关单测通过。
3. Settings 独立构建成功。
4. Gateway/dev proxy/public path 测试通过。
5. 浏览器矩阵完成，至少留存关键 URL 和结果证据。
6. 所有触及的 TypeScript/TSX 文件执行 `yarn eslint --fix`，无新增 lint/type 错误。
7. 明确记录所有跳过的外部认证实测及原因；没有真实 IdP 环境时，必须以服务端 callback 测试和浏览器 mock 回归替代，不能直接标记为已实测。
8. 最终报告分别列出红测、绿测、构建、浏览器回归命令和结果。

## 14. 实施前确认项

本计划推荐并依赖以下唯一的路由行为决策：

> 当 SAML、OIDC 或 CAS 的安全 redirect 指向当前应用的 `/settings/**` 时，服务端认证失败 callback 返回同一应用作用域的 `/settings/signin`；其他 redirect 继续按原 V1/V2 规则处理。

确认该决策后即可按上述 TDD 顺序实施，不需要新增公开 API 或数据迁移。
