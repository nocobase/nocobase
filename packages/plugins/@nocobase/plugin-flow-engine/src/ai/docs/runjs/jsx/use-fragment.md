---
title: "Use Fragment"
description: "Wrap multiple elements with Fragment in JSX"
---

# Use Fragment

Use Fragment in JSX to wrap multiple elements and avoid adding extra DOM nodes.

## Recommended: Shorthand syntax

```tsx
// Recommended: shorthand syntax (no destructuring needed)
const App = () => (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);

ctx.render(<App />);
```

## Use Fragment (requires destructuring)

```tsx
// Or use Fragment (requires destructuring)
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
