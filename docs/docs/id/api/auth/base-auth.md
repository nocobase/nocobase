---
title: "BaseAuth"
description: "Class dasar autentikasi NocoBase: BaseAuth sebagai class dasar untuk memperluas tipe autentikasi."
keywords: "BaseAuth,autentikasi,perluas autentikasi,NocoBase"
---

# BaseAuth

## Ikhtisar

`BaseAuth` extends dari abstract class [Auth](./auth), adalah implementasi dasar tipe autentikasi user, menggunakan JWT sebagai metode autentikasi. Pada sebagian besar kasus, untuk memperluas tipe autentikasi user dapat extends `BaseAuth`, tidak perlu langsung extends abstract class `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Mengatur tabel data user
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logika autentikasi user, dipanggil oleh `auth.signIn`
  // Mengembalikan data user
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Method Class

### `constructor()`

Constructor, membuat instance `BaseAuth`.

#### Signature

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Detail

| Parameter | Tipe | Deskripsi |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `config` | `AuthConfig` | Lihat [Auth - AuthConfig](./auth#authconfig) |
| `userCollection` | `Collection` | Tabel data user, contoh: `db.getCollection('users')`, lihat [DataBase - Collection](../database/collection) |

### `user()`

Accessor, mengatur dan mengambil informasi user, secara default menggunakan objek `ctx.state.currentUser` untuk akses.

#### Signature

- `set user()`
- `get user()`

### `check()`

Autentikasi melalui token request, mengembalikan informasi user.

### `signIn()`

User login, menghasilkan token.

### `signUp()`

User registrasi.

### `signOut()`

User logout, token expired.

### `validate()` \*

Logika inti autentikasi, dipanggil oleh interface `signIn`, menentukan apakah user dapat berhasil login.
