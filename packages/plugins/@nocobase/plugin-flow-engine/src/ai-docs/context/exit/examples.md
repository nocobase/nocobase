# Examples

## Confirm And Exit

Use this snippet to confirm and exit.

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirm deletion',
  content: 'Delete this record?',
});

if (!confirmed) {
  ctx.message.info({ content: 'Deletion cancelled' });
  ctx.exit();
  return;
}

ctx.message.success({ content: 'Deletion confirmed' });
```
