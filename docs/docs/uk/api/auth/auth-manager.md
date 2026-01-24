:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# AuthManager

## Огляд

`AuthManager` — це модуль керування автентифікацією користувачів у NocoBase, який використовується для реєстрації різних типів автентифікації користувачів.

### Базове використання

```ts
const authManager = new AuthManager({
  // Використовується для отримання ідентифікатора поточного автентифікатора із заголовка запиту
  authKey: 'X-Authenticator',
});

// Встановлює методи для AuthManager для зберігання та отримання автентифікаторів
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Реєструє тип автентифікації
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Використовує проміжне ПЗ для автентифікації
app.resourceManager.use(authManager.middleware());
```

### Концепції

- **Тип автентифікації (`AuthType`)**: Різні методи автентифікації користувачів, наприклад: пароль, SMS, OIDC, SAML тощо.
- **Автентифікатор (`Authenticator`)**: Сутність методу автентифікації, яка фактично зберігається в колекції, відповідає запису конфігурації певного `AuthType`. Один метод автентифікації може мати кілька автентифікаторів, що відповідають різним конфігураціям, надаючи різні методи автентифікації користувачів.
- **Ідентифікатор автентифікатора (`Authenticator name`)**: Унікальний ідентифікатор для автентифікатора, використовується для визначення методу автентифікації для поточного запиту.

## Методи класу

### `constructor()`

Конструктор, створює екземпляр `AuthManager`.

#### Підпис

- `constructor(options: AuthManagerOptions)`

#### Типи

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

#### Деталі

##### AuthManagerOptions

| Властивість | Тип | Опис | Значення за замовчуванням |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Необов'язково, ключ у заголовку запиту, який містить ідентифікатор поточного автентифікатора. | `X-Authenticator` |
| `default` | `string` | Необов'язково, ідентифікатор автентифікатора за замовчуванням. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Необов'язково, може бути налаштований, якщо використовується JWT для автентифікації. | - |

##### JwtOptions

| Властивість | Тип | Опис | Значення за замовчуванням |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Секретний ключ токена | `X-Authenticator` |
| `expiresIn` | `string` | Необов'язково, час дії токена. | `7d` |

### `setStorer()`

Встановлює методи для зберігання та отримання даних автентифікатора.

#### Підпис

- `setStorer(storer: Storer)`

#### Типи

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

#### Деталі

##### Authenticator

| Властивість | Тип | Опис |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Тип автентифікації |
| `options` | `Record<string, any>` | Конфігурація, пов'язана з автентифікатором |

##### Storer

`Storer` — це інтерфейс для зберігання автентифікаторів, що містить один метод.

- `get(name: string): Promise<Authenticator>` - Отримує автентифікатор за його ідентифікатором. У NocoBase фактичний тип, що повертається, — це [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Реєструє тип автентифікації.

#### Підпис

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Типи

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Деталі

| Властивість | Тип | Опис |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | Реалізація типу автентифікації, див. [Auth](./auth) |
| `title` | `string` | Необов'язково. Заголовок цього типу автентифікації, що відображається на інтерфейсі користувача. |

### `listTypes()`

Отримує список зареєстрованих типів автентифікації.

#### Підпис

- `listTypes(): { name: string; title: string }[]`

#### Деталі

| Властивість | Тип | Опис |
| ------- | -------- | ------------ |
| `name` | `string` | Ідентифікатор типу автентифікації |
| `title` | `string` | Заголовок типу автентифікації |

### `get()`

Отримує автентифікатор.

#### Підпис

- `get(name: string, ctx: Context)`

#### Деталі

| Властивість | Тип | Опис |
| ------ | --------- | ---------- |
| `name` | `string` | Ідентифікатор автентифікатора |
| `ctx` | `Context` | Контекст запиту |

### `middleware()`

Проміжне ПЗ для автентифікації. Отримує поточний автентифікатор та виконує автентифікацію користувача.