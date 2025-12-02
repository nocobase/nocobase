:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# createMockClient

Per gli esempi e i test, si consiglia generalmente di costruire rapidamente un'applicazione mock utilizzando `createMockClient`. Un'applicazione mock è un'applicazione pulita e vuota, senza alcun plugin attivato, destinata unicamente a esempi e test.

Ad esempio:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Per scenari di esempio e test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` fornisce `apiMock` per costruire dati API mock.

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

// Per scenari di esempio e test
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

Basandosi su `createMockClient`, possiamo estendere rapidamente le funzionalità tramite i plugin. Le API comuni per i `Plugin` includono:

- `plugin.router`: Estende le route
- `plugin.engine`: Motore frontend (NocoBase 2.0)
- `plugin.context`: Contesto (NocoBase 2.0)

Esempio 1: Aggiungere una route tramite il router.

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

// Per scenari di esempio e test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Introdurremo ulteriori contenuti nei capitoli successivi.