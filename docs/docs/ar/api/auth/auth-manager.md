:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# AuthManager

## نظرة عامة

`AuthManager` هي وحدة إدارة مصادقة المستخدمين في NocoBase، وتُستخدم لتسجيل أنواع مختلفة من مصادقة المستخدمين.

### الاستخدام الأساسي

```ts
const authManager = new AuthManager({
  // يُستخدم للحصول على مُعرّف المُصادِق الحالي من ترويسة الطلب
  authKey: 'X-Authenticator',
});

// تحديد طرق AuthManager لتخزين واسترجاع المُصادِقات
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// تسجيل نوع مصادقة
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// استخدام وسيط المصادقة
app.resourceManager.use(authManager.middleware());
```

### مفاهيم

- **نوع المصادقة (`AuthType`)**: طرق مصادقة المستخدم المختلفة، مثل: كلمة المرور، الرسائل القصيرة، OIDC، SAML، وما إلى ذلك.
- **المُصادِق (`Authenticator`)**: الكيان الخاص بطريقة المصادقة، يتم تخزينه فعليًا في **مجموعة** البيانات، ويتوافق مع سجل إعدادات لنوع مصادقة معين (`AuthType`). يمكن أن تحتوي طريقة مصادقة واحدة على عدة مُصادِقات، تتوافق مع إعدادات متعددة، وتوفر طرق مصادقة مستخدم مختلفة.
- **مُعرّف المُصادِق (`Authenticator name`)**: المُعرّف الفريد للمُصادِق، يُستخدم لتحديد طريقة المصادقة المستخدمة في الطلب الحالي.

## دوال الفئة

### الدالة البانية (`constructor()`)

الدالة البانية، تُنشئ نسخة من `AuthManager`.

#### التوقيع

- `constructor(options: AuthManagerOptions)`

#### الأنواع

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### التفاصيل

##### خيارات AuthManager (`AuthManagerOptions`)

| الخاصية    | النوع                        | الوصف                                            | القيمة الافتراضية |
| ----------- | --------------------------- | ------------------------------------------------ | ----------------- |
| `authKey`   | `string`                    | اختياري، المفتاح في ترويسة الطلب الذي يحمل مُعرّف المُصادِق الحالي. | `X-Authenticator` |
| `default`   | `string`                    | اختياري، مُعرّف المُصادِق الافتراضي.             | `basic`           |
| `jwt`       | [`JwtOptions`](#jwtoptions) | اختياري، يمكن إعداده في حال استخدام JWT للمصادقة. | -                 |

##### خيارات JWT (`JwtOptions`)

| الخاصية    | النوع     | الوصف                      | القيمة الافتراضية |
| ----------- | -------- | -------------------------- | ----------------- |
| `secret`    | `string` | مفتاح سر التوكن (token).   | `X-Authenticator` |
| `expiresIn` | `string` | اختياري، مدة صلاحية التوكن (token). | `7d`              |

### الدالة `setStorer()`

تُحدد طرق تخزين واسترجاع بيانات المُصادِق.

#### التوقيع

- `setStorer(storer: Storer)`

#### الأنواع

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### التفاصيل

##### المُصادِق (`Authenticator`)

| الخاصية   | النوع                  | الوصف                  |
| ---------- | --------------------- | ---------------------- |
| `authType` | `string`              | نوع المصادقة           |
| `options`  | `Record<string, any>` | إعدادات المُصادِق ذات الصلة |

##### المخزّن (`Storer`)

`Storer` هي الواجهة لتخزين المُصادِقات، وتحتوي على دالة واحدة.

- `get(name: string): Promise<Authenticator>` - تُرجع مُصادِقًا باستخدام مُعرّفه. في NocoBase، النوع الفعلي المُعاد هو [\`AuthModel\`](/auth-verification/auth/dev/api#authmodel).

### الدالة `registerTypes()`

تُسجل نوع مصادقة.

#### التوقيع

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### الأنواع

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // فئة المصادقة.
  title?: string; // الاسم المعروض لنوع المصادقة.
};
```

#### التفاصيل

| الخاصية | النوع             | الوصف                                            |
| ------- | ------------------ | ------------------------------------------------ |
| `auth`  | `AuthExtend<Auth>` | تطبيق نوع المصادقة، راجع [\`Auth\`](./auth)       |
| `title` | `string`           | اختياري. العنوان الذي يظهر لنوع المصادقة هذا في الواجهة الأمامية. |

### الدالة `listTypes()`

تُرجع قائمة بأنواع المصادقة المسجلة.

#### التوقيع

- `listTypes(): { name: string; title: string }[]`

#### التفاصيل

| الخاصية | النوع     | الوصف              |
| ------- | -------- | ------------------ |
| `name`  | `string` | مُعرّف نوع المصادقة |
| `title` | `string` | عنوان نوع المصادقة |

### الدالة `get()`

تُرجع مُصادِقًا.

#### التوقيع

- `get(name: string, ctx: Context)`

#### التفاصيل

| الخاصية | النوع      | الوصف          |
| ------ | --------- | -------------- |
| `name` | `string`  | مُعرّف المُصادِق |
| `ctx`  | `Context` | سياق الطلب     |

### الدالة `middleware()`

وسيط المصادقة. يحصل على المُصادِق الحالي ويُجري مصادقة المستخدم.