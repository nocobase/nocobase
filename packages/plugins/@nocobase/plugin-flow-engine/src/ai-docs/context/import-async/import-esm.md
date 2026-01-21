---
title: "Import ESM module"
description: "Dynamically import an ESM module by URL."
---

# Import ESM module

Dynamically import an ESM module by URL

```ts
// Import an ESM module by URL
// Works in yarn dev and yarn start
const mod = await ctx.importAsync('https://cdn.jsdelivr.net/npm/lit-html@2/+esm');
const { html, render } = mod;

ctx.element.innerHTML = '';
const container = document.createElement('div');
container.style.padding = '8px';
container.style.border = '1px dashed #999';
ctx.element.append(container);

render(
  html`<span style="color:#52c41a;">lit-html loaded and rendered</span>`,
  container,
);
```
