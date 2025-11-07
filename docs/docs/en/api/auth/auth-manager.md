# AuthManager

## Overview

`AuthManager` is the user authentication management module in NocoBase, used to register different user authentication types.

### Basic Usage

```ts
const authManager = new AuthManager({
  // Used to get the current authenticator identifier from the request header
  authKey: 'X-Authenticator',
});

// Set the methods for AuthManager to store and retrieve authenticators
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Register an authentication type
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Use the authentication middleware
app.resourceManager.use(authManager.middleware());
```

### Concepts

- **`AuthType`**: Different user authentication methods, such as password, SMS, OIDC, SAML, etc.
- **`Authenticator`**: The entity for an authentication method, actually stored in a collection, corresponding to a configuration record of a certain `AuthType`. One authentication method can have multiple authenticators, corresponding to multiple configurations, providing different user authentication methods.
- **`Authenticator name`**: The unique identifier for an authenticator, used to determine the authentication method for the current request.

## Class Methods

### `constructor()`

Constructor, creates an `AuthManager` instance.

#### Signature

- `constructor(options: AuthManagerOptions)`

#### Types

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

#### Details

##### AuthManagerOptions

| Property | Type | Description | Default |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Optional, the key in the request header that holds the current authenticator identifier. | `X-Authenticator` |
| `default` | `string` | Optional, the default authenticator identifier. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Optional, can be configured if using JWT for authentication. | - |

##### JwtOptions

| Property | Type | Description | Default |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Token secret | `X-Authenticator` |
| `expiresIn` | `string` | Optional, token expiration time. | `7d` |

### `setStorer()`

Sets the methods for storing and retrieving authenticator data.

#### Signature

- `setStorer(storer: Storer)`

#### Types

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

#### Details

##### Authenticator

| Property | Type | Description |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Authentication type |
| `options` | `Record<string, any>` | Authenticator-related configuration |

##### Storer

`Storer` is the interface for authenticator storage, containing one method.

- `get(name: string): Promise<Authenticator>` - Gets an authenticator by its identifier. In NocoBase, the actual returned type is [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registers an authentication type.

#### Signature

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Types

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Details

| Property | Type | Description |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | The authentication type implementation, see [Auth](./auth) |
| `title` | `string` | Optional. The title of this authentication type displayed on the frontend. |

### `listTypes()`

Gets the list of registered authentication types.

#### Signature

- `listTypes(): { name: string; title: string }[]`

#### Details

| Property | Type | Description |
| ------- | -------- | ------------ |
| `name` | `string` | Authentication type identifier |
| `title` | `string` | Authentication type title |

### `get()`

Gets an authenticator.

#### Signature

- `get(name: string, ctx: Context)`

#### Details

| Property | Type | Description |
| ------ | --------- | ---------- |
| `name` | `string` | Authenticator identifier |
| `ctx` | `Context` | Request context |

### `middleware()`

Authentication middleware. Gets the current authenticator and performs user authentication.