---
title: "显示警告消息"
description: "使用 ctx.message.warning 显示警告提示"
---

# 显示警告消息

使用 `ctx.message.warning()` 显示警告提示消息。

## 基本用法

```javascript
ctx.message.warning(ctx.t('Please select at least one row'));
```

## 在条件检查中使用

```javascript
if (!selectedRows || selectedRows.length === 0) {
  ctx.message.warning(ctx.t('Please select data'));
  return;
}

// 继续处理选中的数据
ctx.message.success(ctx.t('Processed {{count}} rows', { count: selectedRows.length }));
```

## 显示字段未找到警告

```javascript
const field = ctx.form.queryFieldByUid(fieldUid);
if (!field) {
  ctx.message.warning(ctx.t('Field {{name}} not found', { name: fieldUid }));
  return;
}
```
