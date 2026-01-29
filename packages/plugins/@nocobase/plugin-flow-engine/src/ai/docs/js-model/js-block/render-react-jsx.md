---
title: "Render React (JSX)"
description: "Render a simple React component using JSX syntax."
---

# Render React (JSX)

Render a simple React component using JSX syntax

```ts
// Render a React component with JSX
const { React } = ctx.libs;

const App = () => (
  <div style={{ padding: 12 }}>
    <h3 style={{ margin: 0, color: '#1890ff' }}>Hello JSX</h3>
    <div style={{ color: '#555' }}>This block is rendered by JSX.</div>
  </div>
);

ctx.render(<App />);
```
