# ctx.model

Экземпляр `FlowModel` для текущего контекста выполнения RunJS; базовая точка входа для JS-блока, поля JS, действия JS и т. д. Конкретный тип зависит от контекста: например, `BlockModel`, `ActionModel`, `JSEditableFieldModel`.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок** | `ctx.model` — модель блока; доступ к `resource`, `collection`, `setProps` и т. д. |
| **Поле JS / Элемент JS / JS-столбец таблицы** | `ctx.model` — модель поля; доступ к `setProps`, `dispatchEvent` и т. д. |
| **События действий / ActionModel** | `ctx.model` — модель действия; чтение и запись параметров шага, отправка событий и т. д. |

> Для **родительского блока**, в котором выполняется текущий JS (например, блок формы или таблицы), используйте `ctx.blockModel`; для **других моделей** — `ctx.getModel(uid)`.

## Тип

```ts
model: FlowModel;
```

`FlowModel` — базовый тип; во время выполнения это подкласс (например, `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`). Набор свойств и методов зависит от конкретного типа.

## Основные свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `uid` | `string` | Уникальный идентификатор модели; используется в `ctx.getModel(uid)` и привязках всплывающего окна |
| `collection` | `Collection` | Коллекция, связанная с моделью (когда блок или поле привязаны к данным) |
| `resource` | `Resource` | Экземпляр ресурса; `refresh`, выбранные строки и т. д. |
| `props` | `object` | Конфигурация UI и поведения; обновляется через `setProps` |
| `subModels` | `Record<string, FlowModel>` | Дочерние модели (например, поля формы, столбцы таблицы) |
| `parent` | `FlowModel` | Родительская модель (если есть) |

## Основные методы

| Метод | Описание |
|-------|----------|
| `setProps(partialProps: any): void` | Обновляет конфигурацию модели и запускает повторный рендер (например, `ctx.model.setProps({ loading: true })`) |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Отправляет событие в модель; запускает потоки, подписанные на это событие. Можно передать `payload`; `options.debounce` — для дебаунса |
| `getStepParams?.(flowKey, stepKey)` | Чтение параметров шага потока (панель настроек, пользовательские действия и т. д.) |
| `setStepParams?.(flowKey, stepKey, params)` | Запись параметров шага потока |

## Связь с ctx.blockModel и ctx.getModel

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Модель текущего контекста выполнения** | `ctx.model` |
| **Родительский блок текущего JS** | `ctx.blockModel`; через него удобно работать с `resource`, `form`, `collection` |
| **Любая модель по uid** | `ctx.getModel(uid)` или `ctx.getModel(uid, true)` (по стеку представлений) |

В поле JS `ctx.model` — модель поля, а `ctx.blockModel` — блок формы или таблицы, в котором это поле размещено.

## Примеры

### Обновление состояния блока или действия

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Отправка события модели

```ts
// Отправка события для запуска рабочего процесса, настроенного на этой модели и прослушивающего это имя события
await ctx.model.dispatchEvent('remove');

// Если передан payload, он будет доступен в ctx.inputArgs обработчика рабочего процесса
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Использование uid для всплывающего окна или межмодельной логики

```ts
const myUid = ctx.model.uid;
// В конфигурации всплывающего окна можно передать openerUid: myUid для установления связи
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Связанные материалы

- [ctx.blockModel](./block-model.md): родительский блок текущего JS
- [ctx.getModel()](./get-model.md): получение другой модели по uid