:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# مرجع API

## جانب الخادم

### Auth

واجهة برمجة تطبيقات أساسية (Kernel API)، المرجع: [Auth](/api/auth/auth)

### BaseAuth

واجهة برمجة تطبيقات أساسية (Kernel API)، المرجع: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### نظرة عامة

`AuthModel` هو نموذج البيانات للمصادق (Authenticator) المستخدم في تطبيقات NocoBase (المرجع: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) و [Auth - constructor](/api/auth/auth#constructor)). يوفر هذا النموذج بعض الطرق للتفاعل مع مجموعة بيانات المستخدم. بالإضافة إلى ذلك، يمكن استخدام الطرق التي يوفرها نموذج Sequelize.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### طرق الفئة

- `findUser(uuid: string): UserModel` - يستعلم عن المستخدم باستخدام `uuid`.
  - `uuid` - المعرف الفريد للمستخدم من نوع المصادقة الحالي.

- `newUser(uuid: string, userValues?: any): UserModel` - ينشئ مستخدمًا جديدًا، ويربط المستخدم بالمصادق الحالي عبر `uuid`.
  - `uuid` - المعرف الفريد للمستخدم من نوع المصادقة الحالي.
  - `userValues` - اختياري. معلومات المستخدم الأخرى. إذا لم يتم تمريره، فسيتم استخدام `uuid` كاسم مستعار للمستخدم.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - يبحث عن مستخدم أو ينشئ مستخدمًا جديدًا، وقاعدة الإنشاء هي نفسها المذكورة أعلاه.
  - `uuid` - المعرف الفريد للمستخدم من نوع المصادقة الحالي.
  - `userValues` - اختياري. معلومات المستخدم الأخرى.

## جانب العميل

### `plugin.registerType()`

يسجل عميل نوع المصادقة.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### التوقيع

- `registerType(authType: string, options: AuthOptions)`

#### النوع

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### التفاصيل

- `SignInForm` - نموذج تسجيل الدخول
- `SignInButton` - زر تسجيل الدخول (جهة خارجية)، يمكن استخدامه كبديل لنموذج تسجيل الدخول.
- `SignUpForm` - نموذج التسجيل
- `AdminSettingsForm` - نموذج إعدادات المسؤول

### المسار

تسجل إضافة المصادقة (auth) مسارات الواجهة الأمامية على النحو التالي:

- تخطيط المصادقة (Auth Layout)
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- صفحة تسجيل الدخول
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- صفحة التسجيل
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`