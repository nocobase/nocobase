---
title: "Render button handler"
description: "Render a button and handle click events inside the block."
---

# Render button handler

Render a button and handle click events inside the block

```ts
const { Button } = ctx.libs.antd;

ctx.render(
  <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
    {ctx.t('Button')}
  </Button>
);
```
