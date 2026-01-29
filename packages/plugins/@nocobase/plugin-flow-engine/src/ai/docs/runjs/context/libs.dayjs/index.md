# ctx.libs.dayjs

Built-in `dayjs` date/time library, available directly in RunJS for formatting, range calculations, and more.

## Type Definition (Simplified)

```ts
libs.dayjs: typeof import('dayjs');
```

## Examples

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');

ctx.render(<div>Current time: {formatted}</div>);
```

> Tip:
> - The built-in version matches the frontend app's version; no need to import dayjs via `ctx.importAsync`
> - To use plugins (e.g., `timezone`, `relativeTime`), extend it as described in the dayjs docs
