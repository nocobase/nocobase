# ctx.initResource()

**Инициализирует** ресурс текущего контекста: если `ctx.resource` отсутствует, создаёт ресурс указанного типа и привязывает его; если уже есть — использует существующий. После этого можно работать с `ctx.resource`.

## Сценарии использования

Обычно применяется только в **JS-блоке** (автономный блок). В большинстве блоков и всплывающих окон `ctx.resource` уже привязан; в **JS-блоке** — нет, поэтому сначала вызовите `ctx.initResource(type)`, затем используйте `ctx.resource`.

## Тип

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `type` | `string` | Тип ресурса: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Возвращает**: экземпляр ресурса текущего контекста (то есть `ctx.resource`).

## Связь с ctx.makeResource()

| Метод | Поведение |
|-------|-----------|
| `ctx.initResource(type)` | Создаёт и привязывает ресурс, если `ctx.resource` отсутствует; иначе возвращает существующий. Гарантирует, что `ctx.resource` задан |
| `ctx.makeResource(type)` | Создаёт новый экземпляр и возвращает его; **не** присваивает его в `ctx.resource`. Используется для нескольких ресурсов или временного ресурса |

## Примеры

### Список данных (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Одна запись (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
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

- В большинстве блоков (форма, таблица, блок деталей и т. д.) и всплывающих окон `ctx.resource` уже привязан; `ctx.initResource` вызывать не нужно.
- Инициализация обычно нужна в контекстах вроде **JS-блока**, где ресурс по умолчанию не создаётся.
- После инициализации вызовите `setResourceName(name)`, затем `refresh()`, чтобы загрузить данные.

## Связанные материалы

- [ctx.resource](./resource.md): ресурс текущего контекста
- [ctx.makeResource()](./make-resource.md): создаёт ресурс без привязки к `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md): несколько записей
- [SingleRecordResource](../resource/single-record-resource.md)
- [APIResource](../resource/api-resource.md): одиночная запись
- [SQLResource](../resource/sql-resource.md): SQL
