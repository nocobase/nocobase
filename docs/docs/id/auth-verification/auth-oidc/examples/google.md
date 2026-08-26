---
title: "Contoh Konfigurasi OIDC: Sign in with Google"
description: "Konfigurasi login OIDC dengan Google OAuth 2.0: membuat OAuth Client ID, mengkonfigurasi authorized redirect URL, menambahkan authenticator OIDC di NocoBase."
keywords: "OIDC,Google,OAuth 2.0,Sign in with Google,authorized redirect,NocoBase"
---

# Sign in with Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Mendapatkan Kredensial Google OAuth 2.0

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Buat Kredensial - OAuth Client ID

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Masuk ke antarmuka konfigurasi, isi authorized redirect URL. Redirect URL dapat diperoleh dari NocoBase saat menambahkan authenticator baru, biasanya berupa `http(s)://host:port/api/oidc:redirect`. Lihat bagian [Petunjuk Penggunaan - Konfigurasi](../index.md#konfigurasi).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Menambahkan Authenticator Baru di NocoBase

Plugin Settings - Autentikasi Pengguna - Tambah - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Mengacu pada parameter yang dijelaskan di [Petunjuk Penggunaan - Konfigurasi](../index.md#konfigurasi), lengkapi konfigurasi authenticator.
