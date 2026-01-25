# Auth

## Overview

`Auth` is an abstract class for user authentication types. It defines the interfaces required to complete user authentication. To extend a new user authentication type, you need to inherit the `Auth` class and implement its methods. For a basic implementation, refer to: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
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
  // check: authentication
  async check() {
    // ...
  }
}
```

## Instance Properties

### `user`

Authenticated user information.

#### Signature

- `abstract user: Model`

## Class Methods

### `constructor()`

Constructor, creates an `Auth` instance.

#### Signature

- `constructor(config: AuthConfig)`

#### Type

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Details

##### AuthConfig

| Property        | Type                                            | Description                                                                                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Authenticator data model. The actual type in a NocoBase application is [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Authenticator-related configuration.                                                                          |
| `ctx`           | `Context`                                       | Request context.                                                                                              |

### `check()`

User authentication. Returns user information. This is an abstract method that all authentication types must implement.

#### Signature

- `abstract check(): Promise<Model>`

### `signIn()`

User sign in.

#### Signature

- `signIn(): Promise<any>`

### `signUp()`

User sign up.

#### Signature

- `signUp(): Promise<any>`

### `signOut()`

User sign out.

#### Signature

- `signOut(): Promise<any>`