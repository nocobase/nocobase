# Inherit Context

## opt out of inheritance

```ts
ctx.viewer.drawer({
  inheritContext: false,
  content: () => <IndependentView />,
});
```
