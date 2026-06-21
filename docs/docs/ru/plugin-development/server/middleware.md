# Middleware

Middleware серверной части NocoBase по сути является **Middleware Koa**. Вы можете использовать объект `ctx` для обработки запросов и ответов так же, как в Koa. Однако NocoBase работает с логикой на разных бизнес-уровнях, и если размещать все промежуточные обработчики в одном месте, поддерживать их становится сложно.

Поэтому NocoBase делит Middleware на **четыре уровня**:

1. **Middleware уровня источника данных**: `app.dataSourceManager.use()`  
   Влияет только на запросы к **конкретному источнику данных**. Обычно используется для подключений к базе данных, проверки полей и обработки транзакций в рамках этого источника данных.

2. **Middleware уровня ресурса**: `app.resourceManager.use()`  
   Работает только для определенных ресурсов. Подходит для логики уровня ресурса: проверка прав доступа к данным, форматирование и т.д.

3. **Middleware уровня разрешений**: `app.acl.use()`  
   Выполняется перед проверкой разрешений и используется для проверки ролей и прав пользователя.

4. **Middleware уровня приложения**: `app.use()`  
   Выполняется для каждого запроса. Подходит для логирования, общей обработки ошибок и формирования ответов.

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

    // Middleware уровня источника данных
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware уровня разрешений
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware уровня ресурса
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Порядок выполнения

Порядок выполнения Middleware следующий:

1. Сначала выполняется Middleware разрешений, добавленное через `acl.use()`.
2. Затем выполняется Middleware ресурса, добавленное через `resourceManager.use()`.
3. Затем выполняется Middleware источника данных, добавленное через `dataSourceManager.use()`.
4. В конце выполняется Middleware приложения, добавленное через `app.use()`.

## Механизм вставки `before` / `after` / `tag`

Для гибкого управления порядком Middleware NocoBase предоставляет параметры `before`, `after` и `tag`:

- **`tag`**: помечает Middleware для использования в последующих обработчиках.
- **`before`**: вставляет обработчик перед Middleware с указанным тегом.
- **`after`**: вставляет обработчик после Middleware с указанным тегом.

Пример:

```ts
// Обычное Middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 будет размещен перед m1
app.use(m4, { before: 'restApi' });

// m5 будет вставлен между m2 и m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Если позиция не указана, порядок выполнения по умолчанию для нового Middleware такой:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## Пример луковой модели

Порядок выполнения Middleware соответствует **луковой модели** Koa: первым происходит вход в стек, последним — выход из него.

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

Примеры вывода для разных маршрутов:

- **Обычный запрос**: `/api/hello`
Вывод: `[1,2]` (ресурс не определен, поэтому Middleware `resourceManager` и `acl` не выполняется)

- **Запрос ресурса**: `/api/test:list`
Вывод: `[5,3,7,1,2,8,4,6]`
Middleware выполняется в соответствии с порядком слоев и луковой моделью.

## Краткое содержание

- Middleware NocoBase расширяет Middleware Koa.
- Доступны четыре уровня: приложение -> источник данных -> ресурс -> разрешения.
- Для гибкого управления порядком выполнения можно использовать `before` / `after` / `tag`.
- Выполнение следует луковой модели Koa и поддерживает композицию и вложенность Middleware.
- Middleware уровня источника данных влияет только на запросы к конкретному источнику, а уровня ресурса — только на запросы к конкретному ресурсу.