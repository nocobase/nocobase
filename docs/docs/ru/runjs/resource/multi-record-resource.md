:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Ресурс, ориентированный на коллекции (таблицы данных): запросы возвращают массив, поддерживается пагинация, фильтрация, сортировка и операции CRUD. Подходит для сценариев с «несколькими записями», таких как таблицы и списки. В отличие от [APIResource](./api-resource.md), MultiRecordResource определяет имя ресурса через `setResourceName()`, автоматически создает URL-адреса вида `users:list`, `users:create` и обладает встроенными возможностями для пагинации, фильтрации и выбора строк.

**Наследование**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Способ создания**: `ctx.makeResource('MultiRecordResource')` или `ctx.initResource('MultiRecordResource')`. Перед использованием необходимо вызвать `setResourceName('имя_коллекции')` (например, `'users'`); в RunJS `ctx.api` внедряется средой выполнения.

---

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **Блоки таблиц** | Блоки таблиц и списков по умолчанию используют MultiRecordResource, поддерживая пагинацию, фильтрацию и сортировку. |
| **Списки в JSBlock** | Загрузка данных из коллекций (например, пользователи или заказы) в JSBlock с последующим пользовательским рендерингом. |
| **Массовые операции** | Использование `getSelectedRows()` для получения выбранных строк и `destroySelectedRows()` для массового удаления. |
| **Связанные ресурсы** | Загрузка связанных коллекций в формате `users.tags`, что требует вызова `setSourceId(ID_родительской_записи)`. |

---

## Формат данных

- `getData()` возвращает **массив записей** (поле `data` из ответа API списка).
- `getMeta()` возвращает метаданные пагинации: `page`, `pageSize`, `count`, `totalPage` и т. д.

---

## Имя ресурса и источник данных

| Метод | Описание |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Имя ресурса, например `'users'`, `'users.tags'` (связанный ресурс). |
| `setSourceId(id)` / `getSourceId()` | ID родительской записи для связанных ресурсов (например, для `users.tags` нужно передать первичный ключ пользователя). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Идентификатор источника данных (используется в сценариях с несколькими источниками данных). |

---

## Параметры запроса (Фильтрация / Поля / Сортировка)

| Метод | Описание |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Фильтрация по основному ключу (для получения одной записи `get` и т. д.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Условия фильтрации, поддерживающие операторы `$eq`, `$ne`, `$in` и др. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Группы фильтров (для комбинирования нескольких условий). |
| `setFields(fields)` / `getFields()` | Запрашиваемые поля (белый список). |
| `setSort(sort)` / `getSort()` | Сортировка, например `['-createdAt']` для сортировки по убыванию даты создания. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Загрузка ассоциаций (например, `['user', 'tags']`). |

---

## Пагинация

| Метод | Описание |
|------|------|
| `setPage(page)` / `getPage()` | Текущая страница (начиная с 1). |
| `setPageSize(size)` / `getPageSize()` | Количество элементов на странице, по умолчанию 20. |
| `getTotalPage()` | Общее количество страниц. |
| `getCount()` | Общее количество записей (из метаданных сервера). |
| `next()` / `previous()` / `goto(page)` | Переход по страницам с вызовом `refresh`. |

---

## Выбранные строки (для таблиц)

| Метод | Описание |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Данные текущих выбранных строк, используемые для массового удаления и других операций. |

---

## CRUD и операции со списком

| Метод | Описание |
|------|------|
| `refresh()` | Запрашивает список с текущими параметрами, обновляет `getData()` и метаданные пагинации, вызывает событие `'refresh'`. |
| `get(filterByTk)` | Запрашивает одну запись и возвращает её (не записывает в `getData`). |
| `create(data, options?)` | Создает запись. Опция `{ refresh: false }` предотвращает автоматическое обновление. Вызывает `'saved'`. |
| `update(filterByTk, data, options?)` | Обновляет запись по её основному ключу. |
| `destroy(target)` | Удаляет записи; `target` может быть основным ключом, объектом строки или массивом ключей/объектов (массовое удаление). |
| `destroySelectedRows()` | Удаляет текущие выбранные строки (выдает ошибку, если ничего не выбрано). |
| `setItem(index, item)` | Локально заменяет конкретную строку данных (не инициирует запрос). |
| `runAction(actionName, options)` | Вызывает любое действие ресурса (например, кастомные экшены). |

---

## Конфигурация и события

| Метод | Описание |
|------|------|
| `setRefreshAction(name)` | Экшен, вызываемый при обновлении, по умолчанию `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Конфигурация запроса для создания/обновления. |
| `on('refresh', fn)` / `on('saved', fn)` | Срабатывает после завершения обновления или после сохранения. |

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

### Фильтрация и сортировка

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Загрузка ассоциаций

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Создание и пагинация

```js
await ctx.resource.create({ name: 'Иван Иванов', email: 'ivan.ivanov@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Массовое удаление выбранных строк

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Пожалуйста, сначала выберите данные');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Удалено'));
```

### Прослушивание события refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Связанный ресурс (дочерняя таблица)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Примечания

- **setResourceName обязательно**: Вы должны вызвать `setResourceName('имя_коллекции')` перед использованием, иначе URL запроса не сможет быть сформирован.
- **Связанные ресурсы**: Если имя ресурса указано в формате `parent.child` (например, `users.tags`), необходимо сначала вызвать `setSourceId(первичный_ключ_родителя)`.
- **Дебаунсинг refresh**: Несколько вызовов `refresh()` в одном цикле событий выполнят только последний вызов, чтобы избежать избыточных запросов.
- **getData возвращает массив**: Поле `data`, возвращаемое API списка, является массивом записей, и `getData()` возвращает этот массив напрямую.

---

## Связанные разделы

- [ctx.resource](../context/resource.md) — Экземпляр ресурса в текущем контексте
- [ctx.initResource()](../context/init-resource.md) — Инициализация и привязка к ctx.resource
- [ctx.makeResource()](../context/make-resource.md) — Создание нового экземпляра ресурса без привязки
- [APIResource](./api-resource.md) — Общий API-ресурс, запрашиваемый по URL
- [SingleRecordResource](./single-record-resource.md) — Ориентирован на одну запись