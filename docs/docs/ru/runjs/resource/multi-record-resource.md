# MultiRecordResource

Ресурс для **таблиц/списков данных**: запрос возвращает массив; поддерживает пагинацию, фильтрацию, сортировку и CRUD. Используется для таблиц, списков и других сценариев "множественных записей". В отличие от [APIResource](./api-resource.md), MultiRecordResource использует `setResourceName()` для указания имени ресурса и автоматически строит URL вида `users:list`, `users:create`, а также включает встроенные механизмы пагинации, фильтрации и выбранных строк.

**Наследование:** `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource`.

**Создание:** `ctx.makeResource('MultiRecordResource')` или `ctx.initResource('MultiRecordResource')`. Перед использованием вызовите `setResourceName('collectionName')` (например, `'users'`); в RunJS `ctx.api` подставляется автоматически.

---

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Блок таблицы** | Табличные и списковые блоки по умолчанию используют `MultiRecordResource`; доступны пагинация, фильтр и сортировка |
| **Список в JS-блоке** | Загрузка пользователей, заказов и т. п. в JS-блоке с пользовательским рендером |
| **Пакетные операции** | Использование `getSelectedRows()` для выбранных строк и `destroySelectedRows()` для пакетного удаления |
| **Ресурсы ассоциаций** | Загрузка связанных данных через `users.tags`; требуется `setSourceId(parentRecordId)` |

---

## Формат данных

- `getData()` возвращает **массив записей**, то есть поле `data` API списка.
- `getMeta()` возвращает метаданные пагинации: `page`, `pageSize`, `count`, `totalPage` и т. д.

---

## Имя ресурса и источник данных

| Метод | Описание |
|-------|----------|
| `setResourceName(name)` / `getResourceName()` | Имя ресурса, например `'users'`, `'users.tags'` (ассоциация) |
| `setSourceId(id)` / `getSourceId()` | ID родительской записи для ресурсов ассоциаций (например, `users.tags` требует первичный ключ пользователя) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Ключ источника данных (для нескольких источников данных) |

---

## Параметры запроса (фильтр, поля, сортировка)

| Метод | Описание |
|-------|----------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Фильтр по первичному ключу (получение одной записи и т. д.) |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Фильтр; поддерживаются `$eq`, `$ne`, `$in` и т. д. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Группы фильтров (комбинирование условий) |
| `setFields(fields)` / `getFields()` | Запрашиваемые поля (белый список) |
| `setSort(sort)` / `getSort()` | Сортировка, например `['-createdAt']` для сортировки по убыванию даты создания |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Расширение ассоциаций (например, `['user', 'tags']`) |

---

## Пагинация

| Метод | Описание |
|-------|----------|
| `setPage(page)` / `getPage()` | Текущая страница (нумерация с 1) |
| `setPageSize(size)` / `getPageSize()` | Размер страницы, по умолчанию 20 |
| `getTotalPage()` | Общее число страниц |
| `getCount()` | Общее количество записей (из meta сервера) |
| `next()` / `previous()` / `goto(page)` | Сменить страницу и запустить `refresh` |

---

## Выбранные строки (таблица)

| Метод | Описание |
|-------|----------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Текущие выбранные строки, например для пакетного удаления |

---

## Операции CRUD и работа со списком

| Метод | Описание |
|-------|----------|
| `refresh()` | Запросить список с текущими параметрами; обновить `getData()` и meta пагинации; сгенерировать `'refresh'` |
| `get(filterByTk)` | Запросить одну запись; возвращает эту запись (не записывает в `getData`) |
| `create(data, options?)` | Создать запись; опционально `{ refresh: false }` для отключения автоматического `refresh`; генерирует `'saved'` |
| `update(filterByTk, data, options?)` | Обновить запись по первичному ключу |
| `destroy(target)` | Удалить; `target` может быть первичным ключом, объектом строки или массивом (пакетное удаление) |
| `destroySelectedRows()` | Удалить выбранные строки (если нет выбранных, выбрасывает ошибку) |
| `setItem(index, item)` | Локально заменить строку по индексу (без запроса) |
| `runAction(actionName, options)` | Вызвать любое действие ресурса (например, пользовательское действие) |

---

## Конфигурация и события

| Метод | Описание |
|-------|----------|
| `setRefreshAction(name)` | Действие, используемое для `refresh`; по умолчанию `'list'` |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Конфигурация запроса для create/update |
| `on('refresh', fn)` / `on('saved', fn)` | Срабатывает после refresh или после сохранения |

---

## Примеры

### Базовый список

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Фильтр и сортировка

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Расширение ассоциаций

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Создание и пагинация

```js
await ctx.resource.create({ name: 'John', email: 'john@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Пакетное удаление выбранных строк

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Сначала выберите данные');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted'));
```

### Подписка на событие обновления refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Ресурс ассоциации — дочерняя таблица

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Примечания

- **Требуется setResourceName**: до использования обязательно вызовите `setResourceName('collectionName')`, иначе URL запроса не будет построен.
- **Ресурсы ассоциаций**: когда имя ресурса имеет вид `parent.child` (например, `users.tags`), сначала вызовите `setSourceId(parentPrimaryKey)`.
- **Дебаунс refresh**: несколько вызовов `refresh()` в одном цикле событий выполнит только последний, чтобы избежать дублей.
- **getData возвращает массив**: API списка возвращает `data` как массив записей; `getData()` возвращает именно этот массив.

---

## Связанные материалы

- [ctx.resource](../context/resource.md) - экземпляр ресурса текущего контекста
- [ctx.initResource()](../context/init-resource.md) - инициализация и привязка к ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - создание ресурса без привязки
- [APIResource](./api-resource.md) - универсальный API-ресурс с запросом по URL
- [SingleRecordResource](./single-record-resource.md) - для одиночных записей