# ctx.libs.ReactDOM

Built-in ReactDOM client API, equivalent to `ctx.ReactDOM`. Typically you won't need to use it directly, since rendering is done via `ctx.render`; in rare cases you can manually create root nodes.

## Type Definition (Simplified)

```ts
libs.ReactDOM: typeof import('react-dom/client');
```

## Examples

```ts
// Recommended: render JSX directly with ctx.render
ctx.render(<div>Hello from ReactDOM</div>);
```

> Tip:
> - In most cases, `ctx.render(jsx)` is enough; no need to operate `ReactDOM` directly
> - Only use `ctx.libs.ReactDOM` when you need fine-grained control of root nodes or multi-root rendering; see advanced docs for such cases
