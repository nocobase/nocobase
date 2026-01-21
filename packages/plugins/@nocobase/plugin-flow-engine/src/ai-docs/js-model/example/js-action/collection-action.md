# Collection Action

## Code

Use this snippet to code.

```ts
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message?.warning?.('Select at least one record');
} else {
  await ctx.viewer?.drawer?.({
    width: '40%',
    content: `
      <div style="padding:16px;">
        <h3>Selected IDs</h3>
        <pre>${rows.map((r) => r.id).join(', ')}</pre>
      </div>
    `,
  });
}
```
