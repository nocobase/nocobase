:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# createMockClient

W przypadku przykładów i testów zazwyczaj zaleca się szybkie tworzenie aplikacji Mock za pomocą `createMockClient`. Aplikacja Mock to czysta, pusta aplikacja, w której nie aktywowano żadnych wtyczek, przeznaczona wyłącznie do przykładów i testów.

Na przykład:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Dla przykładów i scenariuszy testowych
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` udostępnia `apiMock` do tworzenia danych API Mock.

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

// Dla przykładów i scenariuszy testowych
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

Bazując na `createMockClient`, możemy szybko rozszerzać funkcjonalność za pomocą wtyczek. Często używane API dla `Plugin` obejmują:

- plugin.router: Rozszerzanie tras
- plugin.engine: Silnik front-endowy (NocoBase 2.0)
- plugin.context: Kontekst (NocoBase 2.0)

Przykład 1: Dodawanie trasy za pomocą routera.

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

// Dla przykładów i scenariuszy testowych
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Więcej treści przedstawimy w kolejnych rozdziałach.