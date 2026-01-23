:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Связь между FlowEngine и плагинами

**FlowEngine** — это не плагин, а **основной API**, который предоставляется плагинам для использования. Он служит для соединения базовых возможностей ядра с расширениями бизнес-логики.
В NocoBase 2.0 все API централизованы в FlowEngine, и плагины могут получить к нему доступ через `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Централизованное управление глобальными возможностями
FlowEngine предоставляет централизованный **Context**, который объединяет API, необходимые для различных сценариев. Например:

```ts
class PluginHello extends Plugin {
  async load() {
    // Расширение маршрутизации
    this.engine.context.router;

    // Отправка запроса
    this.engine.context.api.request();

    // Связанное с интернационализацией (i18n)
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Примечание**:
> В версии 2.0 Context решает следующие проблемы, существовавшие в версии 1.x:
>
> * Разрозненный контекст, непоследовательные вызовы
> * Потеря контекста между различными деревьями рендеринга React
> * Возможность использования только внутри компонентов React
>
> Подробнее см. в **главе FlowContext**.

---

## Сокращенные псевдонимы в плагинах
Для упрощения вызовов FlowEngine предоставляет несколько псевдонимов в экземпляре плагина:

* `this.context` → эквивалентно `this.engine.context`
* `this.router` → эквивалентно `this.engine.context.router`

## Пример: Расширение маршрутизации

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

В этом примере:

* Плагин расширяет маршрут для пути `/` с помощью метода `this.router.add`;
* `createMockClient` предоставляет чистое мок-приложение для удобной демонстрации и тестирования;
* `app.getRootComponent()` возвращает корневой компонент, который можно напрямую монтировать на страницу.