:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/collection).
:::

# ctx.collection

Экземпляр коллекции (Collection), связанный с текущим контекстом выполнения RunJS. Используется для доступа к метаданным коллекции, определениям полей, первичным ключам и другим конфигурациям. Обычно поступает из `ctx.blockModel.collection` или `ctx.collectionField?.collection`.

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **JSBlock** | Коллекция, привязанная к блоку; позволяет получить доступ к `name`, `getFields`, `filterTargetKey` и т. д. |
| **JSField / JSItem / JSColumn** | Коллекция, к которой относится текущее поле (или коллекция родительского блока), используется для получения списков полей, первичных ключей и т. д. |
| **Столбец таблицы / Блок сведений** | Используется для рендеринга на основе структуры коллекции или передачи `filterByTk` при открытии всплывающих окон. |

> Примечание: `ctx.collection` доступен в сценариях, где блок данных, блок формы или блок таблицы привязан к коллекции. В независимом JSBlock, который не привязан к коллекции, значение может быть `null`. Перед использованием рекомендуется проверять на наличие значения.

## Определение типа

```ts
collection: Collection | null | undefined;
```

## Общие свойства

| Свойство | Тип | Описание |
|------|------|------|
| `name` | `string` | Имя коллекции (например, `users`, `orders`) |
| `title` | `string` | Заголовок коллекции (включая интернационализацию) |
| `filterTargetKey` | `string \| string[]` | Имя поля первичного ключа, используется для `filterByTk` и `getFilterByTK` |
| `dataSourceKey` | `string` | Ключ источника данных (например, `main`) |
| `dataSource` | `DataSource` | Экземпляр источника данных, к которому принадлежит коллекция |
| `template` | `string` | Шаблон коллекции (например, `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Список полей, которые могут отображаться в качестве заголовков |
| `titleCollectionField` | `CollectionField` | Экземпляр поля заголовка |

## Общие методы

| Метод | Описание |
|------|------|
| `getFields(): CollectionField[]` | Получить все поля (включая унаследованные) |
| `getField(name: string): CollectionField \| undefined` | Получить одно поле по его имени |
| `getFieldByPath(path: string): CollectionField \| undefined` | Получить поле по пути (поддерживает связи, например, `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Получить поля связей; `types` может принимать значения `['one']`, `['many']` и т. д. |
| `getFilterByTK(record): any` | Извлечь значение первичного ключа из записи, используется для `filterByTk` в API |

## Связь с ctx.collectionField и ctx.blockModel

| Требование | Рекомендуемое использование |
|------|----------|
| **Коллекция, связанная с текущим контекстом** | `ctx.collection` (эквивалентно `ctx.blockModel?.collection` или `ctx.collectionField?.collection`) |
| **Определение коллекции текущего поля** | `ctx.collectionField?.collection` (коллекция, к которой принадлежит поле) |
| **Целевая коллекция связи** | `ctx.collectionField?.targetCollection` (целевая коллекция поля связи) |

В таких сценариях, как подтаблицы, `ctx.collection` может быть целевой коллекцией связи; в обычных формах или таблицах это обычно коллекция, привязанная к блоку.

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

### Перебор полей для валидации или настройки связей

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} обязательно для заполнения`);
    return;
  }
}
```

### Получение полей связей

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Используется для создания подтаблиц, связанных ресурсов и т. д.
```

## Примечания

- `filterTargetKey` — это имя поля первичного ключа коллекции. Некоторые коллекции могут использовать составные первичные ключи типа `string[]`. Если ключ не настроен, в качестве резервного варианта обычно используется `'id'`.
- В сценариях с **подтаблицами или полями связей** `ctx.collection` может указывать на целевую коллекцию связи, что отличается от `ctx.blockModel.collection`.
- `getFields()` объединяет поля из унаследованных коллекций; локальные поля переопределяют унаследованные поля с тем же именем.

## Связанные разделы

- [ctx.collectionField](./collection-field.md): Определение поля коллекции для текущего поля
- [ctx.blockModel](./block-model.md): Родительский блок, содержащий текущий JS, включая `collection`
- [ctx.model](./model.md): Текущая модель, которая может содержать `collection`