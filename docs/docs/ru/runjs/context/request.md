# ctx.request()

Отправляет аутентифицированные HTTP-запросы из RunJS. Запросы используют baseURL приложения, токен, локаль, роль и т. д., а также общие перехватчики и обработку ошибок приложения.

## Сценарии использования

Используйте везде, где RunJS должен вызывать удалённый HTTP API: JS-блок, поле JS, элемент JS, JS-столбец таблицы, поток событий, связывание, действие JS и т. д.

## Тип

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` расширяет Axios `AxiosRequestConfig`:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Пропустить глобальное сообщение об ошибке при неудаче
  skipAuth?: boolean;                                 // Пропустить перенаправление аутентификации (например, 401 → вход)
};
```

## Основные параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `url` | string | URL. Поддерживает стиль ресурса (например, `users:list`, `posts:create`) и полный URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP-метод; по умолчанию `'get'` |
| `params` | object | Query-параметры (сериализуются в URL) |
| `data` | any | Тело запроса для post/put/patch |
| `headers` | object | Пользовательские заголовки |
| `skipNotify` | boolean \| (error) => boolean | Если `true` или функция вернула `true`, глобальное сообщение об ошибке не показывается |
| `skipAuth` | boolean | Если `true`, 401 и т. п. не запускают перенаправление аутентификации (например, на страницу входа) |

## Формат URL в стиле ресурса

NocoBase resource API поддерживает краткий формат `resource:action`:

| Формат | Описание | Пример |
|--------|----------|--------|
| `collection:action` | CRUD одной таблицы | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Ассоциации (нужен `resourceOf` или первичный ключ в URL) | `posts.comments:list` |

Относительные URL объединяются с baseURL приложения (обычно `/api`). Для междоменных запросов используйте полный URL и убедитесь, что целевая сторона поддерживает CORS.

## Ответ

Возвращается ответ Axios. Типичный доступ:

- `response.data`: тело ответа
- для API списка обычно `data.data` (записи) + `data.meta` (пагинация)
- для одной записи / создания / обновления обычно `data.data` — одна запись

## Примеры

### Список

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta;
```

### Создание

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'John', email: 'john@example.com' },
});

const newRecord = res?.data?.data;
```

### Фильтрация и сортировка

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Отключить уведомление об ошибке

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,
});

// Или пропуск в зависимости от типа ошибки
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Междоменные запросы

Для других доменов целевой сервер должен разрешать CORS. Если нужен отдельный токен целевого сервиса, передайте его в headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <target-token>',
  },
});
```

### Использование с ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('User list') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Примечания

- **Ошибки**: при неуспешном запросе выбрасывается исключение; по умолчанию показывается глобальное сообщение. Используйте `skipNotify: true`, если обрабатываете ошибку сами.
- **Аутентификация**: запросы того же источника автоматически отправляют токен, локаль, роль; для междоменных запросов нужен CORS и при необходимости токен в заголовках.
- **ACL**: запросы ограничены ACL; доступны только ресурсы, к которым у пользователя есть доступ.

## Связанные материалы

- [ctx.message](./message.md): короткая обратная связь после запроса
- [ctx.notification](./notification.md): уведомления после запроса
- [ctx.render](./render.md): отображение результата в UI
- [ctx.makeResource](./make-resource.md): построение ресурса для цепочек загрузки (альтернатива прямому `ctx.request`)