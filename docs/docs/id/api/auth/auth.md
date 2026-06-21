---
title: "Auth"
description: "API autentikasi NocoBase: class Auth, memverifikasi identitas user, menerbitkan token."
keywords: "Auth API,autentikasi,login,logout,penerbitan token,NocoBase"
---

# Auth

## Ikhtisar

`Auth` adalah abstract class untuk tipe autentikasi user, mendefinisikan interface yang diperlukan untuk menyelesaikan autentikasi user. Untuk memperluas tipe autentikasi user baru perlu extends class `Auth`, dan mengimplementasikan method-methodnya. Implementasi dasar dapat dilihat di: [BaseAuth](./base-auth.md).

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
  // check: autentikasi
  async check() {
    // ...
  }
}
```

## Properti Instance

### `user`

Informasi user yang terautentikasi.

#### Signature

- `abstract user: Model`

## Method Class

### `constructor()`

Constructor, membuat instance `Auth`.

#### Signature

- `constructor(config: AuthConfig)`

#### Tipe

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Detail

##### AuthConfig

| Properti | Tipe | Deskripsi |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Model data authenticator, di aplikasi NocoBase tipe aktualnya adalah [AuthModel](/auth-verification/auth/dev/api#authmodel) |
| `options` | `Record<string, any>` | Konfigurasi terkait authenticator |
| `ctx` | `Context` | Konteks request |

### `check()`

Autentikasi user, mengembalikan informasi user, abstract method yang harus diimplementasikan oleh semua tipe autentikasi.

#### Signature

- `abstract check(): Promise<Model>`

### `signIn()`

User login.

#### Signature

- `signIn(): Promise<any>`

### `signUp()`

User registrasi.

#### Signature

- `signUp(): Promise<any>`

### `signOut()`

User logout.

#### Signature

- `signOut(): Promise<any>`
