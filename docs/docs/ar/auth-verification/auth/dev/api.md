# مرجع API

## جانب الخادم

### Auth
API النواة، مرجع: [Auth](/api/auth/auth)

### BaseAuth
API النواة، مرجع: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### نظرة عامة

`AuthModel` هو نموذج بيانات أداة المصادقة المستخدمة في تطبيقات NocoBase (`Authenticator`، مرجع: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) و[Auth - constructor](/api/auth/auth#constructor))، ويوفر بعض الطرق للتفاعل مع مجموعة بيانات المستخدم. بالإضافة إلى ذلك، يمكن أيضًا استخدام الطرق التي يوفرها Sequelize Model.

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

- `findUser(uuid: string): UserModel` - استعلام المستخدم بواسطة `uuid`.
  - `uuid` - المعرف الفريد للمستخدم من نوع المصادقة الحالي
- `newUser(uuid: string, userValues?: any): UserModel` - إنشاء مستخدم جديد، وربط المستخدم بأداة المصادقة الحالية من خلال `uuid`.
  - `uuid` - المعرف الفريد للمستخدم من نوع المصادقة الحالي
  - `userValues` - اختياري. معلومات المستخدم الأخرى. عند عدم تمريره، سيُستخدم `uuid` كاسم مستعار للمستخدم.
- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - البحث عن مستخدم أو إنشاء مستخدم جديد، قاعدة الإنشاء هي نفسها كما سبق.
  - `uuid` - المعرف الفريد للمستخدم من نوع المصادقة الحالي
  - `userValues` - اختياري. معلومات المستخدم الأخرى.

## جانب العميل

### `plugin.registerType()`

تسجيل عميل نوع المصادقة.

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
- `SignInButton` - زر تسجيل الدخول (طرف ثالث)، يمكن استخدامه كبديل لنموذج تسجيل الدخول
- `SignUpForm` - نموذج التسجيل
- `AdminSettingsForm` - نموذج تهيئة المسؤول

### المسار

مسارات الواجهة الأمامية لتسجيل إضافة المصادقة هي كما يلي:

- تخطيط المصادقة
  - الاسم: `auth`
  - المسار: `-`
  - المكوّن: `AuthLayout`
- صفحة تسجيل الدخول
  - الاسم: `auth.signin`
  - المسار: `/signin`
  - المكوّن: `SignInPage`
- صفحة التسجيل
  - الاسم: `auth.signup`
  - المسار: `/signup`
  - المكوّن: `SignUpPage`
