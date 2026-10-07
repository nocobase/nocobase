# @nocobase/app-plugin-authentication

`@nocobase/app-plugin-authentication` 是 NocoBase 应用的认证基础包。它将 Better Auth
接入 NocoBase Database 和 Caching，提供 Hono 中间件、浏览器认证客户端、React 上下文、
路由守卫和无页面依赖的认证动作 hooks。

当前内置的默认认证方式是邮箱或用户名加密码。应用通过 Better Auth 配置和插件扩展
认证能力。

## 文档入口

- 面向应用开发者的功能介绍和 Agent 用法：NocoBase 文档站「内置能力 / 登录注册」。
- 面向应用 Agent 的开发契约：本包 `skills/nocobase-app-plugin-authentication/`。
  插件注册到应用后会同步到应用的 `.agents/skills/`，同步副本不要直接修改。

## 包入口

| 入口                                                 | 用途                                             |
| ---------------------------------------------------- | ------------------------------------------------ |
| `@nocobase/app-plugin-authentication`                | 服务端认证、存储适配、数据库适配和 migration     |
| `@nocobase/app-plugin-authentication/server`         | 显式的服务端入口，与根入口导出相同               |
| `@nocobase/app-plugin-authentication/client`         | 浏览器 `AuthClient`、认证上下文和路由守卫        |
| `@nocobase/app-plugin-authentication/client/actions` | 无页面依赖的认证动作 hooks                       |
| `@nocobase/app-plugin-authentication/testing`        | 其他包的测试用 `signIn()` 以真实会话登录测试应用 |

根入口是服务端入口，浏览器代码必须从 `@nocobase/app-plugin-authentication/client` 导入。

## API 文档

应用的 OpenAPI 文档在 `GET /api/swagger`（JSON），Swagger UI 页面在 `GET /api/swagger/docs`。本插件为它们注册访问检查：带有效登录会话的请求可以读取，匿名请求得到 `401`，`error.reason` 为 `API_DOCS_UNAUTHENTICATED`。检查按插件自己的方式解析会话，但不延长会话有效期、不写 Cookie。注册了 `@nocobase/app-plugin-api-keys` 的应用里，带有效 API Key 的请求同样可以读取。

本插件还把 Better Auth 的端点并入文档：由 Better Auth 自带的 OpenAPI 生成器生成，路径为完整的 `/api/auth/...`，标签为 `Authentication`，包括应用配置的 Better Auth 插件（如用户名登录、API Key）的端点。只有浏览器才能走完的步骤不列入文档：社交登录跳转 `/sign-in/social`、`/link-social`，OAuth 回调 `/callback/{id}`，邮件链接 `/verify-email`、`/reset-password/{token}`、`/delete-user/callback`，以及 HTML 错误页 `/error`。Better Auth 自己的 `/reference` 页面不对外提供。

## 认证页面归应用所有

插件不发布 `/login` 等路由，也不提供路由覆盖契约。认证守卫会跳转到 `/login`，因此
使用本插件的应用必须在自己的 `client/routes.ts` 中声明 `/login`、`/register`、
`/forgot-password` 和 `/reset-password` 四条 `auth: 'guest'` 路由。仓库内的三个模板
已内置这些路由：页面在 `client/pages/auth/`，把插件的 headless actions 接到 NocoBase UI
Library 安装的展示组件（`client/extensions/nocobase-auth-forms/`、
`nocobase-auth-methods/`、`nocobase-auth-split-layout/`）上，这些文件属于应用，可以直接修改。

## 应用配置

模板中的 `server/config/auth.ts` 和 `client/config/auth.ts` 分别提供认证服务端与
客户端 options，两端均从对应入口导入 `AuthConfig`。插件列表和回调写在 TS 中，部署
密钥写在 `config.yml` 的 `secrets.keys` 或环境变量 `SECRETS_KEYS` 中：Better Auth 的密钥由它派生，已有的
`auth.secret` 作为旧密钥保留，用于解密之前加密的数据。更换当前密钥会让所有用户重新登录。

### 初始管理员

在首次运行 Seed 前，通过应用的 `config.yml` 设置 `users.initialAdmin`：

```yaml
users:
  initialAdmin:
    username: my_admin
    email: admin@example.com
    password: your-initial-password
```

不配置整个 `initialAdmin` 节点时，保留默认账号 `nocobase/admin123`；显式配置时必须提供非空密码，省略用户名则使用 `nocobase`，省略邮箱则使用 `admin@nocobase.com`。用户名支持 3–30 个字母、数字、下划线或点，邮箱须为有效地址，两者存储时均转为小写。密码经哈希后写入数据库，配置值不传给 Better Auth 的运行时 options。

配置只在用户表为空时生效。已有安装、重复执行 Seed 或之后修改配置，都不会重置账号或密码。root 授权 Seed 使用相同配置中的用户名定位管理员，Hub 后续的管理员初始化也使用该身份。

## 常用命令

```bash
pnpm --filter @nocobase/app-plugin-authentication lint
pnpm --filter @nocobase/app-plugin-authentication typecheck
pnpm --filter @nocobase/app-plugin-authentication test
pnpm --filter @nocobase/app-plugin-authentication build
```

用户管理 `remove(userId, actorId)` 在事务内永久停用并隐藏账号，保留 `deletedAt`、`deletedBy` 与原身份用于历史归属，删除登录账户和会话。删除前业务资源检查与 API Key 清理由上层生命周期服务负责；不可直接把底层方法暴露为无授权接口。已删除账号不能重新启用，用户名和邮箱仍保留。
