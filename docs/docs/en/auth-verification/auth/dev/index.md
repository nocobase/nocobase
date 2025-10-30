# Extend Authentication Types

## Overview

NocoBase supports extending user authentication types as needed. There are generally two types of user authentication. One is to determine the user's identity within the NocoBase application, such as password login, SMS login, etc. The other is to have a third-party service determine the user's identity and notify the NocoBase application of the result through a callback, such as OIDC, SAML, and other authentication methods. The authentication processes for these two different types of authentication methods in NocoBase are basically as follows:

### Without Third-party Callback Dependency

1. The client uses the NocoBase SDK to call the sign-in API `api.auth.signIn()`, requesting the `auth:signIn` API, and simultaneously sends the identifier of the current authenticator to the backend via the `X-Authenticator` request header.
2. The `auth:signIn` API forwards the request to the corresponding authentication type based on the authenticator identifier in the request header. The `validate` method in the authenticator class registered for this authentication type handles the corresponding logic.
3. The client receives the user information and authentication `token` from the `auth:signIn` API response, saves the `token` to Local Storage, and completes the sign-in. This step is automatically handled internally by the SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### With Third-party Callback Dependency

1. The client obtains the third-party login URL through its own registered API (e.g., `auth:getAuthUrl`) and carries information such as the application name and authenticator identifier according to the protocol.
2. Redirect to the third-party URL to complete the sign-in. The third-party service calls the callback API of the NocoBase application (which needs to be registered by yourself, e.g., `auth:redirect`), returning the authentication result along with information like the application name and authenticator identifier.
3. The callback API method parses the parameters to get the authenticator identifier, obtains the corresponding authenticator class through `AuthManager`, and actively calls the `auth.signIn()` method. The `auth.signIn()` method will call the `validate()` method to handle the authentication logic.
4. The callback method gets the authentication `token`, then 302 redirects back to the front-end page, and includes the `token` and authenticator identifier in the URL parameters, `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

The following sections describe how to register server-side APIs and client-side user interfaces.

## Server-side

### Authentication API

The NocoBase core provides registration and management for extending authentication types. The core logic processing of an extended login plugin needs to inherit the core's `Auth` abstract class and implement the corresponding standard interfaces.
For the complete API reference, see [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

The core also registers basic resource actions related to user authentication.

| API | Description |
| -------------- | ---------------- |
| `auth:check` | Check if the user is signed in |
| `auth:signIn` | Sign in |
| `auth:signUp` | Sign up |
| `auth:signOut` | Sign out |

In most cases, extended user authentication types can also use the existing JWT authentication logic to generate credentials for user API access. The core's `BaseAuth` class provides a basic implementation of the `Auth` abstract class, see [BaseAuth](../../../api/auth/base-auth.md). Plugins can directly inherit the `BaseAuth` class to reuse some logic and reduce development costs.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Set the user collection
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implement user authentication logic
  async validate() {}
}
```

### User Data

When implementing user authentication logic, it usually involves user data processing. In a NocoBase application, the relevant collections are defined by default as follows:

| Collection | Purpose | Plugin |
| --------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `users` | Stores user information, such as email, nickname, and password | [Users plugin (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators` | Stores authenticator (authentication type entity) information, corresponding to the authentication type and configuration | User Authentication plugin (`@nocobase/plugin-auth`) |
| `usersAuthenticators` | Associates users and authenticators, saving user information under the corresponding authenticator | User Authentication plugin (`@nocobase/plugin-auth`) |

Usually, extended login methods can use `users` and `usersAuthenticators` to store the corresponding user data. Only in special cases is it necessary to create a new Collection.

The main fields of `usersAuthenticators` are:

| Field | Description |
| --------------- | ---------------------------------------------------- |
| `uuid` | The user's unique identifier for this authentication method, such as a phone number, WeChat openid, etc. |
| `meta` | JSON field, for other information that needs to be saved |
| `userId` | User ID |
| `authenticator` | Authenticator name (unique identifier) |

For user query and creation operations, the `AuthModel` data model of `authenticators` also encapsulates several methods that can be used in the `CustomAuth` class via `this.authenticator[methodName]`. For the complete API reference, see [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Find user
    this.authenticator.newUser(); // Create new user
    this.authenticator.findOrCreateUser(); // Find or create new user
    // ...
  }
}
```

### Registering Authentication Types

Extended authentication methods need to be registered with the authentication management module.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Client-side

The client-side user interface is registered through the `registerType` interface provided by the User Authentication plugin client:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Sign-in form
        SignInButton, // Sign-in (third-party) button, can be an alternative to the sign-in form
        SignUpForm, // Sign-up form
        AdminSettingsForm, // Admin settings form
      },
    });
  }
}
```

### Sign-in Form


![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)


If multiple authenticators corresponding to authentication types have registered a sign-in form, they will be displayed as tabs. The tab title is the authenticator title configured in the admin.


![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)


### Sign-in Button


![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)


Usually a third-party sign-in button, but it can actually be any component.

### Sign-up Form


![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)


If you need to navigate from the sign-in page to the sign-up page, you need to handle it yourself in the sign-in component.

### Admin Settings Form


![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)


The upper part is for general authenticator configuration, and the lower part is for the registrable custom configuration form.

### Requesting APIs

To initiate API requests related to user authentication on the client-side, you can use the SDK provided by NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// use in component
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

For detailed API reference, see [@nocobase/sdk - Auth](/api/sdk/auth).