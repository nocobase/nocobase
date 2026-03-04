:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/resource).
:::

# ctx.resource

Экземпляр **FlowResource** в текущем контексте, используемый для доступа к данным и управления ими. В большинстве блоков (формы, таблицы, детализация и т. д.) и сценариях всплывающих окон среда выполнения предварительно привязывает `ctx.resource`. В сценариях типа JSBlock, где ресурс по умолчанию отсутствует, необходимо сначала вызвать [ctx.initResource()](./init-resource.md) для инициализации, а затем использовать его через `ctx.resource`.

## Применимые сценарии

`ctx.resource` можно использовать в любом сценарии RunJS, где требуется доступ к структурированным данным (списки, отдельные записи, пользовательские API, SQL). Блоки форм, таблиц, детализации и всплывающие окна обычно имеют предварительную привязку. Для JSBlock, JSField, JSItem, JSColumn и т. д., если требуется загрузка данных, вы можете сначала вызвать `ctx.initResource(type)`, а затем обратиться к `ctx.resource`.

## Определение типа

```ts
resource: FlowResource | undefined;
```

- В контекстах с предварительной привязкой `ctx.resource` является соответствующим экземпляром ресурса.
- В сценариях типа JSBlock, где ресурс по умолчанию отсутствует, он имеет значение `undefined`, пока не будет вызван метод `ctx.initResource(type)`.

## Общие методы

Методы, предоставляемые различными типами ресурсов (MultiRecordResource, SingleRecordResource, APIResource, SQLResource), немного различаются. Ниже приведены универсальные или наиболее часто используемые методы:

| Метод | Описание |
|------|------|
| `getData()` | Получить текущие данные (список или отдельную запись) |
| `setData(value)` | Установить локальные данные |
| `refresh()` | Инициировать запрос с текущими параметрами для обновления данных |
| `setResourceName(name)` | Установить имя ресурса (например, `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Установить фильтр по первичному ключу (для `get` отдельной записи и т. д.) |
| `runAction(actionName, options)` | Вызвать любое действие (action) ресурса (например, `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Подписаться/отписаться от событий (например, `refresh`, `saved`) |

**Особенности MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` и т. д.

## Примеры

### Данные списка (требуется предварительный вызов initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Сценарий с таблицей (предварительно привязан)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Удалено'));
```

### Одиночная запись

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Вызов пользовательского действия (action)

```js
await ctx.resource.runAction('create', { data: { name: 'Иван Иванов' } });
```

## Связь с ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Если `ctx.resource` не существует, создает и привязывает его; если уже существует, возвращает имеющийся экземпляр. Это гарантирует доступность `ctx.resource`.
- **ctx.makeResource(type)**: Создает новый экземпляр ресурса и возвращает его, но **не** записывает его в `ctx.resource`. Подходит для сценариев, требующих нескольких независимых ресурсов или временного использования.
- **ctx.resource**: Обращается к ресурсу, уже привязанному к текущему контексту. Большинство блоков/всплывающих окон имеют предварительную привязку; в противном случае значение равно `undefined` и требуется вызов `ctx.initResource`.

## Примечания

- Перед использованием рекомендуется выполнять проверку на пустое значение: `ctx.resource?.refresh()`, особенно в таких сценариях, как JSBlock, где предварительная привязка может отсутствовать.
- После инициализации необходимо вызвать `setResourceName(name)`, чтобы указать коллекцию, прежде чем загружать данные через `refresh()`.
- Полный API для каждого типа ресурса см. по ссылкам ниже.

## Связанные разделы

- [ctx.initResource()](./init-resource.md) - Инициализация и привязка ресурса к текущему контексту
- [ctx.makeResource()](./make-resource.md) - Создание нового экземпляра ресурса без привязки к `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Несколько записей/Списки
- [SingleRecordResource](../resource/single-record-resource.md) - Одиночная запись
- [APIResource](../resource/api-resource.md) - Общий ресурс API
- [SQLResource](../resource/sql-resource.md) - Ресурс SQL-запроса