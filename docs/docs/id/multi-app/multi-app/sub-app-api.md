---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Memanggil API sub-aplikasi'
description: 'Cara memanggil API sub-aplikasi dalam multi-app: akses melalui entry app dan tentukan sub-aplikasi tujuan dengan prefix path, header request, atau query parameter.'
keywords: 'multi-app,API sub-aplikasi,AppSupervisor,entry app,panggilan API,NocoBase'
---

# Memanggil API sub-aplikasi

Dalam skenario multi-app, setiap sub-aplikasi memiliki API independen. Saat memanggil API sub-aplikasi, entry app perlu mengetahui request harus diarahkan ke sub-aplikasi mana.

Contoh API aplikasi utama:

```bash
GET /api/users:list
```

`/api` adalah prefix API default dan dapat disesuaikan melalui environment variable `API_BASE_PATH`.

Untuk memanggil API yang sama di sub-aplikasi, tentukan nama sub-aplikasi dalam request.

## Menggunakan prefix path

Gunakan prefix `/api/__app/<appName>/`:

```bash
GET /api/__app/a_xxx/users:list
```

Keterangan:

- `a_xxx` adalah nama sub-aplikasi
- `users:list` adalah resource dan action yang dipanggil
- `/api` adalah base path API sistem saat ini

Query parameter dapat ditambahkan seperti biasa:

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

Cara ini jelas dan cocok untuk akses terpadu melalui entry app dalam deployment multi-environment.

## Menggunakan request header

Jika pemanggil sudah menggunakan alamat tetap `/api/...`, tentukan sub-aplikasi dengan header `X-App`:

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

Ini cocok untuk panggilan backend atau utilitas request frontend yang sudah memusatkan URL API.

## Menggunakan query parameter

Sub-aplikasi juga dapat ditentukan dengan parameter `__appName`:

```bash
GET /api/users:list?__appName=a_xxx
```

Dengan parameter lain:

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

Umumnya prefix path atau header lebih jelas karena sub-aplikasi tujuan lebih eksplisit.

## Alamat API dalam deployment multi-environment

Dalam deployment multi-environment biasanya ada entry app dan beberapa runtime environment.

Contoh:

- Alamat entry app: `http://localhost:13003`
- Alamat runtime environment: `http://localhost:14000`

Disarankan memanggil API sub-aplikasi melalui entry app:

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

Entry app akan merutekan request sesuai konfigurasi aplikasi. Jika Anda tahu runtime environment yang ingin diakses, alamat environment tersebut juga dapat digunakan.

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## Domain khusus sub-aplikasi

Jika sub-aplikasi memiliki domain sendiri, API-nya juga dapat dipanggil langsung melalui domain tersebut:

```bash
GET https://app-example.example.com/api/users:list
```

Jika ingin tetap melalui entry app, gunakan alamat `/api/__app/<appName>/...`.

## Autentikasi

Saat memanggil API sub-aplikasi, pengecekan permission tetap mengikuti sub-aplikasi tujuan.

Artinya:

- Diperlukan status login atau access token yang valid untuk sub-aplikasi
- Status login aplikasi utama tidak otomatis menjadi permission API di sub-aplikasi

Jika request tidak membawa informasi autentikasi valid, sub-aplikasi akan mengembalikan error belum login atau tidak memiliki izin sesuai konfigurasinya.
