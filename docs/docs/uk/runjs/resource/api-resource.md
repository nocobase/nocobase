:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/resource/api-resource).
:::

# APIResource

**Універсальний API-ресурс**, що базується на URL для здійснення запитів, підходить для будь-яких HTTP-інтерфейсів. Він успадковує базовий клас `FlowResource` та розширює його конфігурацією запитів і методом `refresh()`. На відміну від [MultiRecordResource](./multi-record-resource.md) та [SingleRecordResource](./single-record-resource.md), APIResource не залежить від назви ресурсу, а виконує запити безпосередньо за URL, що зручно для кастомних інтерфейсів, сторонніх API та інших сценаріїв.

**Спосіб створення**: `ctx.makeResource('APIResource')` або `ctx.initResource('APIResource')`. Перед використанням необхідно встановити URL за допомогою `setURL()`. У контексті RunJS `ctx.api` (APIClient) ін’єктується автоматично, тому немає потреби викликати `setAPIClient` вручну.

---

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **Кастомні інтерфейси** | Виклик нестандартних API ресурсів (наприклад, `/api/custom/stats`, `/api/reports/summary`). |
| **Сторонні API** | Запити до зовнішніх сервісів через повний URL (потребує підтримки CORS з боку цілі). |
| **Одноразові запити** | Тимчасове отримання даних, які не потрібно прив'язувати до `ctx.resource`. |
| **Вибір між APIResource та ctx.request** | Використовуйте APIResource, коли потрібні реактивні дані, події або відстеження стану помилок; використовуйте `ctx.request()` для простих одноразових запитів. |

---

## Можливості базового класу (FlowResource)

Усі ресурси (Resource) мають такі можливості:

| Метод | Опис |
|------|------|
| `getData()` | Отримати поточні дані. |
| `setData(value)` | Встановити дані (тільки локально). |
| `hasData()` | Чи наявні дані. |
| `getMeta(key?)` / `setMeta(meta)` | Читання/запис метаданих. |
| `getError()` / `setError(err)` / `clearError()` | Керування станом помилки. |
| `on(event, callback)` / `once` / `off` / `emit` | Підписка на події та їх ініціація. |

---

## Конфігурація запиту

| Метод | Опис |
|------|------|
| `setAPIClient(api)` | Встановити екземпляр APIClient (у RunJS зазвичай ін’єктується автоматично). |
| `getURL()` / `setURL(url)` | URL запиту. |
| `loading` | Читання/запис стану завантаження (get/set). |
| `clearRequestParameters()` | Очистити параметри запиту. |
| `setRequestParameters(params)` | Об'єднати та встановити параметри запиту. |
| `setRequestMethod(method)` | Встановити метод запиту (наприклад, `'get'`, `'post'`, за замовчуванням `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Заголовки запиту. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Додавання, видалення або отримання окремого параметра. |
| `setRequestBody(data)` | Тіло запиту (використовується для POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Загальні опції запиту. |

---

## Формат URL

- **Стиль ресурсу**: Підтримує скорочення ресурсів NocoBase, наприклад `users:list`, `posts:get`, які будуть поєднані з `baseURL`.
- **Відносний шлях**: Наприклад, `/api/custom/endpoint`, поєднується з `baseURL` додатка.
- **Повний URL**: Використовуйте повні адреси для крос-доменних запитів; цільовий сервер має бути налаштований на підтримку CORS.

---

## Отримання даних

| Метод | Опис |
|------|------|
| `refresh()` | Ініціює запит згідно з поточними URL, методом, параметрами, заголовками та даними. Записує отримані `data` у `setData(data)` та викликає подію `'refresh'`. У разі помилки встановлює `setError(err)` та викидає `ResourceError`, подія `refresh` при цьому не викликається. Потребує попередньо встановлених `api` та URL. |

---

## Приклади

### Базовий GET-запит

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL у стилі ресурсу

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST-запит (із тілом запиту)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'Тест', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Прослуховування події refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Статистика: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Обробка помилок

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Запит не вдався');
}
```

### Кастомні заголовки запиту

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Примітки

- **Залежність від ctx.api**: У RunJS `ctx.api` ін’єктується середовищем виконання, тому зазвичай не потрібно викликати `setAPIClient` вручну. Якщо ресурс використовується поза контекстом, його потрібно встановити самостійно.
- **Refresh означає запит**: `refresh()` ініціює запит на основі поточної конфігурації; метод, параметри, дані тощо мають бути налаштовані до виклику.
- **Помилки не оновлюють дані**: Якщо запит не вдався, `getData()` зберігає попереднє значення; інформацію про помилку можна отримати через `getError()`.
- **Порівняння з ctx.request**: Використовуйте `ctx.request()` для простих одноразових запитів; використовуйте `APIResource`, коли необхідні реактивні дані, події та керування станом помилок.

---

## Пов’язане

- [ctx.resource](../context/resource.md) — Екземпляр ресурсу в поточному контексті
- [ctx.initResource()](../context/init-resource.md) — Ініціалізація та прив'язка до `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) — Створення нового екземпляра ресурсу без прив'язки
- [ctx.request()](../context/request.md) — Універсальний HTTP-запит, підходить для простих одноразових викликів
- [MultiRecordResource](./multi-record-resource.md) — Для колекцій/списків, підтримує CRUD та пагінацію
- [SingleRecordResource](./single-record-resource.md) — Для окремих записів