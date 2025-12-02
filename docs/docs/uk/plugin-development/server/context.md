:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Контекст

У NocoBase кожен запит генерує об'єкт `ctx`, який є екземпляром Context. Контекст інкапсулює інформацію про запит та відповідь, а також надає специфічні для NocoBase функції, такі як доступ до бази даних, операції кешування, управління дозволами, інтернаціоналізація та ведення журналів.

`Application` NocoBase базується на Koa, тому `ctx` по суті є Koa Context. Однак NocoBase розширює його багатими API, що дозволяє розробникам зручно обробляти бізнес-логіку в Middleware та Action. Кожен запит має незалежний `ctx`, що забезпечує ізоляцію та безпеку даних між запитами.

## ctx.action

`ctx.action` надає доступ до Action, що виконується для поточного запиту. Включає:

- `ctx.action.params`
- `ctx.action.actionName`
- `ctx.action.resourceName`

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Виводить назву поточного Action
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Підтримка інтернаціоналізації (i18n).

- `ctx.i18n` надає інформацію про мовне середовище
- `ctx.t()` використовується для перекладу рядків залежно від мови

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Повертає переклад відповідно до мови запиту
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` надає інтерфейс для доступу до бази даних, дозволяючи безпосередньо працювати з моделями та виконувати запити.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` надає операції кешування, підтримуючи читання та запис у кеш. Зазвичай використовується для прискорення доступу до даних або збереження тимчасового стану.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Кешувати на 60 секунд
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` — це екземпляр застосунку NocoBase, що дозволяє отримати доступ до глобальної конфігурації, плагінів та сервісів.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` отримує інформацію про поточного автентифікованого користувача. Це корисно для перевірки дозволів або використання в бізнес-логіці.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` використовується для обміну даними в ланцюжку middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` надає можливості для ведення журналів, підтримуючи виведення логів на різних рівнях.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` використовується для управління дозволами, а `ctx.can()` — для перевірки, чи має поточний користувач дозвіл на виконання певної операції.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Підсумок

- Кожен запит відповідає незалежному об'єкту `ctx`.
- `ctx` — це розширення Koa Context, що інтегрує функціональність NocoBase.
- До поширених властивостей належать: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` тощо.
- Використання `ctx` у Middleware та Action дозволяє зручно обробляти запити, відповіді, дозволи, журнали та базу даних.