---
title: "Display text field with copy button"
description: "Render the text field value with a copy-to-clipboard button."
---

# Display text field with copy button

Render the text field value with a copy-to-clipboard button

```ts
const text = String(ctx.value ?? '');
ctx.element.innerHTML = '<a class="nb-copy" style="cursor:pointer;color:#1677ff">' +
  ctx.t('Copy') + '</a>';

ctx.element.querySelector('.nb-copy')?.addEventListener('click', async () => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  ctx.message.success(ctx.t('Copied'));
});
```
