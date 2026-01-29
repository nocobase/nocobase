---
title: "Render DOM Nodes"
description: "Use ctx.render() to render DOM nodes"
---

# Render DOM Nodes

Use `ctx.render()` to render DOM nodes and append them directly to the container.

```ts
const div = document.createElement('div');
div.textContent = ctx.t('Hello World');
div.style.padding = '16px';
div.style.color = '#1890ff';

ctx.render(div);
```
