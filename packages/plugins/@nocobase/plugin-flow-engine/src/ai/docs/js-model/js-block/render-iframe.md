---
title: "Render iframe"
description: "Embed example.com as a sandboxed iframe inside the block element."
---

# Render iframe

Embed example.com as a sandboxed iframe inside the block element

```ts
// Create an iframe that fills the current block container
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Replace existing children so the iframe is the only content
ctx.element.replaceChildren(iframe);
```
