# ctx.modal

A shortcut API based on Ant Design Modal for opening modals from JSBlock / Action / JSField.

> Implemented by `ctx.viewer` / the view system. Only common capabilities are listed here.

## Common usage

```ts
// Simple info modal
ctx.modal.info?.({
  title: 'Notice',
  content: 'The operation is complete',
});

// Confirm modal, can be combined with ctx.exit/ctx.exitAll
ctx.modal.confirm?.({
  title: 'Confirm delete',
  content: 'Are you sure you want to delete this record?',
  async onOk() {
    await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
  },
});
```

> Tips:
> - Method names and params are the same as Ant Design `Modal` (e.g. `info`, `success`, `error`, `warning`, `confirm`)
> - For complex interactions, use `ctx.openView` to open a custom view (page/drawer/modal). `ctx.modal` is better for lightweight prompts
