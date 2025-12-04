:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# Context

ב-NocoBase, כל בקשה יוצרת אובייקט `ctx`, שהוא מופע (instance) של Context. ה-Context עוטף את המידע של הבקשה והתגובה, ובמקביל מספק פונקציונליות ייחודית ל-NocoBase, כמו גישה למסד נתונים, פעולות מטמון, ניהול הרשאות, בינאום (internationalization) ורישום לוגים.

ה-`Application` של NocoBase מבוסס על Koa, ולכן `ctx` הוא למעשה Koa Context. עם זאת, NocoBase הרחיבה אותו עם ממשקי API עשירים, המאפשרים למפתחים לטפל בנוחות בלוגיקה עסקית ב-Middleware וב-Action-ים. לכל בקשה יש `ctx` עצמאי, מה שמבטיח בידוד נתונים ואבטחה בין בקשות.

## ctx.action

`ctx.action` מספק גישה ל-Action המבוצע עבור הבקשה הנוכחית. הוא כולל:

- `ctx.action.params`
- `ctx.action.actionName`
- `ctx.action.resourceName`

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // מציג את שם ה-Action הנוכחי
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

תמיכה בבינאום (i18n).

- `ctx.i18n` מספק מידע על הגדרות השפה (locale)
- `ctx.t()` משמש לתרגום מחרוזות בהתאם לשפה

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // מחזיר תרגום בהתאם לשפת הבקשה
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` מספק ממשק לגישה למסד הנתונים, ומאפשר לכם לפעול ישירות על מודלים ולבצע שאילתות.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` מספק פעולות מטמון (cache), תומך בקריאה וכתיבה למטמון, ומשמש לעיתים קרובות להאצת גישה לנתונים או לשמירת מצב זמני.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // שמירה במטמון ל-60 שניות
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` הוא מופע היישום של NocoBase, ומאפשר גישה לתצורה גלובלית, תוספים ושירותים.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` מאחזר את פרטי המשתמש המאומת הנוכחי, ומתאים לשימוש בבדיקות הרשאות או בלוגיקה עסקית.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` משמש לשיתוף נתונים בשרשרת ה-middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` מספק יכולות רישום לוגים, ותומך בפלט לוגים מרובה רמות.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` משמש לניהול הרשאות, ו-`ctx.can()` משמש לבדיקה אם למשתמש הנוכחי יש הרשאה לבצע פעולה מסוימת.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## סיכום

- כל בקשה מתאימה לאובייקט `ctx` עצמאי.
- `ctx` הוא הרחבה של Koa Context, המשלבת פונקציונליות של NocoBase.
- מאפיינים נפוצים כוללים: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` ועוד.
- שימוש ב-`ctx` ב-Middleware וב-Action-ים מאפשר לטפל בנוחות בבקשות, תגובות, הרשאות, לוגים ומסד נתונים.