---
title: "nb env auth"
description: "Referensi perintah nb env auth: mengautentikasi env NocoBase yang tersimpan dengan basic, token, atau OAuth."
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,login,autentikasi"
---

# nb env auth

Mengautentikasi ulang env NocoBase yang tersimpan, atau memperbarui informasi autentikasi yang disimpan untuk env tersebut. Saat nama lingkungan dilewati, menggunakan env saat ini.

`nb env auth` mendukung tiga metode autentikasi: `basic`, `token`, dan `oauth`. Jika `--auth-type` dilewati, CLI terlebih dahulu menebak metode dari opsi autentikasi yang kamu berikan. Jika masih tidak bisa ditebak, CLI menggunakan metode autentikasi yang sudah tersimpan di env.

## Penggunaan

```bash
nb env auth [name] [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[name]` | string | Nama env yang sudah dikonfigurasi untuk login; jika dihilangkan, menggunakan env saat ini |
| `--auth-type`, `-a` | string | Metode autentikasi: `basic`, `token`, atau `oauth` |
| `--access-token`, `-t` | string | API key atau access token yang digunakan untuk autentikasi `token` |
| `--username` | string | Username yang digunakan untuk autentikasi `basic`; akan diminta di TTY jika dilewati |
| `--password` | string | Password yang digunakan untuk autentikasi `basic`; akan diminta di TTY jika dilewati |

## Opsi Kompatibilitas

| Opsi | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama lingkungan, setara dengan `[name]`. Opsi tersembunyi ini dipertahankan untuk kompatibilitas dengan perintah lain; biasanya argumen posisi sudah cukup |

## Penjelasan

Metode autentikasi bekerja seperti ini:

- `basic`: login ke NocoBase dengan username dan password, lalu menyimpan access token yang dikembalikan serta username
- `token`: menyimpan API key atau access token yang diberikan melalui `--access-token`
- `oauth`: memulai alur autentikasi browser, lalu menyimpan access token setelah autentikasi selesai

Di terminal interaktif, CLI akan meminta `--auth-type`, `--username`, `--password`, atau `--access-token` saat dibutuhkan. Di mode non-interaktif, autentikasi `basic` membutuhkan `--username` dan `--password`.

Autentikasi `oauth` terlebih dahulu mencoba Device Authorization Grant. Saat server OAuth mendukung alur ini, perintah akan mencetak URL verifikasi dan kode pengguna, lalu melakukan polling sampai persetujuan di browser selesai. Ini cocok untuk server remote atau headless karena tidak membutuhkan listener callback lokal.

Jika server OAuth tidak mengekspos device authorization endpoint, perintah akan kembali ke alur PKCE loopback: memulai layanan callback lokal, membuka browser untuk otorisasi, menukar token, dan menyimpannya ke file konfigurasi.

Setelah autentikasi berhasil, CLI otomatis menjalankan `nb env update <name>` untuk menyinkronkan ulang status env.

## Batasan

- `[name]` dan `--env` tidak boleh memberikan nama lingkungan yang berbeda secara bersamaan
- `--access-token` tidak boleh digunakan bersama `--username` atau `--password`
- `--auth-type oauth` tidak boleh digunakan bersama `--access-token`, `--username`, atau `--password`
- `--auth-type token` tidak boleh digunakan bersama `--username` atau `--password`
- `--auth-type basic` tidak boleh digunakan bersama `--access-token`
- `--access-token`, `--username`, dan `--password` tidak boleh kosong setelah diberikan

## Contoh

```bash
# Autentikasi env saat ini dengan metode autentikasi yang tersimpan
nb env auth

# Autentikasi env tertentu
nb env auth prod

# Menggunakan login OAuth melalui browser
nb env auth prod --auth-type oauth

# Login dengan username dan password
nb env auth prod --auth-type basic --username admin --password secret

# Menyimpan API key atau access token
nb env auth prod --auth-type token --access-token <api-key>
```

Untuk device authorization, buka URL yang dicetak oleh perintah dan masukkan kode yang ditampilkan di browser.

## Perintah Terkait

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
