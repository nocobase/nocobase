:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# BaseAuth

## نظرة عامة

`BaseAuth` هو تطبيق أساسي لأنواع مصادقة المستخدمين، ويرث من الفئة المجردة [Auth](./auth)، ويستخدم JWT كطريقة للمصادقة. في معظم الحالات، يمكنك توسيع أنواع مصادقة المستخدمين عن طريق الوراثة من `BaseAuth`، ولا داعي للوراثة مباشرة من الفئة المجردة `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // تعيين مجموعة المستخدمين
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // منطق مصادقة المستخدم، يتم استدعاؤه بواسطة `auth.signIn`
  // إرجاع بيانات المستخدم
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## دوال الفئة

### `constructor()`

دالة البناء، تنشئ نسخة من `BaseAuth`.

#### التوقيع

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### التفاصيل

| المعامل | النوع | الوصف |
| :--- | :--- | :--- |
| `config` | `AuthConfig` | راجع [Auth - AuthConfig](./auth#authconfig) |
| `userCollection` | `Collection` | مجموعة المستخدمين، على سبيل المثال: `db.getCollection('users')`. راجع [DataBase - Collection](../database/collection) |

### `user()`

دالة وصول (Accessor)، تقوم بتعيين معلومات المستخدم واسترجاعها. بشكل افتراضي، تستخدم الكائن `ctx.state.currentUser` للوصول.

#### التوقيع

- `set user()`
- `get user()`

### `check()`

تتحقق من المصادقة عبر رمز (token) الطلب وتُرجع معلومات المستخدم.

### `signIn()`

تسجيل دخول المستخدم، وتوليد رمز (token).

### `signUp()`

تسجيل المستخدم.

### `signOut()`

تسجيل خروج المستخدم، وانتهاء صلاحية الرمز (token).

### `validate()` \*

المنطق الأساسي للمصادقة، يتم استدعاؤه بواسطة واجهة `signIn`، لتحديد ما إذا كان المستخدم يمكنه تسجيل الدخول بنجاح.