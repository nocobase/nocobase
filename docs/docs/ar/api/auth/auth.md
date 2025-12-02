:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# Auth

## نظرة عامة

`Auth` هو فئة مجردة لأنواع مصادقة المستخدم. يحدد الواجهات المطلوبة لإتمام مصادقة المستخدم. لتوسيع نوع مصادقة مستخدم جديد، يجب أن ترث فئة `Auth` وتنفذ أساليبها. للاطلاع على تطبيق أساسي، راجع: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // التحقق من حالة المصادقة وإرجاع المستخدم الحالي.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: المصادقة
  async check() {
    // ...
  }
}
```

## خصائص الكائن

### `user`

معلومات المستخدم المصدق عليه.

#### التوقيع

- `abstract user: Model`

## أساليب الفئة

### `constructor()`

الدالة البانية، تنشئ كائن `Auth`.

#### التوقيع

- `constructor(config: AuthConfig)`

#### النوع

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### التفاصيل

##### AuthConfig

| الخاصية            | النوع                                            | الوصف                                                                                                  |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | نموذج بيانات المصادقة. النوع الفعلي في تطبيق NocoBase هو [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | إعدادات متعلقة بالمصادقة.                                                                                        |
| `ctx`           | `Context`                                       | سياق الطلب.                                                                                            |

### `check()`

مصادقة المستخدم. تُرجع معلومات المستخدم. هذه دالة مجردة يجب على جميع أنواع المصادقة تنفيذها.

#### التوقيع

- `abstract check(): Promise<Model>`

### `signIn()`

تسجيل دخول المستخدم.

#### التوقيع

- `signIn(): Promise<any>`

### `signUp()`

تسجيل مستخدم جديد.

#### التوقيع

- `signUp(): Promise<any>`

### `signOut()`

تسجيل خروج المستخدم.

#### التوقيع

- `signOut(): Promise<any>`