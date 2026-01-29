---
title: "在事件处理中使用"
description: "在按钮点击等事件处理函数中使用消息提示"
---

# 在事件处理中使用

在按钮点击、表单提交等事件处理函数中使用消息提示。

## 在按钮点击事件中

```tsx
const { Button } = ctx.libs.antd;

ctx.render(
  <Button 
    type="primary" 
    onClick={() => ctx.message.success(ctx.t('Clicked!'))}
  >
    {ctx.t('Click')}
  </Button>
);
```

## 在原生 DOM 事件中

```javascript
const btn = ctx.element.querySelector('button');
btn.addEventListener('click', () => {
  ctx.message.success(ctx.t('Button clicked!'));
});
```

## 在表单提交中

```javascript
const handleSubmit = async () => {
  try {
    await ctx.runAction('create', { values: formData });
    ctx.message.success(ctx.t('Form submitted successfully'));
  } catch (error) {
    ctx.message.error(ctx.t('Form submission failed'));
  }
};
```
