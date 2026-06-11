---
title: "AuthManager"
description: "Manajer autentikasi NocoBase: AuthManager mengelola berbagai metode autentikasi, mendaftarkan authenticator."
keywords: "AuthManager,manajer autentikasi,registrasi authenticator,beberapa metode autentikasi,NocoBase"
---

# AuthManager

## Ikhtisar

`AuthManager` adalah modul manajemen autentikasi user di NocoBase, digunakan untuk mendaftarkan tipe autentikasi user yang berbeda.

### Penggunaan Dasar

```ts
const authManager = new AuthManager({
  // Digunakan untuk mendapatkan identifier authenticator saat ini dari header request
  authKey: 'X-Authenticator',
});

// Mengatur method penyimpanan dan pengambilan authenticator dari AuthManager
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Mendaftarkan satu tipe autentikasi
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Menggunakan middleware autentikasi
app.resourceManager.use(authManager.middleware());
```

### Penjelasan Konsep

- **Tipe Autentikasi (`AuthType`)**: Berbagai metode autentikasi user, contoh: password, SMS, OIDC, SAML, dll.
- **Authenticator (`Authenticator`)**: Entity metode autentikasi, sebenarnya disimpan di tabel data, sesuai dengan record konfigurasi tipe autentikasi (`AuthType`) tertentu. Satu metode autentikasi dapat memiliki beberapa authenticator, sesuai dengan beberapa konfigurasi, menyediakan metode autentikasi user yang berbeda.
- **Identifier Authenticator (`Authenticator name`)**: Identifier unik dari authenticator, digunakan untuk menentukan metode autentikasi yang digunakan oleh request saat ini.

## Method Class

### `constructor()`

Constructor, membuat instance `AuthManager`.

#### Signature

- `constructor(options: AuthManagerOptions)`

#### Tipe

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

#### Detail

##### AuthManagerOptions

| Properti | Tipe | Deskripsi | Default |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Opsional, key di header request yang menyimpan identifier authenticator saat ini | `X-Authenticator` |
| `default` | `string` | Opsional, identifier authenticator default | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Opsional, jika menggunakan JWT untuk autentikasi, dapat dikonfigurasi | - |

##### JwtOptions

| Properti | Tipe | Deskripsi | Default |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Secret token | `X-Authenticator` |
| `expiresIn` | `string` | Opsional, masa berlaku token | `7d` |

### `setStorer()`

Mengatur method penyimpanan dan pengambilan data authenticator.

#### Signature

- `setStorer(storer: Storer)`

#### Tipe

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

#### Detail

##### Authenticator

| Properti | Tipe | Deskripsi |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Tipe autentikasi |
| `options` | `Record<string, any>` | Konfigurasi terkait authenticator |

##### Storer

`Storer` adalah interface penyimpanan authenticator, berisi satu method.

- `get(name: string): Promise<Authenticator>` - Mendapatkan authenticator melalui identifier authenticator. Di NocoBase, tipe yang sebenarnya dikembalikan adalah [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Mendaftarkan tipe autentikasi.

#### Signature

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Tipe

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Detail

| Properti | Tipe | Deskripsi |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | Implementasi tipe autentikasi, lihat [Auth](./auth) |
| `title` | `string` | Opsional. Judul tipe autentikasi yang ditampilkan di frontend |

### `listTypes()`

Mendapatkan daftar tipe autentikasi yang sudah didaftarkan.

#### Signature

- `listTypes(): { name: string; title: string }[]`

#### Detail

| Properti | Tipe | Deskripsi |
| ------- | -------- | ------------ |
| `name` | `string` | Identifier tipe autentikasi |
| `title` | `string` | Judul tipe autentikasi |

### `get()`

Mendapatkan authenticator.

#### Signature

- `get(name: string, ctx: Context)`

#### Detail

| Properti | Tipe | Deskripsi |
| ------ | --------- | ---------- |
| `name` | `string` | Identifier authenticator |
| `ctx` | `Context` | Konteks request |

### `middleware()`

Middleware autentikasi. Mendapatkan authenticator saat ini, melakukan autentikasi user.
