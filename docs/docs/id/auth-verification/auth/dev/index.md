---
title: "Memperluas Tipe Autentikasi"
description: "Panduan pengembangan untuk memperluas tipe autentikasi pengguna NocoBase: alur autentikasi tanpa callback pihak ketiga dan dengan callback pihak ketiga, class Auth/BaseAuth, AuthModel, registrasi klien dengan registerType."
keywords: "memperluas tipe autentikasi,Auth,BaseAuth,AuthModel,autentikasi kustom,registerType,NocoBase"
---

# Memperluas Tipe Autentikasi

## Ikhtisar

NocoBase mendukung perluasan tipe autentikasi pengguna sesuai kebutuhan. Autentikasi pengguna umumnya memiliki dua tipe: pertama, identifikasi pengguna diselesaikan di dalam aplikasi NocoBase, seperti login dengan password dan login dengan SMS; kedua, identifikasi pengguna dilakukan oleh layanan pihak ketiga, dan hasilnya diberitahukan ke aplikasi NocoBase melalui callback, seperti metode autentikasi OIDC dan SAML. Alur autentikasi dari kedua tipe metode autentikasi ini di NocoBase pada dasarnya adalah sebagai berikut:

### Tanpa Bergantung pada Callback Pihak Ketiga

1. Klien menggunakan SDK NocoBase untuk memanggil antarmuka login `api.auth.signIn()`, melakukan request ke antarmuka login `auth:signIn`, dan secara bersamaan membawa identifier authenticator yang sedang digunakan ke backend melalui request header `X-Authenticator`.
2. Antarmuka `auth:signIn` meneruskan ke tipe autentikasi yang sesuai berdasarkan identifier authenticator pada request header, dan metode `validate` dalam class autentikasi yang didaftarkan oleh tipe autentikasi tersebut akan melakukan pemrosesan logika yang sesuai.
3. Klien mendapatkan informasi pengguna dan `token` autentikasi dari respons antarmuka `auth:signIn`, menyimpan `token` ke Local Storage, dan menyelesaikan login. Langkah ini diselesaikan secara otomatis oleh SDK secara internal.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Bergantung pada Callback Pihak Ketiga

1. Klien mendapatkan URL login pihak ketiga melalui antarmuka yang didaftarkan sendiri (misalnya `auth:getAuthUrl`), dan membawa informasi seperti nama aplikasi dan identifier authenticator sesuai protokol.
2. Pengalihan ke URL pihak ketiga untuk menyelesaikan login. Layanan pihak ketiga memanggil antarmuka callback aplikasi NocoBase (perlu didaftarkan sendiri, misalnya `auth:redirect`), mengembalikan hasil autentikasi, dan juga mengembalikan informasi seperti nama aplikasi dan identifier authenticator.
3. Metode antarmuka callback mem-parse parameter untuk mendapatkan identifier authenticator, mendapatkan class autentikasi yang sesuai melalui `AuthManager`, lalu memanggil metode `auth.signIn()` secara aktif. Metode `auth.signIn()` akan memanggil metode `validate()` untuk memproses logika otentikasi.
4. Metode callback mendapatkan `token` autentikasi, lalu mengarahkan kembali ke halaman frontend dengan 302, dengan membawa `token` dan identifier authenticator dalam parameter URL, `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Berikut adalah penjelasan tentang cara mendaftarkan antarmuka server dan antarmuka pengguna klien.

## Server

### Antarmuka Autentikasi

Kernel NocoBase menyediakan registrasi dan manajemen tipe autentikasi yang dapat diperluas. Pemrosesan logika inti dari plugin login yang diperluas memerlukan inheritance dari class abstrak `Auth` di kernel dan mengimplementasikan antarmuka standar yang sesuai.  
Referensi API lengkap [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Kernel juga mendaftarkan operasi resource dasar terkait autentikasi pengguna.

| API            | Keterangan                            |
| -------------- | ------------------------------------- |
| `auth:check`   | Memeriksa apakah pengguna telah login |
| `auth:signIn`  | Login                                 |
| `auth:signUp`  | Daftar                                |
| `auth:signOut` | Logout                                |

Dalam banyak kasus, tipe autentikasi pengguna yang diperluas juga dapat menggunakan logika autentikasi JWT yang sudah ada untuk menghasilkan kredensial akses API pengguna. Class `BaseAuth` di kernel telah mengimplementasikan dasar dari class abstrak `Auth`, lihat [BaseAuth](../../../api/auth/base-auth.md). Plugin dapat langsung melakukan inheritance dari class `BaseAuth` untuk menggunakan kembali sebagian kode logika dan mengurangi biaya pengembangan.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Mengatur tabel data pengguna
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Mengimplementasikan logika autentikasi pengguna
  async validate() {}
}
```

