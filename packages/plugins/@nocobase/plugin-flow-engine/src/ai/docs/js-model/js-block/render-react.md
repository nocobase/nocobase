---
title: "Render React"
description: "Render a React element inside the block container."
---

# Render React

Render a React element inside the block container

```ts
// Render a React element into ctx.element via ReactDOM
const { Button } = ctx.libs.antd;

ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```
