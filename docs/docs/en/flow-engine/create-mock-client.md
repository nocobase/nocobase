# createMockClient

For examples and tests, it is generally recommended to quickly build a mock application using `createMockClient`. A mock application is a clean, empty application with no plugins activated, intended solely for examples and testing.

For example:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// For example and test scenarios
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` provides `apiMock` to build mock API data.

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    const { data } = await this.context.api.request({
      method: 'get',
      url: 'users',
    });
  }
}

// For example and test scenarios
const app = createMockClient({
  plugins: [PluginHelloModel],
});

app.apiMock.onGet('users').reply(200, {
  data: {
    id: 1,
    name: 'John Doe',
  },
});

export default app.getRootComponent();
```

Based on `createMockClient`, we can quickly extend functionality through plugins. Common APIs for `Plugin` include:

- plugin.router: Extend routes
- plugin.engine: Frontend engine (NocoBase 2.0)
- plugin.context: Context (NocoBase 2.0)

Example 1: Add a route via the router.

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

// For example and test scenarios
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

We will introduce more content in subsequent chapters.