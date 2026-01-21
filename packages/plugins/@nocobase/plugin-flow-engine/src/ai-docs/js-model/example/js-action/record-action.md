# Record Action

## Code

Use this snippet to code.

```ts
if (!ctx.record) {
  ctx.message?.error?.('No record loaded');
} else {
  await ctx.viewer?.drawer?.({
    width: '40%',
    content: `
      <div style="padding:16px;">
        <h3>Record preview</h3>
        <pre>${JSON.stringify(ctx.record, null, 2)}</pre>
      </div>
    `,
  });
}
```
