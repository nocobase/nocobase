:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# createMockClient

Para exemplos e testes, geralmente recomendamos que você construa rapidamente um aplicativo mock usando `createMockClient`. Um aplicativo mock é uma aplicação limpa e vazia, sem **plugins** ativados, destinada exclusivamente para exemplos e testes.

Por exemplo:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Para cenários de exemplo e teste
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

O `createMockClient` oferece o `apiMock` para construir dados de API mock.

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

// Para cenários de exemplo e teste
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

Com base no `createMockClient`, podemos estender rapidamente a funcionalidade através de **plugins**. As APIs comuns para **plugins** incluem:

- `plugin.router`: Estende rotas
- `plugin.engine`: Motor de frontend (NocoBase 2.0)
- `plugin.context`: Contexto (NocoBase 2.0)

Exemplo 1: Adicione uma rota via `router`.

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

// Para cenários de exemplo e teste
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Apresentaremos mais conteúdo nos próximos capítulos.