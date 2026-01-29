---
title: "翻译文案 (ctx.i18n)"
description: "在 JSBlock / Action 中使用 ctx.i18n 进行国际化。"
---

# 翻译文案

```ts
// 使用命名空间翻译（推荐）
const title = ctx.i18n.t('jsBlock.welcomeTitle', { ns: 'client' });
const desc = ctx.i18n.t('jsBlock.welcomeDesc', { ns: 'client', name: ctx.user?.nickname });

ctx.element.innerHTML = `
  <h2>${title}</h2>
  <p>${desc}</p>
`;

// 读取/切换当前语言
const currentLang = ctx.i18n.language;
// ctx.i18n.language = 'en-US'; // 不推荐在运行时随意修改，一般由应用统一控制
```

> 提示：
> - 在 NocoBase 中通常通过命名空间（如 `client`、插件名等）组织文案 key，`ctx.i18n.t` 与前端完全一致
> - 若只需要简单占位替换，也可以使用 `ctx.t()` 作为快捷方式
