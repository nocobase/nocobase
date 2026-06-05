# ctx.libs

`ctx.libs` is the unified namespace for RunJS built-in libraries (React, Ant Design, dayjs, lodash, etc.). **No `import` or async loading**; use `ctx.libs.xxx` directly.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / JSField / JSItem / JSColumn** | React + Ant Design for UI, dayjs for dates, lodash for data |
| **Formulas / calculations** | formula or math for Excel-like formulas and math expressions |
| **Event flow / linkage** | lodash, dayjs, formula, etc. in logic-only code |

## Built-in libraries

| Property | Description | Docs |
|----------|-------------|------|
| `ctx.libs.React` | React core for JSX and Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM (e.g. `createRoot`) | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design (Button, Card, Table, Form, Input, Modal, etc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design icons (PlusOutlined, UserOutlined, etc.) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Date/time utilities | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Utilities (get, set, debounce, etc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel-like formulas (SUM, AVERAGE, IF, etc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Math expressions and evaluation | [Math.js](https://mathjs.org/docs/) |

## Top-level aliases

For backward compatibility, some libs are also on `ctx`: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, `ctx.dayjs`. **Prefer `ctx.libs.xxx`** for consistency and docs.

## Lazy loading

`lodash`, `formula`, `math` are **lazy-loaded**: the first access to `ctx.libs.lodash` triggers a dynamic import, then the result is cached. `React`, `antd`, `dayjs`, `antdIcons` are preloaded in context.

## Examples

### React and Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Title">
    <Button type="primary">Click</Button>
  </Card>
);
```

### Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### Icons

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>User</Button>);
```

### dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Notes

- **Mixing with ctx.importAsync**: If you load external React via `ctx.importAsync('react@19')`, JSX uses that instance; **do not** mix with `ctx.libs.antd`. Load antd for that React version (e.g. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Multiple React instances**: "Invalid hook call" or null hook dispatcher usually means multiple React instances. Before using `ctx.libs.React` or Hooks, run `await ctx.importAsync('react@version')` so the same React as the page is used.

## Related

- [ctx.importAsync()](./import-async.md): load external ESM (e.g. specific React, Vue)
- [ctx.render()](./render.md): render into container
