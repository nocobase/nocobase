---
title: "Auth (SDK)"
description: "Auth SDK frontend NocoBase: login, logout, manajemen token."
keywords: "Auth SDK,login,logout,manajemen token,autentikasi frontend,NocoBase"
---

# Auth

## Ikhtisar

Class `Auth` terutama digunakan untuk akses informasi user di sisi client, melakukan request ke interface yang terkait autentikasi user.

## Properti Instance

### `locale`

Bahasa yang digunakan oleh user saat ini.

### `role`

Role yang digunakan oleh user saat ini.

### `token`

`token` interface API.

### `authenticator`

Authenticator yang digunakan saat autentikasi user saat ini. Lihat [Autentikasi User](/auth-verification/auth/index.md).

## Method Class

### `signIn()`

User login.

#### Signature

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detail

| Nama Parameter | Tipe | Deskripsi |
| --------------- | -------- | -------------------- |
| `values` | `any` | Parameter request interface login |
| `authenticator` | `string` | Identifier authenticator yang digunakan untuk login |

### `signUp()`

User registrasi.

#### Signature

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detail

| Nama Parameter | Tipe | Deskripsi |
| --------------- | -------- | -------------------- |
| `values` | `any` | Parameter request interface registrasi |
| `authenticator` | `string` | Identifier authenticator yang digunakan untuk registrasi |

### `signOut()`

Logout.

#### Signature

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detail

| Nama Parameter | Tipe | Deskripsi |
| --------------- | -------- | -------------------- |
| `values` | `any` | Parameter request interface logout |
| `authenticator` | `string` | Identifier authenticator yang digunakan untuk logout |
