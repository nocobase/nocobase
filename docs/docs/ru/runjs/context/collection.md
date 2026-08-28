# ctx.collection

Экземпляр коллекции (таблицы данных), связанный с текущим контекстом выполнения RunJS; используется для доступа к метаданным коллекции, определениям полей, первичному ключу и т. д. Обычно берётся из `ctx.blockModel.collection` или `ctx.collectionField?.collection`.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок** | Коллекция, привязанная к блоку; доступ к `name`, `getFields`, `filterTargetKey` и т. д. |
| **Поле JS / Элемент JS / JS-столбец таблицы** | Коллекция текущего поля или родительского блока; получение списка полей, первичного ключа и т. д. |
| **Столбец таблицы / блок деталей** | Рендер на основе структуры коллекции, передача `filterByTk` при открытии всплывающего окна и т. д. |

> **Примечание**: `ctx.collection` доступен, когда контекст привязан к блоку данных, формы или таблицы. В автономном **JS-блоке** без привязки к коллекции может быть `null` — проверяйте перед использованием.

## Тип

```ts
collection: Collection | null | undefined;
```

## Основные свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `name` | `string` | Имя коллекции (например, `users`, `orders`) |
| `title` | `string` | Заголовок коллекции (i18n) |
| `filterTargetKey` | `string \| string[]` | Имя (имена) поля первичного ключа; используется в `filterByTk`, `getFilterByTK` |
| `dataSourceKey` | `string` | Ключ источника данных (например, `main`) |
| `dataSource` | `DataSource` | Экземпляр источника данных |
| `template` | `string` | Шаблон коллекции (например, `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Поля, пригодные для отображения в качестве заголовка |
| `titleCollectionField` | `CollectionField` | Экземпляр поля заголовка |

## Основные методы

| Метод | Описание |
|-------|----------|
| `getFields(): CollectionField[]` | Все поля (включая унаследованные) |
| `getField(name: string): CollectionField \| undefined` | Получить одно поле по имени |
| `getFieldByPath(path: string): CollectionField \| undefined` | Получить поле по пути (поддерживает ассоциации, например `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Получить поля ассоциации; `types`, например `['one']`, `['many']` |
| `getFilterByTK(record): any` | Получить значение первичного ключа из записи для API `filterByTk` |

## Связь с ctx.collectionField и ctx.blockModel

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Коллекция текущего контекста** | `ctx.collection` (то же, что `ctx.blockModel?.collection` или `ctx.collectionField?.collection`) |
| **Коллекция текущего поля** | `ctx.collectionField?.collection` |
| **Целевая коллекция поля ассоциации** | `ctx.collectionField?.targetCollection` |

В подтаблицах и похожих сценариях `ctx.collection` может указывать на целевую коллекцию ассоциации; в обычной форме или таблице это чаще коллекция блока.

## Примеры

### Получение первичного ключа и открытие всплывающего окна

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Перебор полей для валидации и связывания

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} is required`);
    return;
  }
}
```

### Получение полей ассоциации

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Для подтаблиц, ресурсов ассоциации и т. д.
```

## Примечания

- `filterTargetKey` — имя поля первичного ключа коллекции; в некоторых коллекциях это `string[]` (составной ключ). Частый запасной вариант — `'id'`.
- В **подтаблицах и полях ассоциации** `ctx.collection` может указывать на целевую коллекцию ассоциации и отличаться от `ctx.blockModel.collection`.
- `getFields()` объединяет унаследованные поля коллекции; локальные поля переопределяют унаследованные с тем же именем.

## Связанные материалы

- [ctx.collectionField](./collection-field.md): определение поля коллекции для текущего поля
- [ctx.blockModel](./block-model.md): родительский блок текущего JS; содержит `collection`
- [ctx.model](./model.md): текущая модель; также может иметь `collection`