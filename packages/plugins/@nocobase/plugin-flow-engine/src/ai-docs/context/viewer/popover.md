# Popover

## open popover

```ts
ctx.viewer.popover({
  uid: `${ctx.model.uid}-popover`,
  placement: 'right',
  content: () => <PreviewCard record={ctx.record} />,
});
```
