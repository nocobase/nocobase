:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Автентифікація

## Огляд

`Auth` — це абстрактний клас для типів автентифікації користувачів. Він визначає інтерфейси, необхідні для завершення автентифікації користувача. Щоб розширити систему новим типом автентифікації, вам потрібно успадкувати клас `Auth` та реалізувати його методи. Приклад базової реалізації можна знайти тут: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Перевіряє статус автентифікації та повертає поточного користувача.
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
  // check: автентифікація
  async check() {
    // ...
  }
}
```

## Властивості екземпляра

### `user`

Інформація про автентифікованого користувача.

#### Підпис

- `abstract user: Model`

## Методи класу

### `constructor()`

Конструктор, створює екземпляр `Auth`.

#### Підпис

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

#### Деталі

##### AuthConfig

| Властивість     | Тип                                             | Опис                                                                                                  |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Модель даних автентифікатора. Фактичний тип у застосунку NocoBase — це [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Конфігурація, пов'язана з автентифікатором.                                                           |
| `ctx`           | `Context`                                       | Контекст запиту.                                                                                      |

### `check()`

Автентифікація користувача. Повертає інформацію про користувача. Це абстрактний метод, який повинні реалізувати всі типи автентифікації.

#### Підпис

- `abstract check(): Promise<Model>`

### `signIn()`

Вхід користувача.

#### Підпис

- `signIn(): Promise<any>`

### `signUp()`

Реєстрація користувача.

#### Підпис

- `signUp(): Promise<any>`

### `signOut()`

Вихід користувача.

#### Підпис

- `signOut(): Promise<any>`