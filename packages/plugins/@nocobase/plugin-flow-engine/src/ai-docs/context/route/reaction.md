# Reaction

## Watch Route Params

Use this snippet to watch route params.

```ts
return reaction(
  () => ctx.route?.params,
  (params) => {
    if (params) {
      effect(params);
    }
  },
);
```
