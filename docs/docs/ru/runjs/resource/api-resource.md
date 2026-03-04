:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/resource/api-resource).
:::

# APIResource

**Универсальный API-ресурс** для выполнения запросов на основе URL, подходящий для любых HTTP-интерфейсов. Он наследуется от базового класса `FlowResource` и расширяет его конфигурацией запроса и методом `refresh()`. В отличие от [MultiRecordResource](./multi-record-resource.md) и [SingleRecordResource](./single-record-resource.md), `APIResource` не зависит от имени ресурса; он выполняет запросы напрямую по URL, что делает его подходящим для кастомных интерфейсов, сторонних API и других сценариев.

**Способ создания**: `ctx.makeResource('APIResource')` или `ctx.initResource('APIResource')`. Перед использованием необходимо вызвать `setURL()`. В контексте RunJS `ctx.api` (APIClient) внедряется автоматически, поэтому нет необходимости вызывать `setAPIClient` вручную.

---

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **Кастомный интерфейс** | Вызов нестандартных API ресурсов (например, `/api/custom/stats`, `/api/reports/summary`). |
| **Сторонний API** | Запрос к внешним сервисам по полному URL (требуется поддержка CORS со стороны целевого сервиса). |
| **Разовый запрос** | Временное получение данных, которые не нужно привязывать к `ctx.resource`. |
| **Выбор между APIResource и ctx.request** | Используйте `APIResource`, когда требуются реактивные данные, события или управление состояниями ошибок; используйте `ctx.request()` для простых разовых запросов. |

---

## Возможности базового класса (FlowResource)

Все ресурсы обладают следующими возможностями:

| Метод | Описание |
|------|------|
| `getData()` | Получить текущие данные. |
| `setData(value)` | Установить данные (только локально). |
| `hasData()` | Проверить наличие данных. |
| `getMeta(key?)` / `setMeta(meta)` | Чтение/запись метаданных. |
| `getError()` / `setError(err)` / `clearError()` | Управление состоянием ошибки. |
| `on(event, callback)` / `once` / `off` / `emit` | Подписка на события и их вызов. |

---

## Конфигурация запроса

| Метод | Описание |
|------|------|
| `setAPIClient(api)` | Установить экземпляр APIClient (обычно внедряется автоматически в RunJS). |
| `getURL()` / `setURL(url)` | URL запроса. |
| `loading` | Чтение/запись состояния загрузки (get/set). |
| `clearRequestParameters()` | Очистить параметры запроса. |
| `setRequestParameters(params)` | Объединить и установить параметры запроса. |
| `setRequestMethod(method)` | Установить метод запроса (например, `'get'`, `'post'`, по умолчанию `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Заголовки запроса. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Добавление, удаление или получение отдельного параметра. |
| `setRequestBody(data)` | Тело запроса (используется для POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Общие опции запроса. |

---

## Формат URL

- **Стиль ресурса**: Поддерживает сокращенную запись ресурсов NocoBase, например `users:list` или `posts:get`, которые будут объединены с `baseURL`.
- **Относительный путь**: Например, `/api/custom/endpoint`, объединяется с `baseURL` приложения.
- **Полный URL**: Используйте полные адреса для кросс-доменных запросов; целевой сервис должен иметь настроенный CORS.

---

## Получение данных

| Метод | Описание |
|------|------|
| `refresh()` | Инициирует запрос на основе текущего URL, метода, параметров, заголовков и данных. Записывает ответ в `setData(data)` и вызывает событие `'refresh'`. В случае ошибки устанавливает `setError(err)` и выбрасывает `ResourceError`, не вызывая событие `refresh`. Требует предварительной настройки `api` и URL. |

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

### POST-запрос (с телом запроса)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'тест', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Прослушивание события refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Статистика: {JSON.stringify(data)}</div>);
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
  ctx.message.error(err?.message ?? 'Ошибка запроса');
}
```

### Кастомные заголовки запроса

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Примечания

- **Зависимость от ctx.api**: В RunJS `ctx.api` внедряется средой выполнения; ручной вызов `setAPIClient` обычно не требуется. Если ресурс используется вне контекста, вы должны установить его самостоятельно.
- **Refresh означает запрос**: Метод `refresh()` инициирует запрос на основе текущей конфигурации; метод, параметры, данные и т. д. должны быть настроены до вызова.
- **Ошибки не обновляют данные**: При сбое запроса `getData()` сохраняет свое предыдущее значение; информацию об ошибке можно получить через `getError()`.
- **Сравнение с ctx.request**: Используйте `ctx.request()` для простых разовых запросов; используйте `APIResource`, когда требуется реактивность данных, события и управление состоянием ошибок.

---

## Связанные разделы

- [ctx.resource](../context/resource.md) — Экземпляр ресурса в текущем контексте
- [ctx.initResource()](../context/init-resource.md) — Инициализация и привязка к `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) — Создание нового экземпляра ресурса без привязки
- [ctx.request()](../context/request.md) — Универсальный HTTP-запрос, подходящий для простых разовых вызовов
- [MultiRecordResource](./multi-record-resource.md) — Для коллекций/списков, поддерживает CRUD и пагинацию
- [SingleRecordResource](./single-record-resource.md) — Для отдельных записей