:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Зв'язок між FlowEngine та плагінами

**FlowEngine** — це не плагін, а **ядро API**, яке надається плагінам для використання. Воно слугує для зв'язку між основними можливостями системи та розширеннями бізнес-логіки.
У NocoBase 2.0 усі API централізовані у FlowEngine, і плагіни можуть отримати доступ до FlowEngine через `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Централізоване керування глобальними можливостями

FlowEngine надає централізований **Context**, який об'єднує API, необхідні для різних сценаріїв, наприклад:

```ts
class PluginHello extends Plugin {
  async load() {
    // Розширення маршрутизації
    this.engine.context.router;

    // Зробити запит
    this.engine.context.api.request();

    // Пов'язано з інтернаціоналізацією
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Примітка**:
> Context у версії 2.0 вирішує наступні проблеми, що існували у версії 1.x:
>
> * Розпорошений контекст, неузгоджені виклики
> * Втрата контексту між різними деревами рендерингу React
> * Можливість використання лише всередині компонентів React
>
> Докладніше дивіться у **розділі FlowContext**.

---

## Скорочені псевдоніми в плагінах

Для спрощення викликів FlowEngine надає кілька псевдонімів в екземплярі плагіна:

* `this.context` → еквівалентно `this.engine.context`
* `this.router` → еквівалентно `this.engine.context.router`

## Приклад: Розширення маршрутизації

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

// Для прикладів та сценаріїв тестування
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

У цьому прикладі:

* Плагін розширює маршрут для шляху `/` за допомогою методу `this.router.add`;
* `createMockClient` надає чистий мок-додаток для зручної демонстрації та тестування;
* `app.getRootComponent()` повертає кореневий компонент, який можна безпосередньо монтувати на сторінку.