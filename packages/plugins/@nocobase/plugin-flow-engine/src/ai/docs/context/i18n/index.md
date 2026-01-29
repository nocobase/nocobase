# ctx.i18n

i18next instance.

## Type Definition

```ts
interface i18n: {
  language: string;
  t: (key: string, options?: any) => string;
};
```

- `language`: current active locale code (e.g., `zh-CN`, `en-US`)
- `t(key, options?)`: translation function, equivalent to the app's `i18n.t`
