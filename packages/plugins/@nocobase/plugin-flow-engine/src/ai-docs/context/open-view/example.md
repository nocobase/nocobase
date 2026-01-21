# Example

## Open Drawer

Use this snippet to open drawer.

```ts
await ctx.openView(`${ctx.model.uid}-drawer`, {
  mode: 'drawer',
  inputArgs: { recordId: ctx.model.uid },
  defineProperties: {
    recordId: {
      get: () => ctx.model.uid,
    },
  },
});
```
