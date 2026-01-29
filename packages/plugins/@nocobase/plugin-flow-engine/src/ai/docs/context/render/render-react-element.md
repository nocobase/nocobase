---
title: "渲染 React 元素"
description: "使用 ctx.render() 渲染 React 元素（JSX）"
---

# 渲染 React 元素

使用 `ctx.render()` 渲染 React 元素（JSX），支持完整的 React 功能。

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
