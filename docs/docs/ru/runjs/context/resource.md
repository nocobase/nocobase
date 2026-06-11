# ctx.resource

Экземпляр **FlowResource** в текущем контексте; используется для доступа к данным и операций с ними. В большинстве блоков (форма, таблица, детали и т. д.) и всплывающих окон среда выполнения уже привязывает `ctx.resource`. В JS-блоке и похожих контекстах, где ресурса по умолчанию нет, сначала вызовите [ctx.initResource()](./init-resource.md), затем используйте `ctx.resource`.

## Сценарии использования

Используйте везде, где RunJS нужны структурированные данные (список, одна запись, пользовательский API, SQL). В блоках формы, таблицы, деталей и во всплывающих окнах ресурс обычно уже привязан; в JS-блоке, поле JS, элементе JS, JS-столбце таблицы и т. п. при необходимости загрузки данных сначала вызовите `ctx.initResource(type)`.

## Тип

```ts
resource: FlowResource | undefined;
```

- Если в контексте есть привязанный ресурс, `ctx.resource` — это этот экземпляр.
- В JS-блоке и аналогичных контекстах по умолчанию это `undefined`; после `ctx.initResource(type)` значение появляется.

## Основные методы

Разные типы ресурсов (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) имеют частично различающийся API; общий набор:

| Метод | Описание |
|-------|----------|
| `getData()` | Текущие данные (список или одна запись) |
| `setData(value)` | Установить локальные данные |
| `refresh()` | Повторно загрузить данные с текущими параметрами |
| `setResourceName(name)` | Указать имя ресурса (например, `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Указать фильтр по первичному ключу (получение одной записи и т. д.) |
| `runAction(actionName, options)` | Вызвать любое действие ресурса (например, `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Подписка/отписка на события (например, `refresh`, `saved`) |

**MultiRecordResource** дополнительно поддерживает: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` и т. д.

## Примеры

### Список (после initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Таблица (ресурс уже привязан)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted'));
```

### Одна запись

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Пользовательское действие

```js
await ctx.resource.runAction('create', { data: { name: 'John' } });
```

## Связь с ctx.initResource и ctx.makeResource

- **ctx.initResource(type)**: создаёт и привязывает ресурс, если его нет; иначе возвращает существующий. Гарантирует, что `ctx.resource` задан.
- **ctx.makeResource(type)**: создаёт новый экземпляр и возвращает его; **не** присваивает в `ctx.resource`. Используйте для нескольких ресурсов или временного ресурса.
- **ctx.resource**: привязанный ресурс текущего контекста. В большинстве блоков и всплывающих окон он уже есть; если нет — сначала вызывайте `ctx.initResource`.

## Примечания

- Предпочитайте проверки на `null`/`undefined`: `ctx.resource?.refresh()`, особенно в JS-блоке и похожих контекстах.
- После инициализации вызовите `setResourceName(name)`, затем `refresh()`, чтобы загрузить данные.
- Полный API смотрите в документации соответствующего типа ресурса.

## Связанные материалы

- [ctx.initResource()](./init-resource.md): инициализация и привязка ресурса
- [ctx.makeResource()](./make-resource.md): создание ресурса без привязки
- [MultiRecordResource](../resource/multi-record-resource.md)
- [SingleRecordResource](../resource/single-record-resource.md)
- [APIResource](../resource/api-resource.md)
- [SQLResource](../resource/sql-resource.md)