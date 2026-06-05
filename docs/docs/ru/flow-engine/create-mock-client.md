:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# createMockClient

Для примеров и тестирования обычно рекомендуется быстро собирать мок-приложение с помощью `createMockClient`. Мок-приложение — это чистое, пустое приложение без активированных плагинов, предназначенное исключительно для примеров и тестирования.

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

`createMockClient` предоставляет `apiMock` для создания мок-данных API.

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

Используя `createMockClient`, мы можем быстро расширять функциональность с помощью плагинов. К часто используемым API `плагина` относятся:

- `plugin.router`: Расширение маршрутов
- `plugin.engine`: Фронтенд-движок (NocoBase 2.0)
- `plugin.context`: Контекст (NocoBase 2.0)

Пример 1: Добавление маршрута через роутер.

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

Более подробную информацию мы представим в последующих главах.