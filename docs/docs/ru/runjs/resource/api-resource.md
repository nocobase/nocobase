# APIResource

**Универсальный API-ресурс**, отправляющий запросы по URL; подходит для любых HTTP-конечных точек. Наследуется от `FlowResource`, добавляет конфигурацию запроса и `refresh()`. В отличие от [MultiRecordResource](./multi-record-resource.md) и [SingleRecordResource](./single-record-resource.md), `APIResource` не зависит от имени ресурса и делает запросы напрямую по URL; удобен для пользовательских API, сторонних сервисов и т. д.

**Создание:** `ctx.makeResource('APIResource')` или `ctx.initResource('APIResource')`. Перед использованием вызовите `setURL()`. В контексте RunJS `ctx.api` (`APIClient`) подставляется автоматически, поэтому `setAPIClient` обычно не нужен.

---

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Пользовательские API** | Вызов нестандартных resource API (например, `/api/custom/stats`, `/api/reports/summary`) |
| **Сторонние API** | Запрос внешних сервисов по полному URL (целевой сервис должен поддерживать CORS) |
| **Разовые запросы** | Временное получение данных без привязки к `ctx.resource` |
| **Сравнение с ctx.request** | `APIResource` используйте, когда нужны реактивные данные, события и состояние ошибки; `ctx.request()` — для простых разовых запросов |

---

## Основа (`FlowResource`)

Все ресурсы поддерживают:

| Метод | Описание |
|-------|----------|
| `getData()` | Текущие данные |
| `setData(value)` | Установить данные (локально) |
| `hasData()` | Есть ли данные |
| `getMeta(key?)` / `setMeta(meta)` | Чтение/запись метаданных |
| `getError()` / `setError(err)` / `clearError()` | Состояние ошибки |
| `on(event, callback)` / `once` / `off` / `emit` | Подписка и генерация событий |

---

## Конфигурация запроса

| Метод | Описание |
|-------|----------|
| `setAPIClient(api)` | Задать экземпляр `APIClient` (в RunJS обычно подставляется автоматически) |
| `getURL()` / `setURL(url)` | URL запроса |
| `loading` | Состояние загрузки (get/set) |
| `clearRequestParameters()` | Очистить параметры запроса |
| `setRequestParameters(params)` | Объединить параметры запроса |
| `setRequestMethod(method)` | Метод запроса (например, `'get'`, `'post'`, по умолчанию `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Заголовки |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Добавить/прочитать/удалить отдельный параметр |
| `setRequestBody(data)` | Тело запроса (для POST/PUT/PATCH) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Общие параметры запроса |

---

## Формат URL

- **Стиль ресурса**: поддерживается краткий формат NocoBase, например `users:list`, `posts:get`; объединяется с baseURL.
- **Относительный путь**: например, `/api/custom/endpoint`; объединяется с baseURL приложения.
- **Полный URL**: для междоменных запросов используйте полный адрес; целевой сервер должен настроить CORS.

---

## Загрузка данных

| Метод | Описание |
|-------|----------|
| `refresh()` | Отправляет запрос с текущими URL, method, params, headers, data; записывает `response.data` в `setData(data)` и генерирует `'refresh'`. При ошибке выполняет `setError(err)`, выбрасывает `ResourceError` и не генерирует `refresh`. Требуются `api` и URL. |

---

## Примеры

### Базовый GET-запрос

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL в стиле ресурса

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST-запрос (с телом)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'Test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Подписка на событие обновления refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Stats: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Обработка ошибок

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Request failed');
}
```

### Пользовательские заголовки

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Примечания

- **Зависимость от ctx.api**: в RunJS `ctx.api` подставляется автоматически; обычно `setAPIClient` вызывать не нужно. Вне контекста задавайте вручную.
- **refresh = запрос**: `refresh()` отправляет один запрос с текущей конфигурацией; method, params, data и т. д. должны быть настроены заранее.
- **Ошибка не обновляет data**: при ошибке `getData()` сохраняет предыдущее значение; информацию об ошибке смотрите через `getError()`.
- **Сравнение с ctx.request**: `ctx.request()` подходит для простых разовых запросов; `APIResource` — когда нужны реактивные данные, события и управление состоянием ошибки.

---

## Связанные материалы

- [ctx.resource](../context/resource.md) - экземпляр ресурса текущего контекста
- [ctx.initResource()](../context/init-resource.md) - инициализация и привязка к ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - создание экземпляра ресурса без привязки
- [ctx.request()](../context/request.md) - generic HTTP-запросы для простых one-off сценариев
- [MultiRecordResource](./multi-record-resource.md) - для таблиц/списков, CRUD, пагинации
- [SingleRecordResource](./single-record-resource.md) - для одиночных записей