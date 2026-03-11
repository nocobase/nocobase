# JSX

RunJS supports JSX syntax, allowing you to write code similar to React components. JSX is automatically compiled before execution.

## Compilation Notes

- Uses [sucrase](https://github.com/alangpierce/sucrase) to transform JSX.
- JSX is compiled into `ctx.libs.React.createElement` and `ctx.libs.React.Fragment`.
- **No need to import React**: You can write JSX directly; it will automatically use `ctx.libs.React` after compilation.
- When loading external React via `ctx.importAsync('react@x.x.x')`, JSX will switch to using the `createElement` method from that specific instance.

## Using Built-in React and Components

RunJS includes React and common UI libraries built-in. You can access them directly via `ctx.libs` without using `import`:

- **ctx.libs.React** — React core
- **ctx.libs.ReactDOM** — ReactDOM (can be used with `createRoot` if needed)
- **ctx.libs.antd** — Ant Design components
- **ctx.libs.antdIcons** — Ant Design icons

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

When writing JSX directly, you don't need to destructure React. You only need to destructure from `ctx.libs` when using **Hooks** (such as `useState`, `useEffect`) or **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Note**: Built-in React and external React imported via `ctx.importAsync()` **cannot be mixed**. If you use an external UI library, React must also be imported from the same external source.

## Using External React and Components

When loading a specific version of React and UI libraries via `ctx.importAsync()`, JSX will use that React instance:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

If antd depends on react/react-dom, you can specify the same version via `deps` to avoid multiple instances:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Note**: When using external React, UI libraries like antd must also be imported via `ctx.importAsync()`. Do not mix them with `ctx.libs.antd`.

## JSX Syntax Key Points

- **Components and props**: `<Button type="primary">Text</Button>`
- **Fragment**: `<>...</>` or `<React.Fragment>...</React.Fragment>` (requires destructuring `const { React } = ctx.libs` when using Fragment)
- **Expressions**: Use `{expression}` in JSX to insert variables or operations, such as `{ctx.user.name}` or `{count + 1}`. Do not use `{{ }}` template syntax.
- **Conditional Rendering**: `{flag && <span>Content</span>}` or `{flag ? <A /> : <B />}`
- **List Rendering**: Use `array.map()` to return a list of elements, and ensure each element has a stable `key`.

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