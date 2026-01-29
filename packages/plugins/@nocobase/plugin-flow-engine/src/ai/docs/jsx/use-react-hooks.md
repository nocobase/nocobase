---
title: "使用 React Hooks"
description: "在 JSX 组件中使用 React Hooks"
---

# 使用 React Hooks

在 JSX 组件中使用 React Hooks（如 `useState`、`useEffect` 等）。

```tsx
const { useState } = ctx.libs.React;
const { Button } = ctx.libs.antd;

const Counter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>Increment</Button>
    </div>
  );
};

ctx.render(<Counter />);
```
