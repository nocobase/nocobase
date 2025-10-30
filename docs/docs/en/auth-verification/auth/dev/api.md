# API Reference

## Server-side

### Auth

Core API, see: [Auth](/api/auth/auth)

### BaseAuth

Core API, see: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Overview

`AuthModel` is the data model for the authenticator (`Authenticator`, see: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) and [Auth - constructor](/api/auth/auth#constructor)) used in NocoBase applications. It provides some methods for interacting with the user collection. In addition, methods provided by the Sequelize Model can also be used.

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

#### Class Methods

- `findUser(uuid: string): UserModel` - Finds a user by `uuid`.
  - `uuid` - The user's unique identifier from the current authentication type

- `newUser(uuid: string, userValues?: any): UserModel` - Creates a new user and binds the user to the current authenticator via `uuid`.
  - `uuid` - The user's unique identifier from the current authentication type
  - `userValues` - Optional. Other user information. If not passed, `uuid` will be used as the user's nickname.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Finds or creates a new user. The creation rule is the same as above.
  - `uuid` - The user's unique identifier from the current authentication type
  - `userValues` - Optional. Other user information.

## Client-side

### `plugin.registerType()`

Registers the client-side for an authentication type.

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

#### Signature

- `registerType(authType: string, options: AuthOptions)`

#### Type

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

#### Details

- `SignInForm` - Sign-in form
- `SignInButton` - Sign-in (third-party) button, can be used as an alternative to the sign-in form
- `SignUpForm` - Sign-up form
- `AdminSettingsForm` - Admin settings form

### Route

The auth plugin registers the following front-end routes:

- Auth Layout
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Sign-in Page
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Sign-up Page
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`