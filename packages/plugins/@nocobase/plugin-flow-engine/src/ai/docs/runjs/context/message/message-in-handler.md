---
title: "Use in Event Handlers"
description: "Use toast messages in button clicks and other handlers"
---

# Use in Event Handlers

Use toast messages in button click handlers, form submissions, and similar events.

## In a button click handler

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

## In native DOM events

```javascript
const btn = ctx.element.querySelector('button');
btn.addEventListener('click', () => {
  ctx.message.success(ctx.t('Button clicked!'));
});
```

## In form submission

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
