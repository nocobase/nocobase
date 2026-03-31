:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# createMockClient

Para ejemplos y pruebas, generalmente le recomendamos construir rápidamente una aplicación Mock (simulada) utilizando `createMockClient`. Una aplicación Mock es una aplicación limpia y vacía, sin ningún plugin activado, diseñada únicamente para propósitos de ejemplo y prueba.

Por ejemplo:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Para escenarios de ejemplo y prueba
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` le proporciona `apiMock` para construir datos de API simulados.

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

// Para escenarios de ejemplo y prueba
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

Basándose en `createMockClient`, podemos extender rápidamente la funcionalidad a través de los plugins. Las API comunes para `Plugin` incluyen:

- `plugin.router`: Extender rutas
- `plugin.engine`: Motor de frontend (NocoBase 2.0)
- `plugin.context`: Contexto (NocoBase 2.0)

Ejemplo 1: Añadir una ruta a través del router.

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

// Para escenarios de ejemplo y prueba
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Introduciremos más contenido en capítulos posteriores.