---
title: "基础请求：获取用户信息"
description: "使用 ctx.api.request 发送 GET/POST 请求，获取或更新用户信息。"
---

# 基础请求：获取用户信息

使用 `ctx.api.request()` 发送基础的 GET / POST 请求。

## 获取用户信息

```ts
// 获取当前用户信息
const response = await ctx.api.request({
  method: 'get',
  url: '/users:get', // 资源风格 URL
});

// 一般直接返回 data 部分
return response.data;
```

## 更新用户信息

```ts
// payload 为要更新的字段
const response = await ctx.api.request({
  method: 'post',
  url: '/users:update',
  data: payload,
});

return response.data;
```

