:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# BaseAuth

## Gambaran Umum

`BaseAuth` mewarisi dari [Auth](./auth) kelas abstrak dan merupakan implementasi dasar untuk tipe autentikasi pengguna, menggunakan JWT sebagai metode autentikasi. Dalam kebanyakan kasus, Anda dapat memperluas tipe autentikasi pengguna dengan mewarisi dari `BaseAuth`, dan tidak perlu mewarisi secara langsung dari `Auth` kelas abstrak.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Atur koleksi pengguna
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logika autentikasi pengguna, dipanggil oleh `auth.signIn`
  // Mengembalikan data pengguna
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Metode Kelas

### `constructor()`

Konstruktor, membuat sebuah instans `BaseAuth`.

#### Tanda Tangan

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Detail

| Parameter        | Tipe         | Deskripsi                                                                                                 |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Lihat [Auth - AuthConfig](./auth#authconfig)                                                              |
| `userCollection` | `Collection` | Koleksi pengguna, contohnya: `db.getCollection('users')`. Lihat [DataBase - Collection](../database/collection) |

### `user()`

Pengakses, mengatur dan mendapatkan informasi pengguna. Secara default, ia menggunakan objek `ctx.state.currentUser` untuk akses.

#### Tanda Tangan

- `set user()`
- `get user()`

### `check()`

Melakukan autentikasi melalui token permintaan dan mengembalikan informasi pengguna.

### `signIn()`

Masuk pengguna, menghasilkan token.

### `signUp()`

Daftar pengguna.

### `signOut()`

Keluar pengguna, mengakhiri masa berlaku token.

### `validate()` *

Logika inti autentikasi, dipanggil oleh antarmuka `signIn`, untuk menentukan apakah pengguna dapat berhasil masuk.