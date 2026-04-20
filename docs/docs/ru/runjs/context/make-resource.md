:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Создает** и возвращает новый экземпляр ресурса, **не** записывая и не изменяя `ctx.resource`. Подходит для сценариев, требующих нескольких независимых ресурсов или временного использования.

## Применимость

| Сценарий | Описание |
|------|------|
| **Несколько ресурсов** | Одновременная загрузка нескольких источников данных (например, список пользователей + список заказов), где каждый использует отдельный ресурс. |
| **Временные запросы** | Одноразовые запросы, которые не используются повторно и не требуют привязки к `ctx.resource`. |
| **Вспомогательные данные** | Использование `ctx.resource` для основных данных и `makeResource` для создания экземпляров дополнительных данных. |

Если вам нужен только один ресурс и вы хотите привязать его к `ctx.resource`, целесообразнее использовать [ctx.initResource()](./init-resource.md).

## Определение типов

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Параметр | Тип | Описание |
|------|------|------|
| `resourceType` | `string` | Тип ресурса: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Возвращаемое значение**: Новый созданный экземпляр ресурса.

## Отличие от ctx.initResource()

| Метод | Поведение |
|------|------|
| `ctx.makeResource(type)` | Только создает и возвращает новый экземпляр, **не** записывая его в `ctx.resource`. Можно вызывать несколько раз для получения нескольких независимых ресурсов. |
| `ctx.initResource(type)` | Создает и привязывает, если `ctx.resource` не существует; возвращает его напрямую, если он уже существует. Гарантирует доступность `ctx.resource`. |

## Примеры

### Одиночный ресурс

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource сохраняет свое исходное значение (если оно было)
```

### Несколько ресурсов

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Количество пользователей: {usersRes.getData().length}</p>
    <p>Количество заказов: {ordersRes.getData().length}</p>
  </div>
);
```

### Временный запрос

```ts
// Одноразовый запрос, не засоряющий ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Примечания

- Для вновь созданного ресурса необходимо вызвать `setResourceName(name)`, чтобы указать коллекцию, а затем загрузить данные с помощью `refresh()`.
- Каждый экземпляр ресурса независим и не влияет на другие; подходит для параллельной загрузки нескольких источников данных.

## Связанные разделы

- [ctx.initResource()](./init-resource.md): Инициализация и привязка к `ctx.resource`
- [ctx.resource](./resource.md): Экземпляр ресурса в текущем контексте
- [MultiRecordResource](../resource/multi-record-resource) — Несколько записей / Список
- [SingleRecordResource](../resource/single-record-resource) — Одна запись
- [APIResource](../resource/api-resource) — Общий API-ресурс
- [SQLResource](../resource/sql-resource) — Ресурс SQL-запроса