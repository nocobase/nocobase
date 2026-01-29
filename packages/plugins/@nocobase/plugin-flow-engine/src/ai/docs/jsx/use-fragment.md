---
title: "使用 Fragment"
description: "在 JSX 中使用 Fragment 包裹多个元素"
---

# 使用 Fragment

在 JSX 中使用 Fragment 包裹多个元素，避免添加额外的 DOM 节点。

## 推荐：使用简写语法

```tsx
// 推荐：使用简写语法（不需要解构）
const App = () => (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);

ctx.render(<App />);
```

## 使用 Fragment（需要解构）

```tsx
// 或使用 Fragment（需要解构）
const { React } = ctx.libs;
const { Fragment } = React;

const AppWithFragment = () => (
  <Fragment>
    <h1>Title</h1>
    <p>Content</p>
  </Fragment>
);

ctx.render(<AppWithFragment />);
```
