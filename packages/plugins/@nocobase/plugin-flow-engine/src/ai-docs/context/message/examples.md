---
title: "Run With Messages"
description: "Use ctx.message.loading/success/error to run with messages."
---

# Examples

## Run With Messages

Use this snippet to run with messages.

```ts
const hide = ctx.message.loading({ content: 'Processing...' });
try {
  await task();
  ctx.message.success({ content: 'Done' });
} catch (error) {
  ctx.message.error({ content: (error as Error).message });
  throw error;
} finally {
  hide?.();
}
```
