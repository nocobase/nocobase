# ctx.modal

Quick API based on Ant Design Modal, used to open modal dialogs proactively in JSBlock / Action / JSField.

> Implemented by `ctx.viewer` / the view system. This page only lists common capabilities in a simplified form.

## Common Usage

```ts
// Show a simple info dialog
ctx.modal.info?.({
  title: 'Notice',
  content: 'Operation completed',
});

// Confirm dialog, combined with ctx.exit/ctx.exitAll to control flow
ctx.modal.confirm?.({
  title: 'Confirm deletion',
  content: 'Are you sure you want to delete this record?',
  async onOk() {
    await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
  },
});
```

> Tip:
> - Available methods and parameters align with Ant Design `Modal` (e.g., `info`, `success`, `error`, `warning`, `confirm`)
> - For complex interactions, prefer `ctx.openView` to open custom views (page/drawer/dialog). `ctx.modal` is best for lightweight tips
