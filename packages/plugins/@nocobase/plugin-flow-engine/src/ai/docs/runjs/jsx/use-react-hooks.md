---
title: "Use React Hooks"
description: "Use React Hooks in JSX components"
---

# Use React Hooks

Use React Hooks in JSX components (e.g., `useState`, `useEffect`).

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
