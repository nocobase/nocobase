# ctx.api.auth

认证相关信息与操作，基于 `@nocobase/sdk` 提供的 `Auth` 封装。所有认证相关的请求都会自动带上 Token、角色、语言等信息。

## 说明

- 通过 `ctx.api.auth` 可以：
  - 登录 / 注册 / 退出
  - 读取或设置当前 Token、角色、语言
  - 触发找回密码、重置密码等流程
- SDK 会自动把 Token、Locale、Role 等信息持久化到本地存储，并在每次请求时通过请求头带给服务端

## 常用属性

```ts
api.auth.token   // 当前登录用户的 Token
api.auth.role    // 当前角色名称，例如 'admin'、'root'
api.auth.locale  // 当前语言，例如 'zh-CN'、'en-US'
api.auth.authenticator // 当前使用的认证器标识
```

## 常用方法（简化）

```ts
// 登录 / 注册 / 退出
api.auth.signIn(values, authenticator?): Promise<any>;
api.auth.signUp(values, authenticator?): Promise<any>;
api.auth.signOut(): Promise<any>;

// 密码找回
api.auth.lostPassword(values): Promise<any>;
api.auth.resetPassword(values): Promise<any>;

// 读取 / 设置 Token
api.auth.getToken(): string | null;
api.auth.setToken(token: string | null): void;

// 读取 / 设置当前认证器
api.auth.getAuthenticator(): string | null;
api.auth.setAuthenticator(authenticator: string | null): void;

// 读取 / 设置语言
api.auth.getLocale(): string | null;
api.auth.setLocale(locale: string | null): void;

// 读取 / 设置角色
api.auth.getRole(): string | null;
api.auth.setRole(role: string | null): void;

// 读写自定义选项（底层使用 api.storage）
api.auth.getOption(key: string): string | null;
api.auth.setOption(key: string, value?: string): void;
```

## 使用示例

- [认证：登录 / 退出 / 读取 Token](../api/api-auth-basic.md)
