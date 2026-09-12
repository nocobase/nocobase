---
pkg: '@nocobase/plugin-auth'
title: "Token Security Policy"
description: "Token security policy: mengkonfigurasi session validity period, Token validity period, expired token refresh limit, autentikasi JWT, mekanisme auto-refresh, entry point plugin settings - security."
keywords: "Token security policy,session validity period,Token validity period,JWT,auto-refresh,konfigurasi keamanan,NocoBase"
---

# Token Security Policy

## Pengantar

Token security policy adalah konfigurasi fitur untuk melindungi keamanan dan pengalaman sistem. Termasuk tiga item konfigurasi utama: "Session validity period", "Token validity period", dan "Expired token refresh limit".

## Entry Point Konfigurasi

Entry point konfigurasi ada di Plugin Settings - Security - Token Policy:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Session Validity Period

**Definisi:**

Session validity period adalah waktu maksimum yang diizinkan sistem untuk user mempertahankan aktivitas session setelah login.

**Fungsi:**

Setelah melebihi session validity period, saat user mengakses sistem lagi akan menerima 401 error response, kemudian sistem akan me-redirect user ke halaman login untuk verifikasi identitas ulang.
Contoh:
Jika session validity period diatur 8 jam, user dimulai dihitung dari login. Tanpa interaksi tambahan, session akan expired setelah 8 jam.

**Saran Pengaturan:**

- Skenario operasi short-term: Disarankan 1-2 jam untuk meningkatkan keamanan.
- Skenario kerja long-term: Dapat diatur 8 jam untuk memenuhi kebutuhan bisnis.

## Token Validity Period

**Definisi:**

Token validity period adalah lifecycle setiap Token yang diterbitkan sistem dalam session aktif user.

**Fungsi:**

Saat Token kadaluarsa, sistem akan otomatis menerbitkan Token baru untuk mempertahankan aktivitas session.
Setiap Token yang sudah kadaluarsa hanya diizinkan refresh satu kali.

**Saran Pengaturan:**

Untuk pertimbangan keamanan, disarankan diatur antara 15 hingga 30 menit.
Dapat disesuaikan berdasarkan kebutuhan skenario. Contohnya:
Skenario keamanan tinggi: Token validity period dapat dipersingkat ke 10 menit atau lebih rendah.
Skenario risiko rendah: Token validity period dapat diperpanjang ke 1 jam.

## Expired Token Refresh Limit

**Definisi:**

Expired token refresh limit adalah window waktu maksimum yang diizinkan user untuk mendapatkan Token baru melalui operasi refresh setelah Token kadaluarsa.

**Karakteristik:**

Jika melebihi refresh limit, user harus login ulang untuk mendapatkan Token baru.
Operasi refresh tidak akan memperpanjang session validity period, hanya akan menghasilkan Token baru.

**Saran Pengaturan:**

Untuk pertimbangan keamanan, disarankan diatur antara 5 hingga 10 menit.
