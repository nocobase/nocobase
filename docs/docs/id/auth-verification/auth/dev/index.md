:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Tipe Autentikasi

## Gambaran Umum

NocoBase mendukung perluasan tipe autentikasi pengguna sesuai kebutuhan. Autentikasi pengguna umumnya terbagi menjadi dua tipe: pertama, penentuan identitas pengguna dilakukan di dalam aplikasi NocoBase itu sendiri, seperti login dengan kata sandi, login SMS, dan lain-lain; kedua, layanan pihak ketiga yang menentukan identitas pengguna dan memberitahukan hasilnya kepada aplikasi NocoBase melalui *callback*, seperti metode autentikasi OIDC, SAML, dan sejenisnya. Proses autentikasi untuk kedua tipe metode autentikasi yang berbeda ini di NocoBase pada dasarnya adalah sebagai berikut:

### Tanpa Ketergantungan pada *Callback* Pihak Ketiga

1. Klien menggunakan NocoBase SDK untuk memanggil antarmuka login `api.auth.signIn()`, meminta antarmuka login `auth:signIn`, sekaligus membawa pengenal autentikator yang sedang digunakan melalui *header* permintaan `X-Authenticator` ke *backend*.
2. Antarmuka `auth:signIn` meneruskan ke tipe autentikasi yang sesuai berdasarkan pengenal autentikator di *header* permintaan, dan metode `validate` dalam kelas autentikasi yang terdaftar untuk tipe autentikasi tersebut akan melakukan pemrosesan logika yang relevan.
3. Klien mendapatkan informasi pengguna dan `token` autentikasi dari respons antarmuka `auth:signIn`, menyimpan `token` tersebut ke *Local Storage*, dan menyelesaikan proses login. Langkah ini secara otomatis ditangani oleh SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Bergantung pada *Callback* Pihak Ketiga

1. Klien mendapatkan URL login pihak ketiga melalui antarmuka yang didaftarkan sendiri (misalnya `auth:getAuthUrl`), dan membawa informasi seperti nama aplikasi, pengenal autentikator, dan lain-lain sesuai protokol.
2. Klien diarahkan ke URL pihak ketiga untuk menyelesaikan login. Layanan pihak ketiga memanggil antarmuka *callback* aplikasi NocoBase (yang perlu didaftarkan sendiri, misalnya `auth:redirect`), mengembalikan hasil autentikasi, sekaligus mengembalikan informasi seperti nama aplikasi dan pengenal autentikator.
3. Metode antarmuka *callback* akan mengurai parameter untuk mendapatkan pengenal autentikator, melalui `AuthManager` mendapatkan kelas autentikasi yang sesuai, dan secara aktif memanggil metode `auth.signIn()`. Metode `auth.signIn()` akan memanggil metode `validate()` untuk menangani logika otorisasi.
4. Setelah metode *callback* mendapatkan `token` autentikasi, ia akan melakukan pengalihan 302 kembali ke halaman *frontend*, dan membawa `token` serta pengenal autentikator dalam parameter URL, `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Selanjutnya, kita akan membahas cara mendaftarkan antarmuka sisi *server* dan antarmuka pengguna sisi *client*.

## Sisi *Server*

### Antarmuka Autentikasi

*Kernel* NocoBase menyediakan pendaftaran dan pengelolaan untuk memperluas tipe autentikasi. Pemrosesan logika inti untuk memperluas **plugin** login memerlukan pewarisan kelas abstrak `Auth` dari *kernel* dan implementasi antarmuka standar yang sesuai.  
Untuk referensi API lengkap, lihat [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

*Kernel* juga mendaftarkan operasi sumber daya dasar yang terkait dengan autentikasi pengguna.

| API            | Deskripsi                    |
| -------------- | ---------------------------- |
| `auth:check`   | Memeriksa apakah pengguna sudah login |
| `auth:signIn`  | Login                        |
| `auth:signUp`  | Registrasi                   |
| `auth:signOut` | Logout                       |

Dalam kebanyakan kasus, tipe autentikasi pengguna yang diperluas juga dapat menggunakan logika otorisasi JWT yang sudah ada untuk menghasilkan kredensial akses API bagi pengguna. Kelas `BaseAuth` di *kernel* telah melakukan implementasi dasar dari kelas abstrak `Auth`, lihat [BaseAuth](../../../api/auth/base-auth.md). **Plugin** dapat langsung mewarisi kelas `BaseAuth` untuk menggunakan kembali sebagian kode logika dan mengurangi biaya pengembangan.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Menetapkan koleksi pengguna
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Mengimplementasikan logika autentikasi pengguna
  async validate() {}
}
```

