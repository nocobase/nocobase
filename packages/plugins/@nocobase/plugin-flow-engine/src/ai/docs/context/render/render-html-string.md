---
title: "渲染 HTML 字符串"
description: "使用 ctx.render() 渲染 HTML 字符串"
---

# 渲染 HTML 字符串

使用 `ctx.render()` 渲染 HTML 字符串，会设置容器的 `innerHTML`。

## 简单文本

```ts
ctx.render('<div style="padding:16px;color:#999;">' + ctx.t('No data') + '</div>');
```

## 带样式的 HTML

```ts
ctx.render(`
  <div style="padding: 16px; background: #f5f5f5; border-radius: 4px;">
    <h3 style="margin: 0 0 8px 0;">${ctx.t('Title')}</h3>
    <p style="margin: 0; color: #666;">${ctx.t('Description')}</p>
  </div>
`);
```
