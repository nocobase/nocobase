# Dialog Header/Footer

## custom chrome

```tsx
ctx.viewer.dialog({
  content: ({ view }) => (
    <>
      <view.Header title="Approval" />
      <div>Dialog body...</div>
      <view.Footer>
        <button onClick={() => view.close()}>Close</button>
      </view.Footer>
    </>
  ),
});
```
