:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# createMockClient

Pour les exemples et les tests, il est généralement recommandé de construire rapidement une application mock en utilisant `createMockClient`. Une application mock est une application vide et propre, sans aucun plugin activé, et est destinée uniquement aux exemples et aux tests.

Par exemple :

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Pour les scénarios d'exemple et de test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` offre `apiMock` pour simuler des données d'API.

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

// Pour les scénarios d'exemple et de test
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

En utilisant `createMockClient`, nous pouvons rapidement étendre les fonctionnalités via des plugins. Les API courantes du `Plugin` incluent :

- `plugin.router` : Étendre les routes
- `plugin.engine` : Moteur frontend (NocoBase 2.0)
- `plugin.context` : Contexte (NocoBase 2.0)

Exemple 1 : Ajouter une route via le routeur.

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

// Pour les scénarios d'exemple et de test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Nous aborderons plus de contenu dans les chapitres suivants.