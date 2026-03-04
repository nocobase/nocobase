:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/request).
:::

# ctx.request()

Виконуйте автентифіковані HTTP-запити в RunJS. Запит автоматично містить `baseURL`, `Token`, `locale`, `role` поточного додатка тощо, а також наслідує логіку перехоплення запитів та обробки помилок додатка.

## Сценарії використання

Застосовується в будь-якому сценарії RunJS, де потрібно ініціювати віддалений HTTP-запит, наприклад: JSBlock, JSField, JSItem, JSColumn, робочий процес, зв'язок (linkage), JSAction тощо.

## Визначення типів

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` розширює `AxiosRequestConfig` від Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Чи пропускати глобальні сповіщення про помилки у разі невдачі запиту
  skipAuth?: boolean;                                 // Чи пропускати перенаправлення для автентифікації (наприклад, не перенаправляти на сторінку входу при 401)
};
```

## Основні параметри

| Параметр | Тип | Опис |
|------|------|------|
| `url` | string | URL запиту. Підтримує стиль ресурсів (наприклад, `users:list`, `posts:create`) або повний URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP-метод, за замовчуванням `'get'` |
| `params` | object | Параметри запиту, що серіалізуються в URL |
| `data` | any | Тіло запиту, використовується для post/put/patch |
| `headers` | object | Користувацькі заголовки запиту |
| `skipNotify` | boolean \| (error) => boolean | Якщо true або функція повертає true, глобальні сповіщення про помилки не з'являтимуться при невдачі |
| `skipAuth` | boolean | Якщо true, помилки типу 401 тощо не викликатимуть перенаправлення для автентифікації (наприклад, на сторінку входу) |

## URL у стилі ресурсів

API ресурсів NocoBase підтримує скорочений формат `ресурс:дія`:

| Формат | Опис | Приклад |
|------|------|------|
| `collection:action` | CRUD для однієї колекції | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Пов'язані ресурси (потребує передачі первинного ключа через `resourceOf` або URL) | `posts.comments:list` |

Відносні шляхи будуть поєднані з `baseURL` додатка (зазвичай `/api`); для крос-доменних запитів необхідно використовувати повний URL, а цільовий сервіс має бути налаштований на підтримку CORS.

## Структура відповіді

Повертається об'єкт відповіді Axios, основні поля:

- `response.data`: Тіло відповіді
- Інтерфейси списків зазвичай повертають `data.data` (масив записів) + `data.meta` (пагінація тощо)
- Інтерфейси одного запису/створення/оновлення зазвичай повертають один запис у `data.data`

## Приклади

### Запит списку

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Інформація про пагінацію тощо
```

### Відправка даних

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Іван Іванов', email: 'ivan@example.com' },
});

const newRecord = res?.data?.data;
```

### З фільтрацією та сортуванням

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

### Пропуск сповіщення про помилку

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Не показувати глобальне повідомлення у разі помилки
});

// Або вирішувати на основі типу помилки
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Крос-доменний запит

При використанні повного URL для запиту до інших доменів цільовий сервіс має бути налаштований на підтримку CORS для джерела вашого додатка. Якщо цільовий інтерфейс потребує власного токена, його можна передати через заголовки:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <токен_цільового_сервісу>',
  },
});
```

### Відображення за допомогою ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Список користувачів') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Примітки

- **Обробка помилок**: Невдалий запит викличе виняток, і за замовчуванням з'явиться глобальне сповіщення про помилку. Використовуйте `skipNotify: true`, щоб самостійно перехопити та обробити помилку.
- **Автентифікація**: Запити до того самого домену автоматично містять Token, мову та роль поточного користувача; крос-доменні запити потребують підтримки CORS цільовим сервісом та ручної передачі токена в заголовках за потреби.
- **Права доступу до ресурсів**: Запити обмежені ACL (списком контролю доступу), тому доступні лише ті ресурси, на які поточний користувач має дозвіл.

## Пов'язані теми

- [ctx.message](./message.md) — відображення легких підказок після завершення запиту
- [ctx.notification](./notification.md) — відображення сповіщень після завершення запиту
- [ctx.render](./render.md) — рендеринг результатів запиту в інтерфейс
- [ctx.makeResource](./make-resource.md) — створення об'єкта ресурсу для ланцюжкового завантаження даних (альтернатива прямому використанню `ctx.request`)