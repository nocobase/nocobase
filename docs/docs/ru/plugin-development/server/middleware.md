:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Middleware

Промежуточное ПО (Middleware) сервера NocoBase по своей сути является **Koa middleware**. Вы можете работать с объектом `ctx` для обработки запросов и ответов, как и в Koa. Однако, поскольку NocoBase необходимо управлять логикой на различных бизнес-уровнях, если все middleware будут размещены вместе, это значительно усложнит их поддержку и управление.

Поэтому NocoBase разделяет middleware на **четыре уровня**:

1.  **Middleware уровня источника данных**: `app.dataSourceManager.use()`  
    Применяется только к запросам для **конкретного источника данных**, обычно используется для логики подключения к базе данных, валидации полей или обработки транзакций для этого источника данных.

2.  **Middleware уровня ресурса**: `app.resourceManager.use()`  
    Действует только для определённых ресурсов (Resource) и подходит для обработки логики на уровне ресурсов, такой как права доступа к данным, форматирование и т.д.

3.  **Middleware уровня разрешений**: `app.acl.use()`  
    Выполняется до проверки разрешений и используется для верификации прав пользователя или ролей.

4.  **Middleware уровня приложения**: `app.use()`  
    Выполняется для каждого запроса и подходит для логирования, общей обработки ошибок, обработки ответов и т.д.

## Регистрация Middleware

Middleware обычно регистрируется в методе `load` плагина, например:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware уровня приложения
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware источника данных
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware разрешений
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware ресурса
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Порядок выполнения

Порядок выполнения middleware следующий:

1.  Сначала выполняется middleware разрешений, добавленное через `acl.use()`.
2.  Затем выполняется middleware ресурса, добавленное через `resourceManager.use()`.
3.  Затем выполняется middleware источника данных, добавленное через `dataSourceManager.use()`.
4.  И наконец, выполняется middleware уровня приложения, добавленное через `app.use()`.

## Механизм вставки с `before`, `after` и `tag`

Для более гибкого управления порядком middleware NocoBase предоставляет параметры `before`, `after` и `tag`:

-   **tag**: Присваивает middleware метку, которая может быть использована последующими middleware.
-   **before**: Вставляет middleware перед тем, которое имеет указанную метку (tag).
-   **after**: Вставляет middleware после того, которое имеет указанную метку (tag).

Пример:

```ts
// Обычное middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 будет размещено перед m1
app.use(m4, { before: 'restApi' });

// m5 будет вставлено между m2 и m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Если позиция не указана, новое middleware по умолчанию выполняется в следующем порядке:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Пример модели «луковицы»

Порядок выполнения middleware следует **модели «луковицы»** Koa: сначала middleware входят в стек, а затем выходят из него.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Примеры порядка вывода при доступе к различным интерфейсам:

-   **Обычный запрос**: `/api/hello`  
    Вывод: `[1,2]` (ресурс не определён, middleware `resourceManager` и `acl` не выполняются).

-   **Запрос ресурса**: `/api/test:list`  
    Вывод: `[5,3,7,1,2,8,4,6]`  
    Middleware выполняется в соответствии с иерархией уровней и моделью «луковицы».

## Краткий обзор

-   Middleware NocoBase — это расширение Koa Middleware.
-   Четыре уровня: Приложение -> Источник данных -> Ресурс -> Разрешения.
-   Вы можете использовать `before` / `after` / `tag` для гибкого управления порядком выполнения.
-   Следует модели «луковицы» Koa, обеспечивая компонуемость и вложенность middleware.
-   Middleware уровня источника данных действует только на запросы к указанному источнику данных, а middleware уровня ресурса — только на запросы к определённым ресурсам.