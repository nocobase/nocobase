# createMockClient

Для примеров и тестов обычно рекомендуется быстро собрать mock-приложение с помощью `createMockClient`. Mock-приложение — это чистое пустое приложение без активированных плагинов, предназначенное только для примеров и тестирования.

Например:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Для примеров и тестовых сценариев
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` предоставляет `apiMock` для построения mock-данных API.

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

// Для примеров и тестовых сценариев
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

На основе `createMockClient` можно быстро расширять функциональность через плагины. Часто используемые API в `Plugin`:

- plugin.router: расширение маршрутов
- plugin.engine: frontend-движок (NocoBase 2.0)
- plugin.context: контекст (NocoBase 2.0)

Пример 1: добавление маршрута через router.

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

// Для примеров и тестовых сценариев
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Больше материалов будет в следующих главах.