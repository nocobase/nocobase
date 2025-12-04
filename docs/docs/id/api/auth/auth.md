:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Auth

## Gambaran Umum

`Auth` adalah kelas abstrak untuk tipe autentikasi pengguna. Kelas ini mendefinisikan antarmuka yang diperlukan untuk menyelesaikan autentikasi pengguna. Untuk memperluas tipe autentikasi pengguna baru, Anda perlu mewarisi kelas `Auth` dan mengimplementasikan metodenya. Untuk implementasi dasar, lihat: [BaseAuth](./base-auth.md).

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

## Properti Instans

### `user`

Informasi pengguna yang terautentikasi.

#### Signature

- `abstract user: Model`

## Metode Kelas

### `constructor()`

Konstruktor, membuat sebuah instans `Auth`.

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

| Properti        | Tipe                                            | Deskripsi                                                                                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Model data autentikator. Tipe sebenarnya dalam aplikasi NocoBase adalah [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Konfigurasi terkait autentikator.                                                                          |
| `ctx`           | `Context`                                       | Konteks permintaan.                                                                                              |

### `check()`

Autentikasi pengguna. Metode ini mengembalikan informasi pengguna dan merupakan metode abstrak yang harus diimplementasikan oleh semua tipe autentikasi.

#### Signature

- `abstract check(): Promise<Model>`

### `signIn()`

Masuk pengguna.

#### Signature

- `signIn(): Promise<any>`

### `signUp()`

Daftar pengguna.

#### Signature

- `signUp(): Promise<any>`

### `signOut()`

Keluar pengguna.

#### Signature

- `signOut(): Promise<any>`