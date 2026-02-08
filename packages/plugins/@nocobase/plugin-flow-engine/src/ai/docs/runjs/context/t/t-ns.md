---
title: "Translate with Namespace (ns)"
description: "Use ctx.t() with ns option to look up key in a specific namespace"
---

# Translate with Namespace (ns)

Use `ctx.t()` with `ns` to look up the key in a specific namespace (or fallback list).

```ts
ctx.t('Save', { ns: 'myModule' });
ctx.t('Save', { ns: ['myModule', 'common'] });
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```
