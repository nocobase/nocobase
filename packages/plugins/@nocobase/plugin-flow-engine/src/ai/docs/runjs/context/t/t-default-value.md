---
title: "Translate with Default Value"
description: "Use ctx.t() with defaultValue when key is missing"
---

# Translate with Default Value

Use `ctx.t()` with `defaultValue` so that when the key is not in resources, the default string is returned (can include `{{var}}`).

```ts
ctx.t('CustomKeyNotInResource', { defaultValue: 'Fallback text' });
ctx.t('Greeting', { defaultValue: 'Hello, {{name}}', name: 'Guest' });
```
