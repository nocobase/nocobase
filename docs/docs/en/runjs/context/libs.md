# ctx.libs

`ctx.libs` is the unified namespace for built-in libraries in RunJS, containing commonly used libraries such as React, Ant Design, dayjs, and lodash. **No `import` or asynchronous loading is required**; they can be used directly via `ctx.libs.xxx`.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Use React + Ant Design to render UI, dayjs for date handling, and lodash for data processing. |
| **Formula / Calculation** | Use formula or math for Excel-like formulas and mathematical expression operations. |
| **Workflow / Linkage Rules** | Call utility libraries like lodash, dayjs, and formula in pure logic scenarios. |

## Built-in Libraries Overview

| Property | Description | Documentation |
|------|------|------|
| `ctx.libs.React` | React core, used for JSX and Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM client API (including `createRoot`), used with React for rendering | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design component library (Button, Card, Table, Form, Input, Modal, etc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design icon library (e.g., PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Date and time utility library | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Utility library (get, set, debounce, etc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel-like formula function library (SUM, AVERAGE, IF, etc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Mathematical expression and calculation library | [Math.js](https://mathjs.org/docs/) |

## Top-level Aliases

For compatibility with legacy code, some libraries are also exposed at the top level: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, and `ctx.dayjs`. **It is recommended to consistently use `ctx.libs.xxx`** for easier maintenance and documentation searching.

## Lazy Loading

`lodash`, `formula`, and `math` use **lazy loading**: a dynamic import is triggered only when `ctx.libs.lodash` is accessed for the first time, and the cache is reused thereafter. `React`, `antd`, `dayjs`, and `antdIcons` are pre-configured by the context and are available immediately.

## Examples

### Rendering with React and Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Title">
    <Button type="primary">Click</Button>
  </Card>
);
```

### Using Hooks

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

### Using Icons

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>User</Button>);
```

### Date Processing with dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Utility Functions with lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Formula Calculations

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Mathematical Expressions with math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Notes

- **Mixing with ctx.importAsync**: If an external React is loaded via `ctx.importAsync('react@19')`, JSX will use that instance. In this case, **do not** mix it with `ctx.libs.antd`. Ant Design must be loaded to match that React version (e.g., `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Multiple React Instances**: If "Invalid hook call" occurs or the hook dispatcher is null, it is usually caused by multiple React instances. Before reading `ctx.libs.React` or calling Hooks, execute `await ctx.importAsync('react@version')` first to ensure the same React instance is shared with the page.

## Related

- [ctx.importAsync()](./import-async.md) - Load external ESM modules on demand (e.g., specific versions of React, Vue)
- [ctx.render()](./render.md) - Render content to a container