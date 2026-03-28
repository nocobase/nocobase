:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/request).
:::

# ctx.request()

Выполняйте аутентифицированные HTTP-запросы в RunJS. Запрос автоматически передает `baseURL`, `Token`, `locale`, `role` текущего приложения и использует логику перехвата запросов и обработки ошибок приложения.

## Области применения

Применимо к любому сценарию в RunJS, где требуется инициировать удаленный HTTP-запрос, например: JSBlock, JSField, JSItem, JSColumn, рабочий процесс (Workflow), связи (Linkage), JSAction и т. д.

## Определение типов

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` расширяет `AxiosRequestConfig` из Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Пропускать ли глобальное уведомление об ошибке при сбое запроса
  skipAuth?: boolean;                                 // Пропускать ли перенаправление для аутентификации (например, не переходить на страницу входа при 401)
};
```

## Основные параметры

| Параметр | Тип | Описание |
|------|------|------|
| `url` | string | URL запроса. Поддерживает стиль ресурсов (например, `users:list`, `posts:create`) или полный URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP-метод, по умолчанию `'get'` |
| `params` | object | Параметры запроса, сериализуемые в URL |
| `data` | any | Тело запроса, используется для post/put/patch |
| `headers` | object | Пользовательские заголовки запроса |
| `skipNotify` | boolean \| (error) => boolean | Если true или функция возвращает true, глобальное уведомление об ошибке при сбое не выводится |
| `skipAuth` | boolean | Если true, ошибки 401 и др. не вызывают перенаправление на страницу аутентификации (например, на страницу входа) |

## URL в стиле ресурсов

API ресурсов NocoBase поддерживает сокращенный формат `ресурс:действие`:

| Формат | Описание | Пример |
|------|------|------|
| `collection:action` | CRUD для одной коллекции | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Связанные ресурсы (требуется передача первичного ключа через `resourceOf` или URL) | `posts.comments:list` |

Относительные пути будут объединены с `baseURL` приложения (обычно `/api`); для кросс-доменных запросов необходимо использовать полный URL, а целевой сервис должен быть настроен для работы с CORS.

## Структура ответа

Возвращаемое значение — объект ответа Axios. Основные поля:

- `response.data`: Тело ответа
- Интерфейсы списков обычно возвращают `data.data` (массив записей) + `data.meta` (пагинация и т. д.)
- Для интерфейсов получения одной записи/создания/обновления `data.data` обычно содержит одну запись

## Примеры

### Запрос списка

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Информация о пагинации и т. д.
```

### Отправка данных

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Иван Иванов', email: 'ivan@example.com' },
});

const newRecord = res?.data?.data;
```

### С фильтрацией и сортировкой

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

### Пропуск уведомления об ошибке

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Не выводить глобальное сообщение при сбое
});

// Или пропуск в зависимости от типа ошибки
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Кросс-доменный запрос

При использовании полного URL для запроса к другим доменам целевой сервис должен быть настроен для работы с CORS, разрешая источник текущего приложения. Если целевому интерфейсу требуется собственный токен, его можно передать через заголовки:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <токен_целевого_сервиса>',
  },
});
```

### Отображение с помощью ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Список пользователей') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Примечания

- **Обработка ошибок**: Сбой запроса вызовет исключение, и по умолчанию появится глобальное уведомление об ошибке. Используйте `skipNotify: true`, чтобы перехватить и обработать ошибку самостоятельно.
- **Аутентификация**: Запросы к тому же домену автоматически передают Token, locale и role текущего пользователя; для кросс-доменных запросов требуется поддержка CORS на целевом сервере и передача токена в заголовках при необходимости.
- **Права доступа к ресурсам**: Запросы ограничены ACL и позволяют обращаться только к тем ресурсам, на которые у текущего пользователя есть права.

## Связанные разделы

- [ctx.message](./message.md) — отображение легких подсказок после завершения запроса
- [ctx.notification](./notification.md) — отображение уведомлений после завершения запроса
- [ctx.render](./render.md) — рендеринг результатов запроса в интерфейс
- [ctx.makeResource](./make-resource.md) — создание объекта ресурса для цепочечной загрузки данных (альтернатива прямому использованию `ctx.request`)