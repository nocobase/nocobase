# BaseAuth - Базовая аутентификация

## Обзор

`BaseAuth` наследуется от абстрактного класса [Auth](./auth) и является базовой реализацией типов аутентификации пользователей, использующей JWT в качестве метода аутентификации. В большинстве случаев вы можете расширить типы аутентификации пользователей, наследуя их от `BaseAuth`, и нет необходимости наследовать непосредственно от абстрактного класса `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Установить коллекцию пользователей
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Логика аутентификации пользователя, вызываемая `auth.signIn`
  // Возврат пользовательских данных
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Методы класса

### `constructor()`

Конструктор создает экземпляр `BaseAuth`.

#### Сигнатура

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Подробности

| Свойство | Тип | Описание |
| :--- | :--- | :--- |
| `config` | `AuthConfig` | См. [Auth - AuthConfig](./auth#authconfig) |
| `userCollection` | `Collection` | Коллекция пользователей, например, `db.getCollection('users')`. См. [Collection](../database/collection) |

### `user()`

Метод доступа, устанавливает и получает информацию о пользователе. По умолчанию для доступа используется объект `ctx.state.currentUser`.

#### Сигнатура

- `set user()`
- `get user()`

### `check()`

Аутентифицируется через токен запроса и возвращает информацию о пользователе.

### `signIn()`

Вход пользователя, генерирует токен.

### `signUp()`

Регистрация пользователя.

### `signOut()`

Выход пользователя, срок действия токена истекает.

### `validate()` *

Базовая логика аутентификации, вызываемая интерфейсом `signIn`, чтобы определить, может ли пользователь успешно войти в систему.