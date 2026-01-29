---
title: "认证：登录 / 退出 / 读取 Token"
description: "使用 ctx.api.auth 登录、退出，并读取当前用户的 Token / 角色 / 语言。"
---

# 认证：登录 / 退出 / 读取 Token

## 登录（signIn）

```ts
// 使用指定 authenticator 登录
const response = await ctx.api.auth.signIn(
  { email, password },
  'basic', // authenticator 标识，可在后台配置中查看
);

// 登录成功后，Token 会自动保存到本地存储
typeof ctx.api.auth.token; // string | null
```

## 退出登录（signOut）

```ts
await ctx.api.auth.signOut();

// 退出后，token / role / authenticator 等都会被清空
console.log(ctx.api.auth.token); // null
```

## 读取当前认证信息

```ts
// 当前 Token
const token = ctx.api.auth.getToken();

// 当前角色
const role = ctx.api.auth.getRole();

// 当前语言
const locale = ctx.api.auth.getLocale();
```

