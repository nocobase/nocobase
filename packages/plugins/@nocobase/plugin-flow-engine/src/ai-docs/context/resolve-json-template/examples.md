# Examples

## Resolve Template

```ts
const payload = ctx.resolveJsonTemplate({ message: 'Hi {{user.name}}!' }, { user: ctx.user });
```
