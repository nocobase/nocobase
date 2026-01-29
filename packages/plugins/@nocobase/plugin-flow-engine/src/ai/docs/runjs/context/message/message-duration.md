---
title: "Customize Duration"
description: "Customize how long messages are displayed"
---

# Customize Duration

Use the `duration` parameter to customize how long a message is displayed.

## Specify a duration

```javascript
// Auto-close after 5 seconds
ctx.message.success(ctx.t('Operation succeeded'), 5);
```

## Do not auto-close

```javascript
// Set to 0 to keep it open; user must close manually
ctx.message.info(ctx.t('Important information'), 0);
```

## Use a config object

```javascript
ctx.message.success({
  content: ctx.t('Operation succeeded'),
  duration: 5,
  onClose: () => {
    console.log('Message closed');
  }
});
```
