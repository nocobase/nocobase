# JSX

RunJS supports JSX syntax, so you can write code the same way you write React components.

## Notes

RunJS automatically detects and compiles JSX code:
- Uses [sucrase](https://github.com/alangpierce/sucrase) to transform JSX
- JSX is transformed into `ctx.libs.React.createElement` and `ctx.libs.React.Fragment`
- **No need to import React**; just use `ctx.libs.React`
- Compilation is automatic, no manual configuration required

## JSX Transform

JSX code is automatically transformed into:

```tsx
// Original JSX code
const App = () => (
  <div>
    <h1>Hello</h1>
  </div>
);

// Automatically transformed to
const App = () => (
  ctx.libs.React.createElement('div', null,
    ctx.libs.React.createElement('h1', null, 'Hello')
  )
);
```

## Use React

In JSX, **you do not need to manually import or destructure React**. After compilation, JSX will automatically use `ctx.libs.React`:

```tsx
// Use JSX directly (compiles to ctx.libs.React)
const App = () => <div>Hello</div>;

ctx.render(<App />);
```

Only when you need React Hooks (such as `useState`, `useEffect`) or `Fragment` do you need to destructure:

```tsx
// Only destructure when using Hooks
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};
```

**Note**: `ctx.React` is deprecated. Use `ctx.libs.React` instead.

## Notes

- **No need to import or destructure React**: JSX compilation uses `ctx.libs.React.createElement`, so you can write JSX directly
- **Prefer antd components**: Components from `ctx.libs.antd` provide better theming, consistent styles, and interactions than native HTML elements
- **Only destructure when Hooks are needed**: Only when using `useState`, `useEffect`, or `Fragment` do you need `const { React } = ctx.libs;`
- **Use ctx.libs.React consistently**: Do not use `ctx.React` (deprecated) or `import React from 'react'`
- **Full JSX syntax supported**: Components, props, Fragment (`<>...</>`), conditional rendering, list rendering, etc.
- **Automatic compilation**: JSX is compiled automatically before execution
- **Use variables directly in JSX**: Use JavaScript expressions and variables like `{ctx.user.name}` rather than `{{ }}` template syntax
