# Контекст

В NocoBase каждый запрос генерирует объект `ctx`, который является экземпляром Context. Контекст инкапсулирует информацию о запросах и ответах, обеспечивая при этом специфичные для NocoBase функциональные возможности, такие как доступ к базе данных, операции кэширования, управление разрешениями, интернационализация и логирование.

`Application` в NocoBase основан на Koa, поэтому `ctx` по сути является контекстом Koa. При этом NocoBase расширяет его с помощью API, позволяя разработчикам удобно обрабатывать бизнес-логику в Middleware и действиях. Каждый запрос имеет независимый `ctx`, что обеспечивает изоляцию данных и безопасность между запросами.

## ctx.action

`ctx.action` предоставляет доступ к действию, выполняемому для текущего запроса. Включает:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Выводит имя текущего действия
  ctx.body = `Действие: ${ctx.action.actionName}`;
});
```

## ctx.i18n и ctx.t()

Поддержка интернационализации (i18n).

- `ctx.i18n` предоставляет информацию о локали.
- `ctx.t()` используется для перевода строк в зависимости от языка.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Возвращает перевод в зависимости от языка запроса
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` предоставляет интерфейс доступа к базе данных, позволяющий напрямую работать с моделями и выполнять запросы.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` обеспечивает операции кэша, поддерживая чтение и запись в кэш, обычно используемые для ускорения доступа к данным или сохранения временного состояния.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Кэш на 60 секунд
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` — это экземпляр приложения NocoBase, обеспечивающий доступ к глобальной конфигурации, плагинам и службам.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` извлекает информацию о текущем аутентифицированном пользователе, пригодную для использования при проверке разрешений или бизнес-логике.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` используется для обмена данными в цепочке Middleware

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` предоставляет возможности логирования, поддерживая многоуровневый вывод журнала.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission и ctx.can()

`ctx.permission` используется для управления разрешениями, `ctx.can()` используется для проверки наличия у текущего пользователя разрешения на выполнение определенной операции.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Итог

- Каждому запросу соответствует независимый объект `ctx`.
- `ctx` — это расширение Koa Context, интегрирующее функциональность NocoBase.
- Общие свойства включают: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` и т. д.
- Использование `ctx` в Middleware и действиях позволяет удобно обрабатывать запросы, ответы, разрешения, логи и базу данных.