# Auth - Аутентификация

## Обзор

`Auth` — это абстрактный класс для типов аутентификации пользователей. Он определяет интерфейсы, необходимые для завершения аутентификации пользователя. Чтобы расширить новый тип аутентификации пользователя, вам необходимо наследовать класс `Auth` и реализовать его методы. Базовую реализацию см. по адресу: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Проверьте статус аутентификации и верните текущего пользователя.
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
  // проверка: аутентификация
  async check() {
    // ...
  }
}
```

## Свойства экземпляра

### `user`

Аутентифицированная информация о пользователе.

#### Сигнатура

- `abstract user: Model`

## Методы класса

### `constructor()`

Конструктор создает экземпляр `Auth`.

#### Сигнатура

- `constructor(config: AuthConfig)`

#### Тип

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Подробности

##### AuthConfig - Конфигурация аутентификации

| Свойство | Тип | Описание |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Модель данных аутентификатора. Фактический тип в приложении NocoBase — [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options` | `Record<string, any>` | Конфигурация, связанная с аутентификатором.                                                                          |
| `ctx` | `Context` | Контекст запроса.                                                                                              |

### `check()`

Аутентификация пользователя. Возвращает информацию о пользователе. Это абстрактный метод, который должны реализовать все типы аутентификации.

#### Сигнатура

- `abstract check(): Promise<Model>`

### `signIn()`

Вход пользователя.

#### Сигнатура

- `signIn(): Promise<any>`

### `signUp()`

Регистрация пользователя.

#### Сигнатура

- `signUp(): Promise<any>`

### `signOut()`

Выход пользователя.

#### Сигнатура

- `signOut(): Promise<any>`