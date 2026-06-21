# Справочник API

## Серверная часть

### Аутентификация (Auth)

Справка по API ядра: [Auth](/api/auth/auth)

### Базовая аутентификация (BaseAuth)

Справка по API ядра: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Обзор

`AuthModel` — это аутентификатор, используемый в приложениях NocoBase(см. также: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) и [Auth - constructor](/api/auth/auth#constructor)),  предоставляющий некоторые методы для взаимодействия с коллекцией данных пользователей. Кроме того, могут использоваться и методы, предоставляемые Sequelize Model.

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

#### Методы класса

- `findUser(uuid: string): UserModel` — получить пользователя по `uuid`.
  - `uuid` — уникальный идентификатор пользователя для текущего типа аутентификации

- `newUser(uuid: string, userValues?: any): UserModel` — создать нового пользователя и привязать его к текущему аутентификатору через `uuid`.
  - `uuid` — уникальный идентификатор пользователя для текущего типа аутентификации
  - `userValues` — опционально. Другая информация о пользователе. Если не передано, `uuid` будет использован как никнейм пользователя.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` — найти или создать пользователя; правило создания то же, что указано выше.
  - `uuid` — уникальный идентификатор пользователя для текущего типа аутентификации
  - `userValues` — опционально. Другая информация о пользователе.

## Клиентская часть

### `plugin.registerType()`

Регистрация клиента типа аутентификации.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // Кнопка входа
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

#### Подробности

- `SignInForm` — форма входа
- `SignInButton` — кнопка входа (сторонняя), может использоваться как альтернатива форме входа
- `SignUpForm` — форма регистрации
- `AdminSettingsForm` — форма конфигурации администратора

### Маршрут

Ниже приведены  клиентские маршруты для регистрации auth-плагина:

- Макет аутентификации
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Страница входа
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Страница регистрации
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`