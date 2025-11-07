# API Reference

## Server Side

### Auth

Kernel API, reference: [Auth](/api/auth/auth)

### BaseAuth

Kernel API, reference: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Overview

`AuthModel` is the authenticator used in NocoBase applications (`Authenticator`, reference: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) and [Auth - constructor](/api/auth/auth#constructor)) data model, providing some methods for interacting with the user data collection. In addition, methods provided by Sequelize Model can also be used.

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

- `findUser(uuid: string): UserModel` - Query user by `uuid`.
  - `uuid` - User unique identifier from the current authentication type

- `newUser(uuid: string, userValues?: any): UserModel` - Create a new user, bind the user to the current authenticator through `uuid`.
  - `uuid` - User unique identifier from the current authentication type
  - `userValues` - Optional. Other user information. When not passed, `uuid` will be used as the user's nickname.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Find or create a new user, the creation rule is the same as above.
  - `uuid` - User unique identifier from the current authentication type
  - `userValues` - Optional. Other user information.

## Client Side

### `plugin.registerType()`

Register the client of the authentication type.

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

- `SignInForm` - Sign in form
- `SignInButton` - Sign in (third-party) button, can be used as an alternative to the sign-in form
- `SignUpForm` - Sign up form
- `AdminSettingsForm` - Admin configuration form

### Route

The frontend routes for registering the auth plugin are as follows:

- Auth Layout
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- SignIn Page
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- SignUp Page
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`