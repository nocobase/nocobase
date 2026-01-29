# ctx.t()

A shortcut i18n function for translating text quickly in JS scripts. Internally it delegates to `ctx.i18n.t`.

## Type Definition (Simplified)

```ts
t(key: string, variables?: Record<string, any>): string;
```

## Examples

```ts
const text = ctx.t('Hello {name}', { name: ctx.user?.nickname || 'NocoBase' });
ctx.render(<div>{text}</div>);
```

> Tip:
> - `ctx.t` is suitable for simple inline text. If you need advanced control of namespaces, locale, etc., use `ctx.i18n.t` directly.
