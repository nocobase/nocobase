:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# AuthManager

## Ikhtisar

`AuthManager` adalah modul manajemen autentikasi pengguna di NocoBase, yang digunakan untuk mendaftarkan berbagai jenis autentikasi pengguna.

### Penggunaan Dasar

```ts
const authManager = new AuthManager({
  // Digunakan untuk mendapatkan pengenal autentikator saat ini dari header permintaan
  authKey: 'X-Authenticator',
});

// Mengatur metode untuk AuthManager dalam menyimpan dan mengambil autentikator
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Mendaftarkan jenis autentikasi
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Menggunakan middleware autentikasi
app.resourceManager.use(authManager.middleware());
```

### Konsep

- **Jenis Autentikasi (`AuthType`)**: Berbagai metode autentikasi pengguna, seperti kata sandi, SMS, OIDC, SAML, dll.
- **Autentikator (`Authenticator`)**: Entitas untuk metode autentikasi, yang sebenarnya disimpan dalam sebuah koleksi, sesuai dengan catatan konfigurasi dari `AuthType` tertentu. Satu metode autentikasi dapat memiliki beberapa autentikator, yang sesuai dengan beberapa konfigurasi, menyediakan berbagai metode autentikasi pengguna.
- **Pengenal Autentikator (`Authenticator name`)**: Pengenal unik untuk autentikator, yang digunakan untuk menentukan metode autentikasi yang digunakan oleh permintaan saat ini.

## Metode Kelas

### `constructor()`

Konstruktor, membuat sebuah instans `AuthManager`.

#### Tanda Tangan

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

| Properti  | Tipe                        | Deskripsi                                             | Nilai Default     |
| --------- | --------------------------- | ----------------------------------------------------- | ----------------- |
| `authKey` | `string`                    | Opsional, kunci di header permintaan yang menyimpan pengenal autentikator saat ini. | `X-Authenticator` |
| `default` | `string`                    | Opsional, pengenal autentikator default.              | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | Opsional, dapat dikonfigurasi jika menggunakan JWT untuk autentikasi. | -                 |

##### JwtOptions

| Properti    | Tipe     | Deskripsi               | Nilai Default     |
| ----------- | -------- | ----------------------- | ----------------- |
| `secret`    | `string` | Kunci rahasia token     | `X-Authenticator` |
| `expiresIn` | `string` | Opsional, waktu kedaluwarsa token. | `7d`              |

### `setStorer()`

Mengatur metode untuk menyimpan dan mengambil data autentikator.

#### Tanda Tangan

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

| Properti   | Tipe                  | Deskripsi                    |
| ---------- | --------------------- | ---------------------------- |
| `authType` | `string`              | Jenis autentikasi            |
| `options`  | `Record<string, any>` | Konfigurasi terkait autentikator |

##### Storer

`Storer` adalah antarmuka untuk penyimpanan autentikator, yang berisi satu metode.

- `get(name: string): Promise<Authenticator>` - Mendapatkan autentikator berdasarkan pengenalnya. Di NocoBase, tipe yang sebenarnya dikembalikan adalah [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Mendaftarkan jenis autentikasi.

#### Tanda Tangan

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Tipe

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // Kelas autentikasi.
  title?: string; // Nama tampilan dari jenis autentikasi.
};
```

#### Detail

| Properti | Tipe               | Deskripsi                                         |
| ------- | ------------------ | ------------------------------------------------- |
| `auth`  | `AuthExtend<Auth>` | Implementasi jenis autentikasi, lihat [Auth](./auth) |
| `title` | `string`           | Opsional. Judul jenis autentikasi ini yang ditampilkan di frontend. |

### `listTypes()`

Mendapatkan daftar jenis autentikasi yang terdaftar.

#### Tanda Tangan

- `listTypes(): { name: string; title: string }[]`

#### Detail

| Properti | Tipe     | Deskripsi                   |
| ------- | -------- | --------------------------- |
| `name`  | `string` | Pengenal jenis autentikasi  |
| `title` | `string` | Judul jenis autentikasi     |

### `get()`

Mendapatkan autentikator.

#### Tanda Tangan

- `get(name: string, ctx: Context)`

#### Detail

| Properti | Tipe      | Deskripsi             |
| ------ | --------- | --------------------- |
| `name` | `string`  | Pengenal autentikator |
| `ctx`  | `Context` | Konteks permintaan    |

### `middleware()`

Middleware autentikasi. Mendapatkan autentikator saat ini dan melakukan autentikasi pengguna.