# Auth

## Overview

The `Auth` class is mainly used on the client side to access user information and request user authentication-related APIs.

## Instance Properties

### `locale`

The language used by the current user.

### `role`

The role used by the current user.

### `token`

API `token`.

### `authenticator`

The authenticator used for the current user's authentication. See [User Authentication](/auth-verification/auth/).

## Class Methods

### `signIn()`

User sign in.

#### Signature

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parameter Name  | Type     | Description                                          |
| --------------- | -------- | ---------------------------------------------------- |
| `values`        | `any`    | Request parameters for the sign-in API               |
| `authenticator` | `string` | The identifier of the authenticator used for sign-in |

### `signUp()`

User sign up.

#### Signature

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parameter Name  | Type     | Description                                          |
| --------------- | -------- | ---------------------------------------------------- |
| `values`        | `any`    | Request parameters for the sign-up API               |
| `authenticator` | `string` | The identifier of the authenticator used for sign-up |

### `signOut()`

Sign out.

#### Signature

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parameter Name  | Type     | Description                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `values`        | `any`    | Request parameters for the sign-out API               |
| `authenticator` | `string` | The identifier of the authenticator used for sign-out |