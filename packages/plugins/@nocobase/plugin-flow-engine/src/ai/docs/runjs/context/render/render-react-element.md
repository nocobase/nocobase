---
title: "Render React Elements"
description: "Use ctx.render() to render React elements (JSX)"
---

# Render React Elements

Use `ctx.render()` to render React elements (JSX), with full React functionality.

```ts
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Welcome')} style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </Card>
);
```
