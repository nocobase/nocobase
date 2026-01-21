:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Довідка з API

## Серверна частина

### Auth

Ядровий API, довідка: [Auth](/api/auth/auth)

### BaseAuth

Ядровий API, довідка: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Огляд

`AuthModel` — це модель даних автентифікатора (`Authenticator`), яка використовується в застосунках NocoBase (див. [AuthManager - setStorer](/api/auth/auth-manager#setstorer) та [Auth - constructor](/api/auth/auth#constructor)). Вона надає методи для взаємодії з таблицею даних користувачів. Крім того, ви можете використовувати методи, що надаються моделлю Sequelize.

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

#### Методи класу

- `findUser(uuid: string): UserModel` — Запитує користувача за `uuid`.
  - `uuid` — Унікальний ідентифікатор користувача для поточного типу автентифікації.

- `newUser(uuid: string, userValues?: any): UserModel` — Створює нового користувача та прив'язує його до поточного автентифікатора за допомогою `uuid`.
  - `uuid` — Унікальний ідентифікатор користувача для поточного типу автентифікації.
  - `userValues` — Необов'язково. Інша інформація про користувача. Якщо не передано, `uuid` буде використано як нікнейм користувача.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` — Знаходить або створює нового користувача. Правила створення такі ж, як описано вище.
  - `uuid` — Унікальний ідентифікатор користувача для поточного типу автентифікації.
  - `userValues` — Необов'язково. Інша інформація про користувача.

## Клієнтська частина

### `plugin.registerType()`

Реєструє клієнт для типу автентифікації.

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

#### Сигнатура

- `registerType(authType: string, options: AuthOptions)`

#### Тип

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

#### Деталі

- `SignInForm` — Форма входу
- `SignInButton` — Кнопка входу (стороннього сервісу), може використовуватися як альтернатива формі входу.
- `SignUpForm` — Форма реєстрації
- `AdminSettingsForm` — Форма налаштувань адміністратора

### Route

Плагін автентифікації реєструє наступні фронтенд-маршрути:

- Макет автентифікації
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Сторінка входу
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Сторінка реєстрації
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`