---
title: "更新记录：写入数据"
description: "使用 ctx.api.request 发送写请求（POST/PUT/PATCH/DELETE）更新记录。"
---

# 更新记录：写入数据

使用 `ctx.api.request()` 发送写请求更新后端数据。

## 创建记录

```ts
// 创建一条记录
const response = await ctx.api.request({
  method: 'post',
  url: '/posts:create',
  data: {
    title: 'Hello NocoBase',
    status: 'published',
  },
});

return response.data;
```

## 更新记录

```ts
// 根据主键更新记录
const response = await ctx.api.request({
  method: 'post',
  url: '/posts:update',
  data: {
    filterByTk: postId,
    values: {
      title: 'Updated title',
    },
  },
});

return response.data;
```

