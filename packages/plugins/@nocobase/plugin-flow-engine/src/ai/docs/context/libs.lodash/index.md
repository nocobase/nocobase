# ctx.libs.lodash

Built-in Lodash utility library, available directly in RunJS for common operations like object access and array processing.

## Type Definition (Simplified)

```ts
libs.lodash: typeof import('lodash');
```

## Examples

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');

ctx.render(<div>User name: {name}</div>);
```
