# BaseAuth

## Overview

`BaseAuth` inherits from the [Auth](./auth) abstract class and is the basic implementation for user authentication types, using JWT as the authentication method. In most cases, you can extend user authentication types by inheriting from `BaseAuth`, and there is no need to inherit directly from the `Auth` abstract class.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Set the user collection
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // User authentication logic, called by `auth.signIn`
  // Return user data
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Class Methods

### `constructor()`

Constructor, creates a `BaseAuth` instance.

#### Signature

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Details

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `config` | `AuthConfig` | See [Auth - AuthConfig](./auth#authconfig) |
| `userCollection` | `Collection` | User collection, e.g., `db.getCollection('users')`. See [DataBase - Collection](../database/collection) |

### `user()`

Accessor, sets and gets user information. By default, it uses the `ctx.state.currentUser` object for access.

#### Signature

- `set user()`
- `get user()`

### `check()`

Authenticates via the request token and returns user information.

### `signIn()`

User sign-in, generates a token.

### `signUp()`

User sign-up.

### `signOut()`

User sign-out, expires the token.

### `validate()` *

Core authentication logic, called by the `signIn` interface, to determine if the user can sign in successfully.