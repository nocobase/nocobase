# Связь FlowEngine и плагинов

**FlowEngine** — это не плагин, а **ядро API**, предоставляемое для использования плагинами и связывающее базовые возможности с бизнес-расширениями.
В NocoBase 2.0 все API централизованы в FlowEngine, и плагины получают к нему доступ через `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: централизованное управление глобальными возможностями
FlowEngine предоставляет централизованный **Context**, в котором собраны API для разных сценариев, например:

```ts
class PluginHello extends Plugin {
  async load() {
    // Расширение роутера (Router extension)
    this.engine.context.router;

    // Выполнить запрос (Make a request)
    this.engine.context.api.request();

    // i18n related
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Примечание**:
> Context в 2.0 решает следующие проблемы из 1.x:
>
> * Разрозненный контекст и несогласованные вызовы
> * Потеря контекста между разными деревьями рендера React
> * Возможность использования только внутри React-компонентов
>
> Подробнее см. в главе **FlowContext**.

---

## Сокращенные алиасы в плагинах
Чтобы упростить вызовы, FlowEngine предоставляет алиасы на экземпляре плагина:

* `this.context` → эквивалент `this.engine.context`
* `this.router` → эквивалент `this.engine.context.router`

## Пример: расширение Router

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

* Плагин расширяет маршрут для пути `/` через метод `this.router.add`;
* `createMockClient` предоставляет чистое mock-приложение для удобной демонстрации и тестирования;
* `app.getRootComponent()` возвращает корневой компонент, который можно напрямую монтировать на страницу.