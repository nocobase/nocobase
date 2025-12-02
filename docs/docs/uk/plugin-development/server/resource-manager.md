:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# ResourceManager Керування ресурсами

Функція керування ресурсами NocoBase може автоматично перетворювати наявні таблиці даних (колекції) та зв'язки (асоціації) на ресурси, і має вбудовані типи операцій, що допомагає розробникам швидко створювати операції з ресурсами REST API. На відміну від традиційних REST API, операції з ресурсами NocoBase не залежать від методів HTTP-запитів, а визначають конкретну операцію для виконання за допомогою явного визначення `:action`.

## Автоматичне генерування ресурсів

NocoBase автоматично перетворює `колекції` та `зв'язки`, визначені в базі даних, на ресурси. Наприклад, якщо визначити дві колекції, `posts` і `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Це автоматично згенерує такі ресурси:

*   ресурс `posts`
*   ресурс `tags`
*   ресурс зв'язку `posts.tags`

Приклади запитів:

| Метод  | Шлях                     | Операція          |
| -------- | ---------------------- | --------------- |
| `GET`  | `/api/posts:list`      | Запит списку    |
| `GET`  | `/api/posts:get/1`     | Запит однієї записи |
| `POST` | `/api/posts:create`    | Створити        |
| `POST` | `/api/posts:update/1`  | Оновити         |
| `POST` | `/api/posts:destroy/1` | Видалити        |

| Метод  | Шлях                     | Операція          |
| -------- | ---------------------- | --------------- |
| `GET`  | `/api/tags:list`       | Запит списку    |
| `GET`  | `/api/tags:get/1`      | Запит однієї записи |
| `POST` | `/api/tags:create`     | Створити        |
| `POST` | `/api/tags:update/1`   | Оновити         |
| `POST` | `/api/tags:destroy/1`  | Видалити        |

| Метод  | Шлях                           | Операція                                |
| -------- | ------------------------------ | --------------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | Запит усіх `tags`, пов'язаних з `post`  |
| `GET`  | `/api/posts/1/tags:get/1`      | Запит однієї `tags` для `post`          |
| `POST` | `/api/posts/1/tags:create`     | Створити одну `tags` для `post`         |
| `POST` | `/api/posts/1/tags:update/1`   | Оновити одну `tags` для `post`          |
| `POST` | `/api/posts/1/tags:destroy/1`  | Видалити одну `tags` для `post`         |
| `POST` | `/api/posts/1/tags:add`        | Додати пов'язані `tags` до `post`       |
| `POST` | `/api/posts/1/tags:remove`     | Видалити пов'язані `tags` з `post`      |
| `POST` | `/api/posts/1/tags:set`        | Встановити всі пов'язані `tags` для `post` |
| `POST` | `/api/posts/1/tags:toggle`     | Перемкнути зв'язок `tags` для `post`    |

:::tip Порада

Операції з ресурсами NocoBase не залежать безпосередньо від методів запиту, а визначають операції за допомогою явного визначення `:action`.

:::

## Операції з ресурсами

NocoBase надає широкий спектр вбудованих типів операцій для задоволення різноманітних бізнес-потреб.

### Базові CRUD операції

| Назва операції   | Опис                                    | Застосовні типи ресурсів | Метод запиту | Приклад шляху               |
| ---------------- | --------------------------------------- | ------------------------- | -------------- | --------------------------- |
| `list`           | Запит даних списку                      | Усі                       | GET/POST       | `/api/posts:list`           |
| `get`            | Запит однієї записи                     | Усі                       | GET/POST       | `/api/posts:get/1`          |
| `create`         | Створити новий запис                    | Усі                       | POST           | `/api/posts:create`         |
| `update`         | Оновити запис                           | Усі                       | POST           | `/api/posts:update/1`       |
| `destroy`        | Видалити запис                          | Усі                       | POST           | `/api/posts:destroy/1`      |
| `firstOrCreate`  | Знайти перший запис, створити, якщо не існує | Усі                       | POST           | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Оновити запис, створити, якщо не існує     | Усі                       | POST           | `/api/users:updateOrCreate` |

### Операції зі зв'язками

| Назва операції | Опис                      | Застосовні типи зв'язків                  | Приклад шляху                  |
| -------------- | ------------------------- | ----------------------------------------- | ------------------------------ |
| `add`          | Додати зв'язок            | `hasMany`, `belongsToMany`                | `/api/posts/1/tags:add`        |
| `remove`       | Видалити зв'язок          | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | Скинути зв'язок           | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | Додати або видалити зв'язок | `belongsToMany`                           | `/api/posts/1/tags:toggle`     |

### Параметри операцій

Поширені параметри операцій включають:

*   `filter`: Умови запиту
*   `values`: Значення для встановлення
*   `fields`: Вказати поля для повернення
*   `appends`: Включити пов'язані дані
*   `except`: Виключити поля
*   `sort`: Правила сортування
*   `page`, `pageSize`: Параметри пагінації
*   `paginate`: Чи ввімкнути пагінацію
*   `tree`: Чи повертати деревоподібну структуру
*   `whitelist`, `blacklist`: Білий/чорний список полів
*   `updateAssociationValues`: Чи оновлювати значення зв'язків

---

## Користувацькі операції з ресурсами

NocoBase дозволяє реєструвати додаткові операції для наявних ресурсів. Ви можете використовувати `registerActionHandlers` для налаштування операцій для всіх або конкретних ресурсів.

### Реєстрація глобальних операцій

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Реєстрація операцій для конкретних ресурсів

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Приклади запитів:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Правило іменування: `resourceName:actionName`, використовуйте точкову нотацію (`posts.comments`), коли включаєте зв'язки.

## Користувацькі ресурси

Якщо вам потрібно надати ресурси, не пов'язані з колекціями, ви можете визначити їх за допомогою методу `resourceManager.define`:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Методи запиту узгоджуються з автоматично згенерованими ресурсами:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (за замовчуванням підтримує як GET, так і POST)

## Користувацьке проміжне програмне забезпечення

Використовуйте метод `resourceManager.use()` для реєстрації глобального проміжного програмного забезпечення. Наприклад:

Глобальне проміжне програмне забезпечення для логування

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Спеціальні властивості Context

Можливість доступу до проміжного програмного забезпечення або дії на рівні `resourceManager` означає, що цей ресурс обов'язково існує.

### ctx.action

*   `ctx.action.actionName`: Назва операції
*   `ctx.action.resourceName`: Може бути колекцією або зв'язком
*   `ctx.action.params`: Параметри операції

### ctx.dataSource

Поточний об'єкт джерела даних.

### ctx.getCurrentRepository()

Поточний об'єкт репозиторію.

## Як отримати об'єкти resourceManager для різних джерел даних

`resourceManager` належить до джерела даних, і операції можна реєструвати окремо для різних джерел даних.

### Основне джерело даних

Для основного джерела даних ви можете безпосередньо використовувати `app.resourceManager` для виконання операцій:

```ts
app.resourceManager.registerActionHandlers();
```

### Інші джерела даних

Для інших джерел даних ви можете отримати конкретний екземпляр джерела даних через `dataSourceManager` і використовувати `resourceManager` цього екземпляра для виконання операцій:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Ітерація всіх джерел даних

Якщо вам потрібно виконати однакові операції для всіх доданих джерел даних, ви можете використовувати метод `dataSourceManager.afterAddDataSource` для ітерації, гарантуючи, що `resourceManager` кожного джерела даних зможе зареєструвати відповідні операції:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```