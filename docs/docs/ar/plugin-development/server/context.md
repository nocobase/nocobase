:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# السياق (Context)

في NocoBase، يُنشئ كل طلب كائن `ctx`، وهو نسخة من السياق (Context). يغلف السياق معلومات الطلب والاستجابة، ويوفر في الوقت نفسه وظائف خاصة بـ NocoBase، مثل الوصول إلى قاعدة البيانات، وعمليات التخزين المؤقت (cache)، وإدارة الأذونات، والتدويل (internationalization)، وتسجيل السجلات (logging)، وغيرها.

تعتمد `Application` في NocoBase على Koa، لذا فإن `ctx` هو في الأساس Koa Context. لكن NocoBase وسّعت هذا السياق بواجهات برمجة تطبيقات (APIs) غنية، مما يتيح للمطورين معالجة منطق الأعمال بسهولة في Middleware و Actions. يمتلك كل طلب كائن `ctx` مستقلًا، مما يضمن عزل البيانات وأمانها بين الطلبات.

## `ctx.action`

يوفر `ctx.action` الوصول إلى الـ Action الذي يتم تنفيذه للطلب الحالي. يتضمن:

- `ctx.action.params`
- `ctx.action.actionName`
- `ctx.action.resourceName`

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // يعرض اسم الـ Action الحالي
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## `ctx.i18n` و `ctx.t()`

دعم التدويل (i18n).

- يوفر `ctx.i18n` معلومات اللغة المحلية.
- يُستخدم `ctx.t()` لترجمة السلاسل النصية بناءً على اللغة.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // يُرجع الترجمة بناءً على لغة الطلب
  ctx.body = msg;
});
```

## `ctx.db`

يوفر `ctx.db` واجهة للوصول إلى قاعدة البيانات، مما يتيح لك التعامل مباشرة مع النماذج (models) وتنفيذ الاستعلامات.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## `ctx.cache`

يوفر `ctx.cache` عمليات التخزين المؤقت (cache)، ويدعم القراءة والكتابة من وإلى الذاكرة المؤقتة، ويُستخدم عادةً لتسريع الوصول إلى البيانات أو حفظ الحالات المؤقتة.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // تخزين مؤقت لمدة 60 ثانية
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## `ctx.app`

`ctx.app` هو نسخة تطبيق NocoBase، ويسمح بالوصول إلى الإعدادات العامة، والإضافات (Plugins)، والخدمات.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## `ctx.auth.user`

يسترد `ctx.auth.user` معلومات المستخدم الحالي المصادق عليه، وهو مناسب للاستخدام في التحقق من الأذونات أو منطق الأعمال.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## `ctx.state.currentRoles`

يُستخدم `ctx.state` لمشاركة البيانات في سلسلة الـ middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## `ctx.logger`

يوفر `ctx.logger` إمكانيات تسجيل السجلات (logging)، ويدعم إخراج السجلات على مستويات متعددة.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## `ctx.permission` و `ctx.can()`

يُستخدم `ctx.permission` لإدارة الأذونات، بينما يُستخدم `ctx.can()` للتحقق مما إذا كان المستخدم الحالي يمتلك صلاحية تنفيذ عملية معينة.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## ملخص

- كل طلب يقابله كائن `ctx` مستقل.
- `ctx` هو امتداد لـ Koa Context، يدمج وظائف NocoBase.
- تشمل الخصائص الشائعة: `ctx.db`، `ctx.cache`، `ctx.auth`، `ctx.state`، `ctx.logger`، `ctx.can()`، `ctx.t()`، وغيرها.
- يتيح استخدام `ctx` في Middleware و Actions التعامل بسهولة مع الطلبات، والاستجابات، والأذونات، والسجلات، وقاعدة البيانات.