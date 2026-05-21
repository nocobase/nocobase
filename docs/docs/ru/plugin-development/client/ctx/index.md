---
title: "Context (Контекст)"
description: "Механизм контекста клиента NocoBase: this.context в Plugin и useFlowContext() в компонентах — это один и тот же объект, отличаются лишь точки входа."
keywords: "Context,контекст,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context (Контекст)

В NocoBase **контекст (Context)** — это мост, связывающий код плагина с возможностями NocoBase. Через контекст Вы можете отправлять запросы, выполнять интернационализацию, писать логи, навигировать между страницами и т.д.

У контекста есть две точки доступа:

- **В Plugin**: `this.context`
- **В React-компонентах**: `useFlowContext()` (импортируется из `@nocobase/flow-engine`)

Оба возвращают **один и тот же объект** (экземпляр `FlowEngineContext`), различаются только сценарии использования.

## Использование в Plugin

В методах жизненного цикла плагина, таких как `load()`, доступ к контексту осуществляется через `this.context`:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 通过 this.context 访问上下文能力
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('应用信息', response.data);

    // 国际化：this.t() 会自动注入插件包名作为 namespace
    console.log(this.t('Hello'));
  }
}
```

## Использование в компонентах

В React-компонентах через `useFlowContext()` получают тот же объект контекста:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Сокращённые свойства Plugin vs свойства ctx

Класс Plugin предоставляет ряд сокращённых свойств для удобного использования в `load()`. Однако обратите внимание: **некоторые сокращённые свойства класса Plugin и одноимённые свойства на ctx указывают на разные вещи**:

| Сокращённое свойство Plugin | Указывает на          | Назначение                            |
| --------------------------- | --------------------- | ------------------------------------- |
| `this.router`               | RouterManager         | Регистрация маршрутов через `.add()`  |
| `this.pluginSettingsManager` | PluginSettingsManager | Регистрация страницы настроек плагина (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`           | Экземпляр FlowEngine  | Регистрация FlowModel                 |
| `this.t()`                  | i18n.t() + автоматический ns | Интернационализация, автоматически подставляет имя пакета плагина |
| `this.context`              | FlowEngineContext     | Объект контекста, тот же, что и useFlowContext() |

Самые путающиеся — `this.router` и `ctx.router`:

- **`this.router`** (сокращённое свойство Plugin) → RouterManager, используется для **регистрации маршрутов** (`.add()`)
- **`ctx.router`** (свойство контекста) → экземпляр React Router, используется для **навигации между страницами** (`.navigate()`)

```ts
// Plugin 里：注册路由
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// 组件里：页面导航
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Распространённые возможности, предоставляемые контекстом

Здесь перечислены распространённые возможности контекста. При этом некоторые доступны только в Plugin, другие — только в компонентах, третьи — в обоих местах, но с разным синтаксисом.

| Возможность | Plugin (`this.xxx`)            | Component (`ctx.xxx`)        | Описание                          |
| ---------- | ------------------------------ | ---------------------------- | --------------------------------- |
| API-запрос | `this.context.api`             | `ctx.api`                    | Использование одинаковое          |
| Интернационализация | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` автоматически подставляет namespace плагина |
| Логирование | `this.context.logger`          | `ctx.logger`                 | Использование одинаковое          |
| Регистрация маршрута | `this.router.add()`            | -                            | Только в Plugin                   |
| Навигация | -                              | `ctx.router.navigate()`      | Только в компонентах              |
| Информация о маршруте | `this.context.location`        | `ctx.route` / `ctx.location` | Рекомендуется использовать в компонентах |
| Управление видами | `this.context.viewer`         | `ctx.viewer`                 | Открытие модальных окон / выдвижных панелей и т.д. |
| FlowEngine | `this.flowEngine`              | -                            | Только в Plugin                   |

Подробное использование и примеры кода для каждой возможности см. в [Распространённые возможности](./common-capabilities).

## Связанные ссылки

- [Распространённые возможности](./common-capabilities) — подробное использование ctx.api, ctx.t, ctx.logger и т.д.
- [Plugin (Плагин)](../plugin) — точка входа плагина и сокращённые свойства
- [Разработка Component-компонентов](../component/index.md) — базовое использование useFlowContext в компонентах