### Data Pengguna

Saat mengimplementasikan logika autentikasi pengguna, biasanya melibatkan pemrosesan data pengguna. Dalam aplikasi NocoBase, secara *default* **koleksi** terkait didefinisikan sebagai:

| **Koleksi**           | Deskripsi                                                                                                          | **Plugin**                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | [**Plugin** Pengguna (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Menyimpan informasi autentikator (entitas tipe autentikasi), sesuai dengan tipe autentikasi dan konfigurasi | **Plugin** Autentikasi Pengguna (`@nocobase/plugin-auth`)              |
| `usersAuthenticators` | Menghubungkan pengguna dan autentikator, menyimpan informasi pengguna di bawah autentikator yang sesuai | **Plugin** Autentikasi Pengguna (`@nocobase/plugin-auth`)              |

Umumnya, metode login yang diperluas dapat menggunakan `users` dan `usersAuthenticators` untuk menyimpan data pengguna yang relevan. Hanya dalam kasus khusus Anda perlu menambahkan **koleksi** baru sendiri.

Bidang utama dari `usersAuthenticators` adalah:

| Bidang            | Deskripsi                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `uuid`          | Pengenal unik pengguna untuk tipe autentikasi ini, seperti nomor telepon, *open ID* WeChat, dll. |
| `meta`          | Bidang JSON, informasi lain yang perlu disimpan                        |
| `userId`        | ID Pengguna                                                                                     |
| `authenticator` | Nama autentikator (pengenal unik)                                                      |

Untuk operasi kueri dan pembuatan pengguna, model data `AuthModel` dari `authenticators` juga mengemas beberapa metode yang dapat digunakan dalam kelas `CustomAuth` melalui `this.authenticator[namaMetode]`. Untuk referensi API lengkap, lihat [AuthModel](./api#authmodel).

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

### Pendaftaran Tipe Autentikasi

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

## Sisi *Client*

Antarmuka pengguna sisi *client* didaftarkan melalui antarmuka `registerType` yang disediakan oleh *client* **plugin** autentikasi pengguna:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Formulir Login
        SignInButton, // Tombol Login (pihak ketiga), bisa dipilih salah satu dengan formulir login
        SignUpForm, // Formulir Registrasi
        AdminSettingsForm, // Formulir Pengaturan Admin
      },
    });
  }
}
```

### Formulir Login

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Jika ada beberapa autentikator yang tipe autentikasinya mendaftarkan formulir login, maka akan ditampilkan dalam bentuk *Tab*. Judul *Tab* adalah judul autentikator yang dikonfigurasi di *backend*.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Tombol Login

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Biasanya untuk tombol login pihak ketiga, namun sebenarnya bisa berupa komponen apa pun.

### Formulir Registrasi

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Jika Anda perlu berpindah dari halaman login ke halaman registrasi, Anda harus menanganinya sendiri di komponen login.

### Formulir Pengaturan Admin

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

Bagian atas adalah konfigurasi autentikator umum, dan bagian bawah adalah bagian formulir konfigurasi kustom yang dapat didaftarkan.

### Meminta Antarmuka API

Untuk memulai permintaan antarmuka terkait autentikasi pengguna di sisi *client*, Anda dapat menggunakan SDK yang disediakan oleh NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// gunakan dalam komponen
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Untuk referensi API yang lebih rinci, lihat [@nocobase/sdk - Auth](/api/sdk/auth).