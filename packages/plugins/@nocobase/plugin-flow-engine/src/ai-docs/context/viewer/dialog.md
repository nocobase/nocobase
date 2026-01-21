# Dialog

## open dialog

```ts
ctx.viewer.dialog({
  uid: `${ctx.model.uid}-dialog`,
  content: () => <DialogContent />,
  inputArgs: { recordId: ctx.record?.id },
  closeOnEsc: true,
});
```
