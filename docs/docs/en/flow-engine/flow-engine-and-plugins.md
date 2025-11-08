# Relationship between FlowEngine and Plugins

**FlowEngine** is not a plugin, but a **core API** provided for plugins to use, connecting core capabilities with business extensions.
In NocoBase 2.0, all APIs are centralized in FlowEngine, and plugins can access FlowEngine via `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Centrally Managed Global Capabilities

FlowEngine provides a centralized **Context** that brings together the APIs needed for various scenarios, for example:

```ts
class PluginHello extends Plugin {
  async load() {
    // Router extension
    this.engine.context.router;

    // Make a request
    this.engine.context.api.request();

    // i18n related
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Note**:
> Context in 2.0 solves the following problems from 1.x:
>
> * Scattered context, inconsistent calls
> * Context is lost between different React render trees
> * Can only be used within React components
>
> For more details, see the **FlowContext chapter**.

---

## Shortcut Aliases in Plugins

To simplify calls, FlowEngine provides some aliases on the plugin instance:

* `this.context` → equivalent to `this.engine.context`
* `this.router` → equivalent to `this.engine.context.router`

## Example: Extending the Router

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// For example and testing scenarios
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

In this example:

* The plugin extends the route for the `/` path using the `this.router.add` method;
* `createMockClient` provides a clean mock application for easy demonstration and testing;
* `app.getRootComponent()` returns the root component, which can be directly mounted to the page.