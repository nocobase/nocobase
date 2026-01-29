---
title: "显示加载消息"
description: "使用 ctx.message.loading 显示加载提示"
---

# 显示加载消息

使用 `ctx.message.loading()` 显示加载提示消息。

## 基本用法

```javascript
const hide = ctx.message.loading(ctx.t('Loading...'));

// 执行异步操作
await ctx.api.request({ url: '/api/data' });

// 手动关闭加载消息
hide();
```

## 在异步操作中使用

```javascript
const hide = ctx.message.loading(ctx.t('Processing data...'));

try {
  await ctx.runAction('process', { data: someData });
  hide();
  ctx.message.success(ctx.t('Processing completed'));
} catch (error) {
  hide();
  ctx.message.error(ctx.t('Processing failed'));
}
```
