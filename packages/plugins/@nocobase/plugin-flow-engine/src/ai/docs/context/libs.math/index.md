# ctx.libs.math

Built-in Math.js library, available directly in RunJS for complex expressions, matrix operations, and more.

## Type Definition (Simplified)

```ts
libs.math: typeof import('mathjs');
```

## Examples

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');

ctx.render(<div>Result: {String(result)}</div>);
```
