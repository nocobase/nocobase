:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הפניה ל-API

## צד השרת

### Auth

API ליבה, הפניה: [Auth](/api/auth/auth)

### BaseAuth

API ליבה, הפניה: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### סקירה כללית

`AuthModel` הוא מודל הנתונים של המאמת (`Authenticator`, הפניה: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) ו-[Auth - constructor](/api/auth/auth#constructor)) המשמש ביישומי NocoBase. הוא מספק מספר מתודות לניהול אינטראקציה עם אוסף נתוני המשתמשים. בנוסף, ניתן להשתמש גם במתודות המסופקות על ידי Sequelize Model.

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

#### מתודות מחלקה

- `findUser(uuid: string): UserModel` - מאחזר משתמש לפי `uuid`.
  - `uuid` - מזהה משתמש ייחודי מסוג האימות הנוכחי

- `newUser(uuid: string, userValues?: any): UserModel` - יוצר משתמש חדש, ומקשר את המשתמש למאמת הנוכחי באמצעות `uuid`.
  - `uuid` - מזהה משתמש ייחודי מסוג האימות הנוכחי
  - `userValues` - אופציונלי. מידע נוסף על המשתמש. אם לא מועבר, ה-`uuid` ישמש כשם המשתמש (כינוי).

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - מוצא או יוצר משתמש חדש, כלל היצירה זהה לזה שתואר לעיל.
  - `uuid` - מזהה משתמש ייחודי מסוג האימות הנוכחי
  - `userValues` - אופציונלי. מידע נוסף על המשתמש.

## צד הלקוח

### `plugin.registerType()`

רושם את צד הלקוח של סוג האימות.

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

#### חתימה

- `registerType(authType: string, options: AuthOptions)`

#### סוג

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

#### פרטים

- `SignInForm` - טופס התחברות
- `SignInButton` - כפתור התחברות (צד שלישי), יכול לשמש כחלופה לטופס ההתחברות
- `SignUpForm` - טופס הרשמה
- `AdminSettingsForm` - טופס הגדרות מנהל מערכת

### Route

הניתובים (routes) בצד הלקוח עבור תוסף ה-Auth נרשמים באופן הבא:

- פריסת Auth
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- עמוד התחברות
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- עמוד הרשמה
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`