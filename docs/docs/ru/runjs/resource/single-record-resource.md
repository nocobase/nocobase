:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Ресурс (Resource), ориентированный на **одну запись**: данные представляют собой один объект; поддерживается получение по основному ключу, создание/обновление (save) и удаление. Подходит для сценариев работы с «одной записью», таких как детализация или формы. В отличие от [MultiRecordResource](./multi-record-resource.md), метод `getData()` в `SingleRecordResource` возвращает один объект. Вы указываете основной ключ через `setFilterByTk(id)`, а `save()` автоматически вызывает `create` или `update` в зависимости от состояния `isNewRecord`.

**Наследование**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Способы создания**: `ctx.makeResource('SingleRecordResource')` или `ctx.initResource('SingleRecordResource')`. Перед использованием необходимо вызвать `setResourceName('имя_коллекции')`. При выполнении операций по основному ключу используйте `setFilterByTk(id)`. В RunJS объект `ctx.api` внедряется средой выполнения.

---

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **Блок деталей** | Блок деталей по умолчанию использует `SingleRecordResource` для загрузки одной записи по её основному ключу. |
| **Блок формы** | Формы создания/редактирования используют `SingleRecordResource`, где `save()` автоматически различает операции `create` и `update`. |
| **Детализация в JSBlock** | Загрузка данных одного пользователя, заказа и т. д. в JSBlock с последующим настраиваемым отображением. |
| **Связанные ресурсы** | Загрузка связанных одиночных записей в формате `users.profile`, что требует вызова `setSourceId(parentRecordID)`. |

---

## Формат данных

- `getData()` возвращает **объект одной записи**, который соответствует полю `data` в ответе API `get`.
- `getMeta()` возвращает метаданные (если они доступны).

---

## Имя ресурса и основной ключ

| Метод | Описание |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Имя ресурса, например, `'users'`, `'users.profile'` (связанный ресурс). |
| `setSourceId(id)` / `getSourceId()` | ID родительской записи для связанных ресурсов (например, для `users.profile` требуется основной ключ записи из `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Идентификатор источника данных (используется в средах с несколькими источниками данных). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Основной ключ текущей записи; после установки `isNewRecord` становится `false`. |

---

## Состояние

| Свойство/Метод | Описание |
|----------|------|
| `isNewRecord` | Находится ли ресурс в состоянии «Новая запись» (true, если `filterByTk` не установлен или запись только что была создана). |

---

## Параметры запроса (Фильтрация / Поля)

| Метод | Описание |
|------|------|
| `setFilter(filter)` / `getFilter()` | Фильтрация (доступна, когда ресурс не в состоянии «Новая запись»). |
| `setFields(fields)` / `getFields()` | Запрашиваемые поля. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Загрузка связанных данных (appends). |

---

## CRUD

| Метод | Описание |
|------|------|
| `refresh()` | Выполняет запрос `get` на основе текущего `filterByTk` и обновляет `getData()`; ничего не делает в состоянии «Новая запись». |
| `save(data, options?)` | Вызывает `create`, если ресурс в состоянии «Новая запись», иначе вызывает `update`; опция `{ refresh: false }` предотвращает автоматическое обновление данных. |
| `destroy(options?)` | Удаляет запись на основе текущего `filterByTk` и очищает локальные данные. |
| `runAction(actionName, options)` | Вызывает любое действие (action) ресурса. |

---

## Конфигурация и события

| Метод | Описание |
|------|------|
| `setSaveActionOptions(options)` | Конфигурация запроса для действия `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Срабатывает после завершения обновления или после сохранения. |

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
await ctx.resource.save({ name: 'Иван Иванов' });
```

### Создание новой записи

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Петр Петров', email: 'petrov@example.com' });
```

### Удаление записи

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// После destroy() getData() возвращает null
```

### Загрузка связанных данных и полей

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Связанные ресурсы (например, users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Основной ключ родительской записи
res.setFilterByTk(profileId);    // filterByTk можно опустить, если profile — это связь hasOne
await res.refresh();
const profile = res.getData();
```

### Сохранение без автоматического обновления

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() сохраняет старое значение, так как обновление после сохранения не запускается
```

### Прослушивание событий refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Пользователь: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Успешно сохранено');
});
await ctx.resource?.refresh?.();
```

---

## Примечания

- **setResourceName обязателен**: Вы должны вызвать `setResourceName('имя_коллекции')` перед использованием, иначе URL запроса не сможет быть сформирован.
- **filterByTk и isNewRecord**: Если `setFilterByTk` не вызван, `isNewRecord` будет `true`, и `refresh()` не инициирует запрос; `save()` выполнит действие `create`.
- **Связанные ресурсы**: Когда имя ресурса указано в формате `parent.child` (например, `users.profile`), сначала необходимо вызвать `setSourceId(parentPrimaryKey)`.
- **getData возвращает объект**: Данные, возвращаемые API для одной записи, являются объектом записи; `getData()` возвращает этот объект напрямую. После `destroy()` значение становится `null`.

---

## Связанные разделы

- [ctx.resource](../context/resource.md) — экземпляр ресурса в текущем контексте.
- [ctx.initResource()](../context/init-resource.md) — инициализация и привязка к `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) — создание нового экземпляра ресурса без привязки.
- [APIResource](./api-resource.md) — общий API-ресурс, запрашиваемый по URL.
- [MultiRecordResource](./multi-record-resource.md) — ориентирован на коллекции/списки, поддерживает CRUD и пагинацию.