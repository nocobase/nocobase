---
title: "自定义持续时间"
description: "自定义消息显示的持续时间"
---

# 自定义持续时间

通过 `duration` 参数自定义消息显示的持续时间。

## 指定持续时间

```javascript
// 显示 5 秒后自动关闭
ctx.message.success(ctx.t('Operation succeeded'), 5);
```

## 不自动关闭

```javascript
// 设置为 0 表示不自动关闭，需要用户手动点击关闭
ctx.message.info(ctx.t('Important information'), 0);
```

## 使用配置对象

```javascript
ctx.message.success({
  content: ctx.t('Operation succeeded'),
  duration: 5,
  onClose: () => {
    console.log('Message closed');
  }
});
```
