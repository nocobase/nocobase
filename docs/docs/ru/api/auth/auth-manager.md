# AuthManager - Менеджер аутентификации

## Обзор

`AuthManager` — это модуль управления аутентификацией пользователей в NocoBase, используемый для регистрации различных типов аутентификации пользователей.

### Базовое использование

```ts
const authManager = new AuthManager({
  // Используется для получения текущего идентификатора аутентификатора из заголовка запроса.
  authKey: 'X-Authenticator',
});

// Установите методы для AuthManager для хранения и получения аутентификаторов.
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Зарегистрируйте тип аутентификации
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Используйте промежуточное программное обеспечение аутентификации
app.resourceManager.use(authManager.middleware());
```

### Концепции

- **`AuthType`**: различные методы аутентификации пользователя, такие как пароль, SMS, OIDC, SAML и т. д.
- **`Authenticator`**: сущность метода аутентификации, фактически хранящаяся в коллекции, соответствующей записи конфигурации определенного `AuthType`. Один метод аутентификации может иметь несколько аутентификаторов, соответствующих нескольким конфигурациям, обеспечивающим разные методы аутентификации пользователя.
- **`Authenticator name`**: уникальный идентификатор аутентификатора, используемый для определения метода аутентификации для текущего запроса.

## Методы класса

### `constructor()`

Конструктор создает экземпляр `AuthManager`.

#### Сигнатура

- `constructor(options: AuthManagerOptions)`

#### Типы

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

#### Подробности

##### Параметры AuthManager

| Свойство | Тип | Описание | По умолчанию |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Необязательно: ключ в заголовке запроса, содержащий текущий идентификатор аутентификатора. | `X-Authenticator` |
| `default` | `string` | Необязательно, идентификатор аутентификатора по умолчанию. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Необязательно, можно настроить, если для аутентификации используется JWT. | - |

##### JwtOptions

| Свойство | Тип | Описание | По умолчанию |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Секрет токена | `X-Authenticator` |
| `expiresIn` | `string` | Необязательно, срок действия токена. | `7d` |

### `setStorer()`

Устанавливает методы хранения и получения данных аутентификатора.

#### Сигнатура

- `setStorer(storer: Storer)`

#### Типы

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

#### Подробности

##### Аутентификатор

| Свойство | Тип | Описание |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Тип аутентификации |
| `options` | `Record<string, any>` | Конфигурация, связанная с аутентификатором |

##### Storer

`Storer` — интерфейс хранения аутентификаторов, содержащий один метод.

- `get(name: string): Promise<Authenticator>` - ​​Получает аутентификатор по его идентификатору. В NocoBase фактический возвращаемый тип — [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Регистрирует тип аутентификации.

#### Сигнатура

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Типы

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Подробности

| Свойство | Тип | Описание |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | Реализация типа аутентификации см. [Авторизация](./auth) |
| `title` | `string` | Необязательный. Название этого типа аутентификации отображается на веб-интерфейсе. |

### `listTypes()`

Получает список зарегистрированных типов аутентификации.

#### Сигнатура

- `listTypes(): { name: string; title: string }[]`

#### Подробности

| Свойство | Тип | Описание |
| ------- | -------- | ------------ |
| `name` | `string` | Идентификатор типа аутентификации |
| `title` | `string` | Название типа аутентификации |

### `get()`

Получает аутентификатор.

#### Сигнатура

- `get(name: string, ctx: Context)`

#### Подробности

| Свойство | Тип | Описание |
| ------ | --------- | ---------- |
| `name` | `string` | Идентификатор аутентификатора |
| `ctx` | `Context` | Контекст запроса |

### `middleware()`

Промежуточное программное обеспечение аутентификации. Получает текущий аутентификатор и выполняет аутентификацию пользователя.