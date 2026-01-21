# Examples

## Create Runner

```ts
const runner = await ctx.createJSRunner({ timeoutMs: 5000 });
const result = await runner.run('return ctx.user');
```
