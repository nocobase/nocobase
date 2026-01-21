:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# createMockClient

Při tvorbě příkladů a testů se obvykle doporučuje rychle vytvořit mock aplikaci pomocí `createMockClient`. Mock aplikace je čistá, prázdná aplikace bez aktivovaných pluginů, určená výhradně pro příklady a testování.

Například:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Pro příklady a testovací scénáře
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` poskytuje `apiMock` pro vytváření mock dat API.

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

// Pro příklady a testovací scénáře
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

Na základě `createMockClient` můžeme rychle rozšiřovat funkcionalitu pomocí pluginů. Mezi běžně používaná API pro `Plugin` patří:

- `plugin.router`: Rozšíření rout
- `plugin.engine`: Frontendový engine (NocoBase 2.0)
- `plugin.context`: Kontext (NocoBase 2.0)

Příklad 1: Přidání routy přes router.

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

// Pro příklady a testovací scénáře
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Další podrobnosti si představíme v následujících kapitolách.