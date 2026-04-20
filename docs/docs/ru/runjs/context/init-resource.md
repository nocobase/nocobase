:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/init-resource).
:::

# ctx.initResource()

**Инициализирует** ресурс для текущего контекста. Если `ctx.resource` еще не существует, метод создает ресурс указанного типа и привязывает его к контексту; если он уже существует, используется текущий экземпляр. После этого к нему можно обращаться через `ctx.resource`.

## Сценарии использования

Обычно используется в сценариях **JSBlock** (независимый блок). Большинство блоков, всплывающих окон и других компонентов имеют предварительно привязанный `ctx.resource`, поэтому ручной вызов не требуется. В JSBlock по умолчанию ресурс отсутствует, поэтому необходимо вызвать `ctx.initResource(type)` перед загрузкой данных через `ctx.resource`.

## Определение типов

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Параметр | Тип | Описание |
|----------|------|-------------|
| `type` | `string` | Тип ресурса: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Возвращаемое значение**: Экземпляр ресурса в текущем контексте (т. е. `ctx.resource`).

## Отличие от ctx.makeResource()

| Метод | Поведение |
|--------|----------|
| `ctx.initResource(type)` | Создает и привязывает ресурс, если `ctx.resource` не существует; возвращает существующий, если он есть. Гарантирует доступность `ctx.resource`. |
| `ctx.makeResource(type)` | Только создает и возвращает новый экземпляр, **не** записывая его в `ctx.resource`. Подходит для сценариев, требующих нескольких независимых ресурсов или временного использования. |

## Примеры

### Данные списка (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Одиночная запись (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Указание первичного ключа
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Указание источника данных

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Примечания

- В большинстве сценариев блоков (формы, таблицы, детализация и т. д.) и всплывающих окон `ctx.resource` уже предварительно привязан средой выполнения, поэтому вызывать `ctx.initResource` не нужно.
- Ручная инициализация требуется только в таких контекстах, как JSBlock, где по умолчанию ресурс отсутствует.
- После инициализации необходимо вызвать `setResourceName(name)`, чтобы указать коллекцию, а затем вызвать `refresh()` для загрузки данных.

## Связанные разделы

- [ctx.resource](./resource.md) — Экземпляр ресурса в текущем контексте
- [ctx.makeResource()](./make-resource.md) — Создание нового экземпляра ресурса без привязки к `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Несколько записей / Список
- [SingleRecordResource](../resource/single-record-resource.md) — Одиночная запись
- [APIResource](../resource/api-resource.md) — Общий API-ресурс
- [SQLResource](../resource/sql-resource.md) — Ресурс SQL-запроса