---
title: "Setup"
description: "Shared helpers used by the following snippets."
---

# Examples

## Setup

Shared helpers used by the following snippets.

```ts
function translateInPlugin(appCtx: { t['t'] }) {
  return appCtx.t('plugin.loaded', { ns: 'system' });
}
```

## Translate In Model

Use this snippet to translate in model.

```ts
return ctx.t('greeting', { ns: 'common', name: 'NocoBase' });
```

## Translate In Step

Use this snippet to translate in step.

```ts
return ctx.t('workflow.done', { ns: 'flow', count: 3 });
```
