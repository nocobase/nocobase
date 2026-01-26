---
title: "Embed Header/Footer"
description: "Use ctx.viewer.embed to implement Embed Header/Footer."
---

# Embed Header/Footer

## chrome in embed

```tsx
ctx.viewer.embed({
  content: ({ view }) => (
    <>
      <view.Header title="Embed" />
      <div>Embedded content</div>
      <view.Footer>Footer</view.Footer>
    </>
  ),
});
```
