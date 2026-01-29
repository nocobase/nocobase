---
title: "Drawer Header/Footer"
description: "Use ctx.viewer.drawer to implement Drawer Header/Footer."
---

# Drawer Header/Footer

## custom layout

```tsx
ctx.viewer.drawer({
  content: ({ view }) => (
    <>
      <view.Header title="Edit" />
      <div>Form body...</div>
      <view.Footer>
        <button onClick={() => view.close()}>Cancel</button>
      </view.Footer>
    </>
  ),
});
```
