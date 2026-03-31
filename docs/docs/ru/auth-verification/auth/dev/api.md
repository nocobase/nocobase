:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Справочник API

## Серверная часть

### Auth

Базовый API. См. также: [Auth](/api/auth/auth)

### BaseAuth

Базовый API. См. также: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Обзор

`AuthModel` — это модель данных аутентификатора (`Authenticator`), используемая в приложениях NocoBase (см. также: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) и [Auth - constructor](/api/auth/auth#constructor)). Она предоставляет методы для взаимодействия с пользовательской коллекцией данных. Кроме того, вы можете использовать методы, предоставляемые Sequelize Model.

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

- `findUser(uuid: string): UserModel` — Позволяет найти пользователя по `uuid`.
  - `uuid` — Уникальный идентификатор пользователя для текущего типа аутентификации.

- `newUser(uuid: string, userValues?: any): UserModel` — Создает нового пользователя и привязывает его к текущему аутентификатору с помощью `uuid`.
  - `uuid` — Уникальный идентификатор пользователя для текущего типа аутентификации.
  - `userValues` — Необязательный параметр. Дополнительная информация о пользователе. Если не указан, `uuid` будет использоваться в качестве имени пользователя.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` — Находит или создает нового пользователя. Правила создания аналогичны описанным выше.
  - `uuid` — Уникальный идентификатор пользователя для текущего типа аутентификации.
  - `userValues` — Необязательный параметр. Дополнительная информация о пользователе.

## Клиентская часть

### `plugin.registerType()`

Регистрирует клиент для типа аутентификации.

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

#### Подробности

- `SignInForm` — Форма входа
- `SignInButton` — Кнопка входа (стороннего сервиса), может использоваться как альтернатива форме входа.
- `SignUpForm` — Форма регистрации
- `AdminSettingsForm` — Форма настроек администратора.

### Маршруты

Плагин аутентификации регистрирует следующие клиентские маршруты:

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