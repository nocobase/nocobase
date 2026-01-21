:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# createMockClient

Voor voorbeelden en tests wordt over het algemeen aanbevolen om snel een mock-applicatie te bouwen met behulp van `createMockClient`. Een mock-applicatie is een schone, lege applicatie zonder geactiveerde plugins, uitsluitend bedoeld voor voorbeelden en tests.

Bijvoorbeeld:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Voor voorbeeld- en testscenario's
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` biedt `apiMock` om mock API-gegevens te bouwen.

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

// Voor voorbeeld- en testscenario's
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

Op basis van `createMockClient` kunnen we snel functionaliteit uitbreiden via plugins. Veelgebruikte API's voor een `plugin` zijn:

- `plugin.router`: Routes uitbreiden
- `plugin.engine`: Frontend-engine (NocoBase 2.0)
- `plugin.context`: Context (NocoBase 2.0)

Voorbeeld 1: Voeg een route toe via de router.

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

// Voor voorbeeld- en testscenario's
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Meer informatie introduceren we in de volgende hoofdstukken.