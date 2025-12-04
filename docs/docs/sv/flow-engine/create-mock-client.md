:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# createMockClient

För exempel och tester rekommenderas det vanligtvis att snabbt bygga en mock-applikation med hjälp av `createMockClient`. En mock-applikation är en ren, tom applikation utan aktiverade plugin, endast avsedd för exempel och tester.

Till exempel:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// För exempel- och testscenarier
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` tillhandahåller `apiMock` för att bygga mock-API-data.

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

// För exempel- och testscenarier
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

Med `createMockClient` kan vi snabbt utöka funktionaliteten via plugin. Vanliga API:er för `Plugin` inkluderar:

- `plugin.router`: Utöka rutter
- `plugin.engine`: Frontend-motor (NocoBase 2.0)
- `plugin.context`: Kontext (NocoBase 2.0)

Exempel 1: Lägg till en rutt via routern.

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

// För exempel- och testscenarier
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Mer innehåll presenterar vi i kommande kapitel.