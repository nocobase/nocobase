---
title: "Query selector"
description: "Find a child element inside ctx.element using querySelector."
---

# Query selector

Find a child element inside ctx.element using querySelector

```ts
const child = ctx.element.querySelector('.child-class');
if (child) {
  child.textContent = ctx.t('Hello from querySelector');
}
```
