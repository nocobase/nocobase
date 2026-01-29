# ctx.route

`ctx.route(options)` navigates within the Flow runtime. Provide at least one of `name`, `path`, or `pathname` plus optional `params` to build the final URL.

```ts
type RouteOptions = {
  name?: string;
  path?: string;
  pathname?: string;
  params?: Record<string, any>;
};
```
