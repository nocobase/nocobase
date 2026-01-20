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

## Examples

- **Basic navigation** (`@nocobase/plugin-flow-engine/src/ai-docs/context/route/basic.ts`) pushes to another page with params.
- **Route reaction** (`@nocobase/plugin-flow-engine/src/ai-docs/context/route/reaction.ts`) watches route changes and reacts inside the model.
- **Advanced reactions** (`@nocobase/plugin-flow-engine/src/ai-docs/context/route/reaction2.ts`) demonstrates unsubscribing and multiple listeners.
