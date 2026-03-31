:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Контекст

В NocoBase каждый запрос генерирует объект `ctx`, который является экземпляром Context. `ctx` инкапсулирует информацию о запросе и ответе, а также предоставляет специфические для NocoBase функции, такие как доступ к базе данных, операции с кэшем, управление правами доступа, интернационализация и логирование.

Приложение NocoBase основано на Koa, поэтому `ctx` по сути является Koa Context. Однако NocoBase расширяет его богатым набором API, позволяя разработчикам удобно обрабатывать бизнес-логику в Middleware и Action. Каждый запрос имеет независимый `ctx`, что обеспечивает изоляцию и безопасность данных между запросами.

## ctx.action

`ctx.action` предоставляет доступ к Action, выполняемому для текущего запроса. Включает:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Выводит имя текущего Action
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Поддержка интернационализации (i18n).

- `ctx.i18n` предоставляет информацию о языковой среде
- `ctx.t()` используется для перевода строк в зависимости от языка

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Возвращает перевод в зависимости от языка запроса
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` предоставляет интерфейс для доступа к базе данных, позволяя напрямую работать с моделями и выполнять запросы.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` предоставляет операции кэширования, поддерживая чтение и запись в кэш. Обычно используется для ускорения доступа к данным или сохранения временного состояния.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Кэшировать на 60 секунд
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` — это экземпляр приложения NocoBase, который предоставляет доступ к глобальной конфигурации, плагинам и сервисам.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` получает информацию о текущем аутентифицированном пользователе, что удобно для проверок прав доступа или использования в бизнес-логике.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` используется для обмена данными в цепочке middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` предоставляет возможности логирования, поддерживая вывод логов различных уровней.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` используется для управления правами доступа, а `ctx.can()` — для проверки наличия у текущего пользователя разрешения на выполнение определенной операции.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Краткое изложение

- Каждый запрос соответствует независимому объекту `ctx`.
- `ctx` является расширением Koa Context, объединяющим функциональность NocoBase.
- Общие свойства включают: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` и другие.
- Использование `ctx` в Middleware и Action позволяет удобно обрабатывать запросы, ответы, права доступа, логи и базу данных.