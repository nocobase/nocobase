---
title: "Add click listener"
description: "Render a button and bind a click event handler."
---

# Add click listener

Render a button and bind a click event handler

```ts
// Render a button and bind a click handler
ctx.element.innerHTML = `
  <button id="nb-jsb-btn" style="padding:6px 12px">${ctx.t('Click me')}</button>
`;
const btn = document.getElementById('nb-jsb-btn');
if (btn) {
  btn.addEventListener('click', () => ctx.message.success(ctx.t('Clicked!')));
}
```
