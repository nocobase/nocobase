# ctx.blockModel

Модель родительского блока (экземпляр BlockModel), в которой размещены текущее **поле JS** / **JS-блок**. В **Поле JS**, **Элементе JS**, **JS-столбце таблицы** и т. д. `ctx.blockModel` обычно указывает на блок формы или блок таблицы, содержащий текущую JS-логику; в автономном **JS-блоке** значение может быть `null` или совпадать с `ctx.model`.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Поле JS** | Доступ к `form`, `collection`, `resource` родительского блока формы для связывания и валидации |
| **Элемент JS** | Доступ к `resource` и `collection` родительского блока таблицы/формы в элементах подтаблицы |
| **JS-столбец таблицы** | Доступ к `resource` родительского блока таблицы (например, `getSelectedRows`) и `collection` |
| **Действия формы / поток событий** | Использование `form` для валидации перед отправкой, `resource` для обновления и т. д. |

> **Примечание**: `ctx.blockModel` доступен только в контекстах RunJS, где есть родительский блок. В автономном **JS-блоке** (без родительской формы/таблицы) он может быть `null` — проверяйте перед использованием.

## Тип

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Точный тип зависит от родительского блока: блоки формы обычно `FormBlockModel` / `EditFormModel`, блоки таблицы — `TableBlockModel`.

## Основные свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `uid` | `string` | Уникальный идентификатор модели блока |
| `collection` | `Collection` | Коллекция, привязанная к блоку |
| `resource` | `Resource` | Экземпляр ресурса (`SingleRecordResource` / `MultiRecordResource` и т. д.) |
| `form` | `FormInstance` | Для блоков формы: экземпляр Ant Design Form (`getFieldsValue`, `validateFields`, `setFieldsValue` и т. д.) |
| `emitter` | `EventEmitter` | Эмиттер событий; можно слушать `formValuesChange`, `onFieldReset` и т. д. |

## Связь с ctx.model и ctx.form

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Родительский блок текущего JS** | `ctx.blockModel` |
| **Чтение/запись полей формы** | `ctx.form` (то же, что `ctx.blockModel?.form`; удобнее в блоках формы) |
| **Модель текущего контекста выполнения** | `ctx.model` (в **Поле JS** — модель поля, в **JS-блоке** — модель блока) |

В **Поле JS** `ctx.model` — это модель поля, а `ctx.blockModel` — блок формы или таблицы, в котором размещено поле; `ctx.form` обычно равен `ctx.blockModel.form`.

## Примеры

### Таблица: получение выбранных строк и обработка

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Please select data first');
  return;
}
```

### Форма: валидация и обновление

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Прослушивание изменений формы

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Реакция на актуальные значения формы или повторный рендер
});
```

### Принудительный повторный рендер блока

```ts
ctx.blockModel?.rerender?.();
```

## Примечания

- В **автономном JS-блоке** (без родительской формы/таблицы) `ctx.blockModel` может быть `null`; используйте опциональную цепочку: `ctx.blockModel?.resource?.refresh?.()`.
- В **Поле JS** / **Элементе JS** / **JS-столбце таблицы** `ctx.blockModel` обычно — блок формы или таблицы, в котором размещено поле; в **JS-блоке** это может быть сам блок или предок, в зависимости от иерархии.
- `resource` есть только у блоков данных; `form` — только у блоков формы; у блоков таблицы чаще всего `form` отсутствует.

## Связанные материалы

- [ctx.model](./model.md): модель текущего контекста выполнения
- [ctx.form](./form.md): экземпляр формы, часто используется в блоках формы
- [ctx.resource](./resource.md): экземпляр ресурса (то же, что `ctx.blockModel?.resource`, когда доступен)
- [ctx.getModel()](./get-model.md): получение другой модели блока по uid