---
pkg: '@nocobase/plugin-auth-oidc'
title: "Autentikasi: OIDC"
description: "Autentikasi SSO OIDC NocoBase: mengikuti protokol OpenID Connect, mode authorization code, mendukung IdP seperti Google dan Microsoft Entra ID, konfigurasi Issuer, Client ID, dan field mapping."
keywords: "OIDC,OpenID Connect,SSO,Single Sign-On,Google,Microsoft Entra,NocoBase"
---

# Autentikasi: OIDC

## Pengantar

Plugin Autentikasi: OIDC mengikuti standar protokol OIDC (Open ConnectID), menggunakan mode Authorization Code Flow, memungkinkan pengguna login ke NocoBase menggunakan akun yang disediakan oleh penyedia layanan autentikasi identitas pihak ketiga (IdP).

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Menambahkan Autentikasi OIDC

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202411130004459.png)

Tambahkan - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Konfigurasi

### Konfigurasi Dasar

![](https://static-docs.nocobase.com/202411130006341.png)

| Konfigurasi                                        | Keterangan                                                                                                                            | Versi          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Sign up automatically when the user does not exist | Apakah secara otomatis membuat pengguna baru ketika tidak ditemukan pengguna yang dapat dicocokkan dan diikat.                        | -              |
| Issuer                                             | Issuer disediakan oleh IdP, biasanya berakhir dengan `/.well-known/openid-configuration`.                                             | -              |
| Client ID                                          | Client ID                                                                                                                             | -              |
| Client Secret                                      | Client Secret                                                                                                                         | -              |
| scope                                              | Opsional, default `openid email profile`.                                                                                             | -              |
| id_token signed response algorithm                 | Algoritma signing untuk id_token, default `RS256`.                                                                                    | -              |
| Enable RP-initiated logout                         | Mengaktifkan RP-initiated logout. Saat pengguna logout, akan ikut logout di IdP. Callback logout IdP diisi dengan Post logout redirect URL yang disediakan di [Penggunaan](#penggunaan). | `v1.3.44-beta` |

### Field Mapping

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Konfigurasi                     | Keterangan                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Field mapping. Field di sisi NocoBase yang dapat dipetakan saat ini adalah nickname, email, dan nomor telepon. Default nickname menggunakan `openid`. |
| Use this field to bind the user | Field yang digunakan untuk mencocokkan dan mengikat pengguna yang ada, dapat dipilih email atau username, default email. Informasi pengguna yang dibawa IdP harus berisi field `email` atau `username`. |

### Konfigurasi Lanjutan

![](https://static-docs.nocobase.com/202411130013306.png)

| Konfigurasi                                                       | Keterangan                                                                                                                                                                                | Versi          |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| HTTP                                                              | Apakah callback NocoBase menggunakan protokol http, default `https`.                                                                                                                      | -              |
| Port                                                              | Port callback NocoBase, default `443/80`.                                                                                                                                                 | -              |
| State token                                                       | Digunakan untuk memvalidasi sumber permintaan dan mencegah serangan CSRF. Anda dapat mengisi nilai tetap. **Sangat disarankan dikosongkan agar nilai acak dihasilkan secara otomatis. Jika ingin menggunakan nilai tetap, harap evaluasi sendiri lingkungan dan risiko keamanan Anda.** | -              |
| Pass parameters in the authorization code grant exchange          | Saat menukar code dengan token, beberapa IdP mungkin meminta Client ID atau Client Secret dilewatkan sebagai parameter. Anda dapat mencentang dan mengisi nama parameter yang sesuai.       | -              |
| Method to call the user info endpoint                             | Metode HTTP saat memanggil API untuk mendapatkan informasi pengguna.                                                                                                                      | -              |
| Where to put the access token when calling the user info endpoint | Cara melewatkan access token saat memanggil API untuk mendapatkan informasi pengguna.<br/>- Header - Header request, default.<br />- Body - Body request, gunakan dengan metode `POST`.<br />- Query parameters - Parameter request, gunakan dengan metode `GET`. | -              |
| Skip SSL verification                                             | Melewati verifikasi SSL saat memanggil API IdP. **Opsi ini akan membuat sistem Anda terbuka terhadap risiko serangan man-in-the-middle. Centang hanya jika Anda benar-benar memahami kegunaannya. Sangat tidak disarankan menggunakan setting ini di lingkungan production.** | `v1.3.40-beta` |

### Penggunaan

![](https://static-docs.nocobase.com/202411130019570.png)

| Konfigurasi              | Keterangan                                                                       |
| ------------------------ | -------------------------------------------------------------------------------- |
| Redirect URL             | Digunakan untuk diisi pada konfigurasi callback URL IdP.                          |
| Post logout redirect URL | Saat RP-initiated logout diaktifkan, digunakan untuk mengisi konfigurasi Post logout redirect URL IdP. |

:::info
Saat pengujian lokal, harap gunakan `127.0.0.1` alih-alih `localhost`, karena metode login OIDC perlu menulis state ke cookie klien untuk validasi keamanan. Jika saat login muncul jendela yang berkedip dengan cepat tetapi login tidak berhasil, periksa apakah ada log state mismatch di sisi server, dan apakah cookie request berisi parameter state. Situasi ini biasanya terjadi karena state pada cookie klien tidak cocok dengan state pada request.
:::

## Login

Akses halaman login, klik tombol di bawah formulir login untuk memulai login pihak ketiga.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)
