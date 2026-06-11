---
title: "Ikhtisar penerapan lingkungan produksi"
description: "Petunjuk keseluruhan untuk penerapan lingkungan produksi: Setelah mengonfirmasi bahwa aplikasi berjalan normal, tambahkan entri mulai otomatis dan balikkan proxy aplikasi."
keywords: "NocoBase, penerapan lingkungan produksi, ikhtisar, aplikasi yang dimulai sendiri, proksi terbalik, Nginx, Caddy"
---


# Ikhtisar penerapan lingkungan produksi

Jika NocoBase Anda sudah dapat berjalan normal di server, biasanya Anda perlu menambahkan dua kemampuan lagi sebelum diluncurkan secara resmi:

1. Izinkan aplikasi untuk kembali berjalan secara otomatis setelah mesin dihidupkan ulang.
2. Hubungkan pintu masuk proxy terbalik ke aplikasi untuk menyediakan akses stabil ke dunia luar.

Sesuai dengan NocoBase CLI, ini terutama terdiri dari dua set perintah berikut:

- `nb app autostart`
- `nb proxy`

Kumpulan dokumen ini pada dasarnya dibagi menjadi dua bagian:

1. Aplikasi memulai sendiri: Memungkinkan aplikasi untuk kembali berjalan setelah mesin dihidupkan ulang
2. Proksi terbalik: Menyediakan pintu masuk akses eksternal yang stabil untuk aplikasi

Pertama-tama Anda dapat melihat bagian mana yang lebih Anda butuhkan saat ini, lalu masuk ke halaman terkait.

## Masalah apa yang dipecahkan oleh kedua bagian ini di lingkungan produksi?

Artinya:

- `nb app autostart` memecahkan masalah "cara melanjutkan pengoperasian aplikasi setelah startup sistem"
- `nb proxy` memecahkan masalah "bagaimana menyediakan akses yang stabil ke dunia luar"

:::tip Mengapa Anda tidak langsung menggunakan konfigurasi self-starting Docker, PM2, atau Supervisor di sini?

`nb app autostart` tidak mengabaikan metode manajemen proses ini, tetapi secara seragam mengadaptasi metode manajemen proses yang berbeda, dan kemudian menyatukannya menjadi serangkaian pintu masuk manajemen yang dimulai sendiri secara stabil. Dengan cara ini, Anda tidak perlu mengingat kumpulan konfigurasi self-starting yang berbeda karena lapisan dasarnya adalah Docker, PM2, atau Supervisor yang mungkin didukung di masa mendatang.

Ketika sistem memulai lapisan ini, maka akan terus diproses oleh `systemd`, `launchd` atau skrip startup host. Mereka bertanggung jawab untuk mengeksekusi satu kali saat mesin dinyalakan:

```bash
nb app autostart run
```

Perintah ini kemudian akan menarik semua aplikasi yang mengaktifkan auto-start.

Berikut adalah dua lapisan hal yang tidak boleh dicampur menjadi satu:

- Kemampuan seperti Docker, PM2, dan Supervisor lebih dekat dengan "cara aplikasi biasanya dijalankan dan cara mengelola proses aplikasi".
- Kemampuan seperti `systemd`, `launchd`, dan skrip startup host lebih dekat dengan "perintah apa yang harus dijalankan ketika sistem dimulai"

Jika Anda terjebak di sini "Mengapa Anda memerlukan `nb app autostart`", lanjutkan saja membaca [Mulai otomatis aplikasi](./autostart.md) dan [nb maksud desain aplikasi](../cli-design/nb-app-design-intent.md).

:::

## Halaman manakah yang harus saya lihat sekarang?

| saya ingin... | Di mana mencarinya |
| --- | --- |
| Biarkan server restart terlebih dahulu barulah aplikasi dapat otomatis kembali berjalan | [Aplikasi mulai otomatis](./autostart.md) |
| Pahami dulu relasi masuknya Nginx/Caddy di CLI | [Proksi terbalik](./reverse-proxy/index.md) |
| Terus gunakan Nginx untuk mengelola pintu masuk situs | [Nginx](./reverse-proxy/nginx.md) |
| Hubungkan HTTPS sesegera mungkin dan pertahankan lebih sedikit detail TLS | [Caddy](./reverse-proxy/caddy.md) |
| Lihat startup, stop, log dan upgrade aplikasi itu sendiri | [Kelola Aplikasi](../operations/manage-app.md) |

## Sebelum memasuki lingkungan produksi, konfirmasikan prasyarat ini

- Aplikasi telah disimpan sebagai CLI env
- Aplikasi dapat dijalankan secara normal di server itu sendiri
- Jika Anda akan terhubung ke proxy terbalik, `appPort` telah disimpan di env
- Jika Anda siap membukanya secara resmi ke dunia luar, Anda sudah merencanakan nama domain, port masuk, dan solusi HTTPS.

Jika Anda belum menyelesaikan instalasi CLI atau inisialisasi env, kembali ke [Instalasi menggunakan CLI (disarankan)](../installation/cli.md).

Jika perintah meminta env hilang `appPort`, jalankan dulu [`nb env update`](../../api/cli/env/update.md) untuk mengisinya.

## Tautan terkait

- [Mulai otomatis aplikasi](./autostart.md)
- [Proksi terbalik](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [Kelola Aplikasi](../operations/manage-app.md)
