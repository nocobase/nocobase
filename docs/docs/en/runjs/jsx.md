# JSX

RunJS supports JSX syntax, letting you write code like React components. JSX is compiled automatically before execution.

## Compilation

- JSX is transformed using [sucrase](https://github.com/alangpierce/sucrase)
- JSX compiles to `ctx.libs.React.createElement` and `ctx.libs.React.Fragment`
- **No React import required**: write JSX directly, it uses `ctx.libs.React`
- If you load external React via `ctx.importAsync('react@x.x.x')`, JSX will use that React instance

## Use built-in React and components

RunJS includes React and common UI libraries accessible via `ctx.libs`, no `import` required:

- **ctx.libs.React** - React core
- **ctx.libs.ReactDOM** - ReactDOM (useful with `createRoot`)
- **ctx.libs.antd** - Ant Design components
- **ctx.libs.antdIcons** - Ant Design icons

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

When you write JSX, you do not need to destructure React unless you use **Hooks** (e.g. `useState`, `useEffect`) or **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Note**: Built-in React and external React loaded via `ctx.importAsync()` **cannot be mixed**. If you use an external UI library, load React from the same external source.

## Use external React and components

When you load specific versions via `ctx.importAsync()`, JSX will use that React instance:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

If antd depends on react/react-dom, specify `deps` to keep versions consistent:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Note**: When using external React, UI libraries such as antd must also be loaded via `ctx.importAsync()`. Do not mix with `ctx.libs.antd`.

## JSX syntax essentials

- **Components and props**: `<Button type="primary">Text</Button>`
- **Fragments**: `<>...</>` or `<React.Fragment>...</React.Fragment>` (requires `const { React } = ctx.libs`)
- **Expressions**: use `{expression}` in JSX (e.g. `{ctx.user.name}`, `{count + 1}`); do not use `{{ }}` template syntax
- **Conditional rendering**: `{flag && <span>Text</span>}` or `{flag ? <A /> : <B />}`
- **List rendering**: use `array.map()` and provide stable `key`

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```
