# SingleRecordResource

Ресурс для **одиночных записей**: данные представлены одним объектом; поддерживает получение по первичному ключу, создание и обновление (`save`) и удаление. Используется для деталей, форм и других сценариев с одной записью. В отличие от [MultiRecordResource](./multi-record-resource.md), `getData()` в `SingleRecordResource` возвращает один объект; для первичного ключа используйте `setFilterByTk(id)`; метод `save()` автоматически вызывает `create` или `update` в зависимости от `isNewRecord`.

**Наследование:** `FlowResource` → `APIResource` → `BaseRecordResource` → `SingleRecordResource`.

**Создание:** `ctx.makeResource('SingleRecordResource')` или `ctx.initResource('SingleRecordResource')`. Перед использованием вызовите `setResourceName('collectionName')`; для операций по первичному ключу — `setFilterByTk(id)`; в RunJS `ctx.api` подставляется автоматически.

---

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Блок деталей** | Блок деталей по умолчанию использует `SingleRecordResource`; загружает одну запись по первичному ключу |
| **Блок формы** | Форма для создания и редактирования использует `SingleRecordResource`; `save()` сам выбирает `create` или `update` |
| **Детали в JS-блоке** | Загрузка одной записи (пользователь, заказ и т. д.) в JS-блоке с пользовательским рендером |
| **Ресурсы ассоциаций** | Загрузка связанной одиночной записи через `users.profile`; требуется `setSourceId(parentRecordId)` |

---

## Формат данных

- `getData()` возвращает **объект одиночной записи**, то есть поле `data` ответа на запрос get.
- `getMeta()` возвращает метаданные (если есть).

---

## Имя ресурса и первичный ключ

| Метод | Описание |
|-------|----------|
| `setResourceName(name)` / `getResourceName()` | Имя ресурса, например `'users'`, `'users.profile'` (ассоциация) |
| `setSourceId(id)` / `getSourceId()` | ID родительской записи для ресурсов ассоциаций (например, `users.profile` требует первичный ключ пользователя) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Ключ источника данных (для нескольких источников данных) |
| `setFilterByTk(tk)` / `getFilterByTk()` | Первичный ключ текущей записи; после установки `isNewRecord` становится `false` |

---

## Состояние

| Свойство/метод | Описание |
|----------------|----------|
| `isNewRecord` | Находится ли ресурс в режиме "create" (true, когда filterByTk не задан или запись только что создана) |

---

## Параметры запроса (фильтр, поля)

| Метод | Описание |
|-------|----------|
| `setFilter(filter)` / `getFilter()` | Фильтр (когда запись не новая) |
| `setFields(fields)` / `getFields()` | Запрашиваемые поля |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Расширение ассоциаций |

---

## Операции CRUD

| Метод | Описание |
|-------|----------|
| `refresh()` | Запрос get с текущим `filterByTk`; обновляет `getData()`. В режиме новой записи запрос не отправляется |
| `save(data, options?)` | Для новой записи — `create`, иначе — `update`; опционально `{ refresh: false }` для отключения автоматического `refresh` |
| `destroy(options?)` | Удалить запись по текущему `filterByTk` и очистить локальные данные |
| `runAction(actionName, options)` | Вызвать любое действие ресурса |

---

## Конфигурация и события

| Метод | Описание |
|-------|----------|
| `setSaveActionOptions(options)` | Конфигурация запроса для `save` |
| `on('refresh', fn)` / `on('saved', fn)` | Срабатывает после `refresh` или после `save` |

---

## Примеры

### Базовое получение и обновление

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Обновление
await ctx.resource.save({ name: 'Jane' });
```

### Создание записи

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Bob', email: 'bob@example.com' });
```

### Удаление записи

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// После `destroy()` значение `getData()` становится `null`
```

### Расширение ассоциаций и набор полей

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Ресурс ассоциации (например, users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Первичный ключ родительской записи
res.setFilterByTk(profileId);    // Для связи к-одному (hasOne) можно не указывать filterByTk
await res.refresh();
const profile = res.getData();
```

### `save` без автоматического `refresh`

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// После `save()` `refresh` не выполняется; `getData()` остаётся прежним
```

### Подписка на события `refresh` и `saved`

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Пользователь: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Сохранено');
});
await ctx.resource?.refresh?.();
```

---

## Примечания

- **Требуется setResourceName**: до использования обязательно вызовите `setResourceName('collectionName')`, иначе URL запроса не будет построен.
- **filterByTk и isNewRecord**: если `setFilterByTk` не задан, `isNewRecord = true`; `refresh()` не отправляет запрос, а `save()` выполняет `create`.
- **Ресурсы ассоциаций**: когда имя ресурса имеет вид `parent.child` (например, `users.profile`), сначала вызовите `setSourceId(parentRecordId)`.
- **getData возвращает объект**: API одиночной записи возвращает `data` как объект записи; `getData()` отдаёт этот объект; после `destroy()` значение становится `null`.

---

## Связанные материалы

- [ctx.resource](../context/resource.md) - экземпляр ресурса текущего контекста
- [ctx.initResource()](../context/init-resource.md) - инициализация и привязка к ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - создание ресурса без привязки
- [APIResource](./api-resource.md) - универсальный API-ресурс с запросом по URL
- [MultiRecordResource](./multi-record-resource.md) - для таблиц/списков, CRUD, пагинации