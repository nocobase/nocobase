---
title: "Referensi API Ekstensi Autentikasi"
description: "API ekstensi autentikasi NocoBase: Auth, BaseAuth, AuthModel (findUser, newUser, findOrCreateUser), antarmuka klien registerType, konfigurasi route."
keywords: "API ekstensi autentikasi,Auth,BaseAuth,AuthModel,registerType,findUser,NocoBase"
---

# Referensi API

## Server

### Auth

API kernel, lihat: [Auth](/api/auth/auth)

### BaseAuth

API kernel, lihat: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Ikhtisar

`AuthModel` adalah model data authenticator (`Authenticator`, lihat: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) dan [Auth - constructor](/api/auth/auth#constructor)) yang digunakan dalam aplikasi NocoBase, menyediakan beberapa metode untuk berinteraksi dengan tabel data pengguna. Selain itu, Anda juga dapat menggunakan metode yang disediakan oleh Sequelize Model.

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

#### Metode Class

- `findUser(uuid: string): UserModel` - Mencari pengguna berdasarkan `uuid`.
  - `uuid` - Identifier unik pengguna dari tipe autentikasi saat ini

- `newUser(uuid: string, userValues?: any): UserModel` - Membuat pengguna baru, mengikat pengguna dengan authenticator saat ini melalui `uuid`.
  - `uuid` - Identifier unik pengguna dari tipe autentikasi saat ini
  - `userValues` - Opsional. Informasi pengguna lainnya. Jika tidak diberikan, `uuid` akan digunakan sebagai nickname pengguna.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Mencari atau membuat pengguna baru, aturan pembuatan sama seperti di atas.
  - `uuid` - Identifier unik pengguna dari tipe autentikasi saat ini
  - `userValues` - Opsional. Informasi pengguna lainnya.

## Klien

### `plugin.registerType()`

Mendaftarkan klien dari tipe autentikasi.

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

#### Signature

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

- `SignInForm` - Formulir login
- `SignInButton` - Tombol login (pihak ketiga), dapat dipilih salah satu dengan formulir login
- `SignUpForm` - Formulir pendaftaran
- `AdminSettingsForm` - Formulir konfigurasi backend

### Route

Plugin auth mendaftarkan route frontend sebagai berikut:

- Auth Layout
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Halaman Login
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Halaman Pendaftaran
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`
