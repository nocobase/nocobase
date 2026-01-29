# JSX

RunJS 支持 JSX 语法，可以像编写 React 组件一样编写代码。

## 说明

RunJS 会自动检测并编译 JSX 代码：
- 使用 [sucrase](https://github.com/alangpierce/sucrase) 进行 JSX 转换
- JSX 会被转换为 `ctx.libs.React.createElement` 和 `ctx.libs.React.Fragment`
- **不需要导入 React**，使用 `ctx.libs.React` 即可
- 编译是自动的，无需手动配置

## JSX 转换

JSX 代码会被自动转换为：

```tsx
// 原始 JSX 代码
const App = () => (
  <div>
    <h1>Hello</h1>
  </div>
);

// 自动转换为
const App = () => (
  ctx.libs.React.createElement('div', null,
    ctx.libs.React.createElement('h1', null, 'Hello')
  )
);
```

## 使用 React

在 JSX 中，**不需要手动导入或解构 React**，JSX 编译后会自动使用 `ctx.libs.React`：

```tsx
// 直接使用 JSX（编译后会自动使用 ctx.libs.React）
const App = () => <div>Hello</div>;

ctx.render(<App />);
```

只有在需要使用 React Hooks（如 `useState`、`useEffect`）或 `Fragment` 时，才需要解构：

```tsx
// 需要使用 Hooks 时才解构
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};
```

**注意**：`ctx.React` 已废弃，请统一使用 `ctx.libs.React`。

## 使用示例

- [基本 JSX 组件](./basic-jsx.md)
- [使用 ctx.libs.antd 组件](./use-antd-components.md)
- [使用 React Hooks](./use-react-hooks.md)
- [使用 Fragment](./use-fragment.md)

## 注意事项

- **不需要导入或解构 React**：JSX 编译后会自动使用 `ctx.libs.React.createElement`，直接使用 JSX 即可
- **建议使用 antd 组件**：使用 `ctx.libs.antd` 中的组件可以获得更好的主题效果、样式一致性和交互体验，而不是使用原生 HTML 元素
- **仅在需要 Hooks 时解构**：只有在使用 `useState`、`useEffect` 等 Hooks 或 `Fragment` 时才需要 `const { React } = ctx.libs;`
- **统一使用 ctx.libs.React**：不要使用 `ctx.React`（已废弃）或 `import React from 'react'`
- **支持完整的 JSX 语法**：包括组件、属性、Fragment（`<>...</>`）、条件渲染、列表渲染等
- **自动编译**：JSX 代码会在执行前自动编译，无需手动处理
- **在 JSX 中直接使用变量**：在 JSX 中应该直接使用 JavaScript 表达式和变量，如 `{ctx.user.name}`，而不是使用 `{{ }}` 模板语法
