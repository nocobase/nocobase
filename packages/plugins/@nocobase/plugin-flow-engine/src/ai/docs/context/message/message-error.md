---
title: "显示错误消息"
description: "使用 ctx.message.error 显示错误提示"
---

# 显示错误消息

使用 `ctx.message.error()` 显示错误提示消息。

## 基本用法

```javascript
ctx.message.error(ctx.t('Operation failed'));
```

## 在错误处理中使用

```javascript
try {
  await ctx.runAction('create', { values: { name: 'test' } });
  ctx.message.success(ctx.t('Record created successfully'));
} catch (error) {
  ctx.message.error(ctx.t('Failed to create record: {{message}}', { message: error.message }));
}
```

## 显示 API 请求错误

```javascript
try {
  const response = await ctx.api.request({
    url: '/api/users',
    method: 'post',
    data: { name: 'test' }
  });
  ctx.message.success(ctx.t('Request succeeded'));
} catch (error) {
  ctx.message.error(ctx.t('Request failed'));
}
```
