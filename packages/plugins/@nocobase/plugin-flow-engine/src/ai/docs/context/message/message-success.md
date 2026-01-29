---
title: "显示成功消息"
description: "使用 ctx.message.success 显示成功提示"
---

# 显示成功消息

使用 `ctx.message.success()` 显示成功提示消息。

## 基本用法

```javascript
ctx.message.success(ctx.t('Operation succeeded'));
```

## 带变量的消息

```javascript
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

## 在操作完成后显示

```javascript
// 执行某个操作
await ctx.runAction('create', { values: { name: 'test' } });

// 显示成功消息
ctx.message.success(ctx.t('Record created successfully'));
```
