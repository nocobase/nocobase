# JSX

RunJS supports JSX; you can write code like React components, and JSX is compiled before execution.

## Compilation

- JSX is transformed with [sucrase](https://github.com/alangpierce/sucrase)
- JSX compiles to `ctx.libs.React.createElement` and `ctx.libs.React.Fragment`
- **No need to import React**: write JSX directly; the compiler uses `ctx.libs.React`
- When loading external React via `ctx.importAsync('react@x.x.x')`, JSX uses that instance’s `createElement`

## Using Built-in React and Components

RunJS includes React and common UI libraries; use them via `ctx.libs` without `import`:

- **ctx.libs.React** — React core
- **ctx.libs.ReactDOM** — ReactDOM (e.g. for createRoot)
- **ctx.libs.antd** — Ant Design components
- **ctx.libs.antdIcons** — Ant Design icons

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

You don’t need to destructure React for plain JSX; destructure from `ctx.libs` only when using **Hooks** (e.g. `useState`, `useEffect`) or **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Note**: Built-in React and React loaded via `ctx.importAsync()` **must not be mixed**. If you use an external UI library, import React from the same external source.

## Using External React and Components

When you load React and a UI library with `ctx.importAsync()`, JSX uses that React instance:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

If antd depends on react/react-dom, use `deps` to pin the same version and avoid multiple instances:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Note**: With external React, load antd and other UI libraries via `ctx.importAsync()`; do not mix with `ctx.libs.antd`.

## JSX Basics

- **Components and props**: `<Button type="primary">Text</Button>`
- **Fragment**: `<>...</>` or `<React.Fragment>...</React.Fragment>` (destructure `const { React } = ctx.libs` when using Fragment)
- **Expressions**: Use `{expression}` in JSX for variables or expressions, e.g. `{ctx.user.name}`, `{count + 1}`; do not use `{{ }}` template syntax
- **Conditional render**: `{flag && <span>Content</span>}` or `{flag ? <A /> : <B />}`
- **List render**: Use `array.map()` and give each element a stable `key`

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
