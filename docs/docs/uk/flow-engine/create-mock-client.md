:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# createMockClient

Для прикладів та тестування зазвичай рекомендується швидко створювати мок-додаток за допомогою `createMockClient`. Мок-додаток — це чистий, порожній додаток без активованих плагінів, призначений виключно для прикладів та тестування.

Наприклад:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Для прикладів та тестування
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` надає `apiMock` для створення мок-даних API.

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

// Для прикладів та тестування
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

Використовуючи `createMockClient`, ми можемо швидко розширювати функціональність за допомогою плагінів. До поширених API для `плагінів` належать:

- `plugin.router`: Розширення маршрутів
- `plugin.engine`: Фронтенд-рушій (NocoBase 2.0)
- `plugin.context`: Контекст (NocoBase 2.0)

Приклад 1: Додавання маршруту через router.

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

// Для прикладів та тестування
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Більше інформації ми розглянемо в наступних розділах.