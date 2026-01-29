---
title: "显示信息消息"
description: "使用 ctx.message.info 显示信息提示"
---

# 显示信息消息

使用 `ctx.message.info()` 显示信息提示消息。

## 基本用法

```javascript
ctx.message.info(ctx.t('Processing...'));
```

## 显示操作提示

```javascript
ctx.message.info(ctx.t('Please wait while we process your request'));
```
