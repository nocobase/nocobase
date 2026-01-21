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
