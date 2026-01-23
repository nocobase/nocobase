:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# createMockClient

Für Beispiele und Tests empfiehlt es sich in der Regel, schnell eine Mock-Anwendung mit `createMockClient` zu erstellen. Eine Mock-Anwendung ist eine saubere, leere Anwendung ohne aktivierte Plugins, die ausschließlich für Beispiele und Tests gedacht ist.

Zum Beispiel:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Für Beispiel- und Testszenarien
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` stellt `apiMock` zur Verfügung, um Mock-API-Daten zu erstellen.

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

// Für Beispiel- und Testszenarien
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

Basierend auf `createMockClient` können Sie Funktionen schnell über Plugins erweitern. Gängige APIs für Plugins sind:

- `plugin.router`: Routen erweitern
- `plugin.engine`: Frontend-Engine (NocoBase 2.0)
- `plugin.context`: Kontext (NocoBase 2.0)

Beispiel 1: Fügen Sie eine Route über den Router hinzu.

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

// Für Beispiel- und Testszenarien
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Weitere Inhalte stellen wir Ihnen in den folgenden Kapiteln vor.