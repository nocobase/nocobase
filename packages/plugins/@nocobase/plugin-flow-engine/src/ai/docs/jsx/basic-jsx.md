---
title: "基本 JSX 组件"
description: "使用 JSX 创建基本的 React 组件"
---

# 基本 JSX 组件

使用 JSX 创建基本的 React 组件。

```tsx
const App = () => (
  <div style={{ padding: 12 }}>
    <h3 style={{ margin: 0, color: '#1890ff' }}>Hello JSX</h3>
    <div style={{ color: '#555' }}>This block is rendered by JSX.</div>
  </div>
);

ctx.render(<App />);
```
