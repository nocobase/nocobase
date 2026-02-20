# JSX

RunJS 支持 JSX 语法，可以像写 React 组件一样编写代码，JSX 会在执行前自动编译。

## 编译说明

- 使用 [sucrase](https://github.com/alangpierce/sucrase) 转换 JSX
- JSX 会被编译为 `ctx.libs.React.createElement` 和 `ctx.libs.React.Fragment`
- **无需 import React**：直接写 JSX 即可，编译后自动使用 `ctx.libs.React`
- 通过 `ctx.importAsync('react@x.x.x')` 加载外部 React 时，JSX 会改为使用该实例的 `createElement`

## 使用内置 React 与组件

RunJS 内置了 React 及常用 UI 库，可直接通过 `ctx.libs` 使用，无需 `import`：

- **ctx.libs.React** — React 本体
- **ctx.libs.ReactDOM** — ReactDOM（如需可配合 createRoot 使用）
- **ctx.libs.antd** — Ant Design 组件
- **ctx.libs.antdIcons** — Ant Design 图标

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>点击</Button>);
```

直接写 JSX 时无需解构 React；只有在使用 **Hooks**（如 `useState`、`useEffect`）或 **Fragment**（`<>...</>`）时才需要从 `ctx.libs` 解构：

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**注意**：内置的 React 与通过 `ctx.importAsync()` 导入的外部 React **不能混用**。若使用外部 UI 库，React 也需从外部一并导入。

## 使用外部 React 与组件

通过 `ctx.importAsync()` 加载指定版本的 React 和 UI 库时，JSX 会使用该 React 实例：

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>点击</Button>);
```

若 antd 依赖 react/react-dom，可通过 `deps` 指定同一版本，避免多实例：

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**注意**：使用外部 React 时，antd 等 UI 库也需通过 `ctx.importAsync()` 导入，不要与 `ctx.libs.antd` 混用。

## JSX 语法要点

- **组件与 props**：`<Button type="primary">文字</Button>`
- **Fragment**：`<>...</>` 或 `<React.Fragment>...</React.Fragment>`（使用 Fragment 时需解构 `const { React } = ctx.libs`）
- **表达式**：在 JSX 中用 `{表达式}` 插入变量或运算，如 `{ctx.user.name}`、`{count + 1}`；不要使用 `{{ }}` 模板语法
- **条件渲染**：`{flag && <span>内容</span>}` 或 `{flag ? <A /> : <B />}`
- **列表渲染**：使用 `array.map()` 返回元素列表，并为元素设置稳定 `key`

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
