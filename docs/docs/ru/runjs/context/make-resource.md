# ctx.makeResource()

**Создаёт** новый экземпляр ресурса и возвращает его; при этом **не** устанавливает и не изменяет `ctx.resource`. Используется, когда нужны несколько ресурсов или временный ресурс.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Несколько ресурсов** | Загрузка нескольких источников данных (например, users + orders), у каждого свой ресурс |
| **Разовый запрос** | Разовый запрос без привязки к `ctx.resource` |
| **Вспомогательные данные** | Основные данные в `ctx.resource`, дополнительные — через экземпляр из `makeResource` |

Если нужен только один ресурс и он должен быть доступен как `ctx.resource`, используйте [ctx.initResource()](./init-resource.md).

## Тип

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `resourceType` | `string` | `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Возвращает**: новый экземпляр ресурса.

## Связь с ctx.initResource()

| Метод | Поведение |
|-------|-----------|
| `ctx.makeResource(type)` | Создаёт и возвращает ресурс; **не** присваивает в `ctx.resource`; можно вызывать многократно для нескольких ресурсов |
| `ctx.initResource(type)` | Создаёт и привязывает, если ресурса нет; иначе возвращает существующий. Гарантирует, что `ctx.resource` задан |

## Примеры

### Один ресурс

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource не изменяется (если уже существовал)
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
    <p>Users: {usersRes.getData().length}</p>
    <p>Orders: {ordersRes.getData().length}</p>
  </div>
);
```

### Разовый запрос

```ts
// Одноразовый запрос, не засоряющий ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Примечания

- Для загрузки данных сначала вызовите `setResourceName(name)`, затем `refresh()`.
- Каждый экземпляр независим; удобно для параллельной загрузки нескольких источников данных.

## Связанные материалы

- [ctx.initResource()](./init-resource.md): инициализация и привязка к `ctx.resource`
- [ctx.resource](./resource.md): ресурс текущего контекста
- [MultiRecordResource](../resource/multi-record-resource.md)
- [SingleRecordResource](../resource/single-record-resource.md)
- [APIResource](../resource/api-resource.md)
- [SQLResource](../resource/sql-resource.md)