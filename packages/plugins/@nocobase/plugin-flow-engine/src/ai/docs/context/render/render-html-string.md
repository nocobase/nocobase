---
title: "Render HTML Strings"
description: "Use ctx.render() to render HTML strings"
---

# Render HTML Strings

Use `ctx.render()` to render HTML strings and set the container's `innerHTML`.

## Simple text

```ts
ctx.render('<div style="padding:16px;color:#999;">' + ctx.t('No data') + '</div>');
```

## Styled HTML

```ts
ctx.render(`
  <div style="padding: 16px; background: #f5f5f5; border-radius: 4px;">
    <h3 style="margin: 0 0 8px 0;">${ctx.t('Title')}</h3>
    <p style="margin: 0; color: #666;">${ctx.t('Description')}</p>
  </div>
`);
```
