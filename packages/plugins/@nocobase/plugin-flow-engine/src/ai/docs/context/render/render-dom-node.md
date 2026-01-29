---
title: "渲染 DOM 节点"
description: "使用 ctx.render() 渲染 DOM 节点"
---

# 渲染 DOM 节点

使用 `ctx.render()` 渲染 DOM 节点，会直接追加到容器中。

```ts
const div = document.createElement('div');
div.textContent = ctx.t('Hello World');
div.style.padding = '16px';
div.style.color = '#1890ff';

ctx.render(div);
```
