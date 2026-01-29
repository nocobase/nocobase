---
title: "Translate Text (ctx.i18n)"
description: "Use ctx.i18n for i18n in JSBlock / Action."
---

# Translate Text

```ts
// Translate with a namespace (recommended)
const title = ctx.i18n.t('jsBlock.welcomeTitle', { ns: 'client' });
const desc = ctx.i18n.t('jsBlock.welcomeDesc', { ns: 'client', name: ctx.user?.nickname });

ctx.element.innerHTML = `
  <h2>${title}</h2>
  <p>${desc}</p>
`;

// Read / switch current language
const currentLang = ctx.i18n.language;
// ctx.i18n.language = 'en-US'; // Not recommended to change at runtime; usually controlled by the app
```

> Tip:
> - In NocoBase, text keys are usually organized by namespace (e.g., `client`, plugin name, etc.). `ctx.i18n.t` behaves exactly like the frontend i18n
> - For simple placeholder replacement, you can use `ctx.t()` as a shortcut
