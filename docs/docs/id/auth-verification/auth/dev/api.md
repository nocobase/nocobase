:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Referensi API

## Sisi Server

### Auth

API inti, referensi: [Auth](/api/auth/auth)

### BaseAuth

API inti, referensi: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Gambaran Umum

`AuthModel` adalah model data autentikator (`Authenticator`, referensi: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) dan [Auth - constructor](/api/auth/auth#constructor)) yang digunakan dalam aplikasi NocoBase. Model ini menyediakan beberapa metode untuk berinteraksi dengan **koleksi** data pengguna. Selain itu, Anda juga dapat menggunakan metode yang disediakan oleh Sequelize Model.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### Metode Kelas

- `findUser(uuid: string): UserModel` - Mencari pengguna berdasarkan `uuid`.
  - `uuid` - Pengidentifikasi unik pengguna dari tipe autentikasi saat ini.

- `newUser(uuid: string, userValues?: any): UserModel` - Membuat pengguna baru, mengikat pengguna ke autentikator saat ini melalui `uuid`.
  - `uuid` - Pengidentifikasi unik pengguna dari tipe autentikasi saat ini.
  - `userValues` - Opsional. Informasi pengguna lainnya. Jika tidak diberikan, `uuid` akan digunakan sebagai nama panggilan pengguna.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Mencari atau membuat pengguna baru, dengan aturan pembuatan yang sama seperti di atas.
  - `uuid` - Pengidentifikasi unik pengguna dari tipe autentikasi saat ini.
  - `userValues` - Opsional. Informasi pengguna lainnya.

## Sisi Klien

### `plugin.registerType()`

Mendaftarkan klien untuk tipe autentikasi.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### Sintaks

- `registerType(authType: string, options: AuthOptions)`

#### Tipe

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### Detail

- `SignInForm` - Formulir Masuk (Sign In)
- `SignInButton` - Tombol Masuk (pihak ketiga), dapat digunakan sebagai alternatif dari formulir masuk.
- `SignUpForm` - Formulir Daftar (Sign Up)
- `AdminSettingsForm` - Formulir Pengaturan Admin

### Rute

Rute *frontend* untuk mendaftarkan **plugin** autentikasi adalah sebagai berikut:

- Tata Letak Autentikasi (Auth Layout)
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Halaman Masuk (Sign In)
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Halaman Daftar (Sign Up)
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`