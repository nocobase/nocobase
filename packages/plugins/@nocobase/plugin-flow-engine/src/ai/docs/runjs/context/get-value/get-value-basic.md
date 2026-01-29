---
title: "Get Current Field Value (ctx.getValue)"
description: "Read the latest value of the current field in JSField/JSItem and bind it to the form."
---

# Get Current Field Value

```ts
// Read the current field value (form state first, then field props)
const current = ctx.getValue();

// Common usage: render based on the current value
if (current == null || current === '') {
  ctx.element.innerHTML = '<span style="color:#999">Please enter a value first</span>';
} else {
  ctx.element.innerHTML = `<span>Current value: ${current}</span>`;
}
```

> Tip:
> - Use `ctx.getValue()` together with `ctx.setValue(v)` to enable two-way binding with the form
> - If the form has not rendered yet or the field is not registered, `ctx.getValue()` may return `undefined`