### Data Pengguna

Saat mengimplementasikan logika autentikasi pengguna, biasanya melibatkan pemrosesan data pengguna. Dalam aplikasi NocoBase, secara default tabel terkait didefinisikan sebagai:

| Tabel Data            | Fungsi                                                              | Plugin                                                          |
| --------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `users`               | Menyimpan informasi pengguna, email, nickname, dan password         | [Plugin Pengguna (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Menyimpan informasi authenticator (entitas tipe autentikasi), sesuai dengan tipe autentikasi dan konfigurasi | Plugin Autentikasi Pengguna (`@nocobase/plugin-auth`)         |
| `usersAuthenticators` | Menghubungkan pengguna dan authenticator, menyimpan informasi pengguna pada authenticator yang sesuai | Plugin Autentikasi Pengguna (`@nocobase/plugin-auth`)         |

Biasanya, untuk memperluas metode login, gunakan `users` dan `usersAuthenticators` untuk menyimpan data pengguna terkait. Hanya pada kasus khusus saja perlu menambahkan Collection sendiri.

Field utama dari `usersAuthenticators` adalah:

| Field           | Keterangan                                                                |
| --------------- | ------------------------------------------------------------------------- |
| `uuid`          | Identifier unik pengguna pada metode autentikasi tersebut, seperti nomor telepon, openid WeChat, dll. |
| `meta`          | Field JSON, informasi lain yang perlu disimpan                            |
| `userId`        | User ID                                                                   |
| `authenticator` | Nama authenticator (identifier unik)                                      |

Untuk operasi pencarian dan pembuatan pengguna, model data `AuthModel` dari `authenticators` juga membungkus beberapa metode yang dapat digunakan dalam class `CustomAuth` melalui `this.authenticator[nama metode]`. Referensi API lengkap [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Mencari pengguna
    this.authenticator.newUser(); // Membuat pengguna baru
    this.authenticator.findOrCreateUser(); // Mencari atau membuat pengguna baru
    // ...
  }
}
```

### Registrasi Tipe Autentikasi

Metode autentikasi yang diperluas perlu didaftarkan ke modul manajemen autentikasi.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Klien

Antarmuka pengguna klien didaftarkan melalui antarmuka `registerType` yang disediakan oleh klien plugin autentikasi pengguna:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Formulir login
        SignInButton, // Tombol login (pihak ketiga), dapat dipilih salah satu dengan formulir login
        SignUpForm, // Formulir pendaftaran
        AdminSettingsForm, // Formulir manajemen backend
      },
    });
  }
}
```

### Formulir Login

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Jika beberapa authenticator dengan tipe autentikasi yang berbeda telah mendaftarkan formulir login, mereka akan ditampilkan dalam bentuk Tab. Judul Tab adalah judul authenticator yang dikonfigurasi di backend.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Tombol Login

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Biasanya tombol login pihak ketiga, sebenarnya bisa berupa komponen apa pun.

### Formulir Pendaftaran

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Jika perlu beralih dari halaman login ke halaman pendaftaran, Anda harus menanganinya sendiri di komponen login.

### Formulir Manajemen Backend

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

Bagian atas adalah konfigurasi authenticator umum, dan bagian bawah adalah bagian formulir konfigurasi kustom yang dapat didaftarkan.

### Antarmuka Request

Untuk melakukan request antarmuka terkait autentikasi pengguna di sisi klien, Anda dapat menggunakan SDK yang disediakan oleh NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// digunakan dalam komponen
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Referensi API detail [@nocobase/sdk - Auth](/api/sdk/auth).
