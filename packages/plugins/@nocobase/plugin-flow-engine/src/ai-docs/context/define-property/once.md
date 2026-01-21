# Once

## Register Once Property

`once: true` keeps the first definition and ignores later calls.

```ts
ctx.defineProperty('once', {
  once: true,
  get: () => `initial-${uid()}`,
});

// This call is ignored because the property was already defined with once: true
ctx.defineProperty('once', {
  get: () => `should-not-override-${uid()}`,
});
```

## Register Override Property

Without `once`, the later definition overrides the earlier one.

```ts
ctx.defineProperty('override', {
  get: () => `first-${uid()}`,
});
ctx.defineProperty('override', {
  get: () => `second-${uid()}`,
});
```
