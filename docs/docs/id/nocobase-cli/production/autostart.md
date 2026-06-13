---
title: "Aplikasi dimulai secara otomatis"
description: "Gunakan mulai otomatis aplikasi nb untuk mengonfigurasi entri mulai otomatis aplikasi terpadu untuk env NocoBase yang dihosting CLI."
keywords: "NocoBase, mulai otomatis aplikasi, mulai otomatis aplikasi nb, systemd, Docker, PM2"
---


# Aplikasi dimulai secara otomatis

Di NocoBase CLI, `nb app autostart` digunakan untuk mengelola "env mana yang diizinkan untuk memulai secara otomatis" dan "cara menarik env ini secara seragam setelah sistem dimulai."

Jika Anda akan menjalankan aplikasi yang dihosting CLI secara resmi di server, ini biasanya merupakan langkah default di lingkungan produksi.

## Mengapa `nb app autostart` masih dibutuhkan?

Masalah ini sangat umum terjadi.

Ketika banyak orang melihat ini untuk pertama kali, mereka akan berpikir karena lapisan bawah sudah memiliki Docker, PM2, atau sistem itu sendiri sudah memiliki `systemd`, mengapa kita memerlukan lapisan `nb app autostart` lainnya.

Alasannya adalah lapisan-lapisan ini sebenarnya tidak memecahkan masalah yang sama:

- Kemampuan seperti Docker, PM2, dan Supervisor memecahkan masalah "bagaimana aplikasi biasanya berjalan dan bagaimana mengelola proses aplikasi."
- Kemampuan seperti `systemd`, `launchd`, dan skrip startup host memecahkan masalah "perintah apa yang harus dijalankan ketika sistem dimulai?"
- `nb app autostart` memecahkan masalah "di tingkat NocoBase CLI, cara mengelola secara seragam env mana yang diizinkan untuk memulai secara otomatis, dan cara menariknya setelah sistem dimulai"

Dengan kata lain, CLI tidak menghilangkan kebutuhan akan Docker, PM2 atau Supervisor. Sebaliknya, ia mengadaptasi metode manajemen proses yang berbeda secara terpadu, dan kemudian menggabungkannya ke dalam serangkaian portal manajemen mandiri yang stabil untuk mengurangi penyakit mental pengguna.

Saat sistem memulai lapisan ini, lapisan ini terus diserahkan ke `systemd`, `launchd` atau skrip startup host. Mereka bertanggung jawab untuk mengeksekusi ketika mesin dinyalakan:

```bash
nb app autostart run
```

Perintah ini kemudian akan menarik semua aplikasi yang mengaktifkan auto-start.

Tanpa lapisan ini, setelah metode operasi yang mendasarinya berbeda, Anda perlu mengingat konfigurasi yang dimulai sendiri dan proses pemulihan Docker, PM2, atau metode lainnya. Setelah menambahkan `nb app autostart`, Anda hanya perlu terus mengingat rangkaian kebiasaan penggunaan NocoBase CLI yang sama.

Jika Anda ingin mengetahui mengapa desain ini dipecah dengan cara ini terlebih dahulu, lanjutkan membaca [nb maksud desain aplikasi](../cli-design/nb-app-design-intent.md#Mengapa-nb-app-autostart masih diperlukan).

## Apa tanggung jawab kelompok komando ini?

Yang paling umum digunakan adalah ini:

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

Jika Anda hanya melihat dua tingkat tanggung jawab yang paling umum, Anda dapat memahaminya seperti ini:

- `enable` / `disable` bertanggung jawab untuk mengatur apakah env tertentu mengizinkan startup otomatis
- `run` bertanggung jawab untuk menarik semua env yang mengaktifkan self-starting selama fase startup sistem.

Pertama-tama aktifkan tanda mulai otomatis untuk env saat ini:

```bash
nb app autostart enable
```

Jika Anda ingin mengoperasikan sesuatu selain env saat ini, Anda dapat menentukannya secara eksplisit:

```bash
nb app autostart enable --env app1 --yes
```

Setelah mengaktifkannya, Anda dapat memeriksa envs mana yang telah ditandai sebagai self-starting:

```bash
nb app autostart list
```

Setelah sistem dimulai, Anda perlu menjalankan perintah berikut untuk menarik semua envs yang mengaktifkan auto-start:

```bash
nb app autostart run
```

Jika Anda ingin melihat keluaran startup yang mendasarinya saat pemecahan masalah, Anda dapat menambahkan:

```bash
nb app autostart run --verbose
```

Jika Anda tidak ingin lagi env dimulai dengan sistem, Anda juga dapat membatalkan tanda ini:

```bash
nb app autostart disable --env app1 --yes
```

## Apa hubungannya dengan Docker, PM2, dan systemd?

Ada batasan di sini yang mudah dibingungkan.

`nb app` Lapisan ini memecahkan masalah "bagaimana aplikasi berjalan". Lapisan bawah dapat beradaptasi dengan metode berjalan yang berbeda, seperti Docker dan PM2, dan dapat terus diperluas di masa mendatang.

`nb app autostart` Lapisan ini memecahkan masalah "cara menarik env yang memungkinkan startup otomatis setelah mesin dihidupkan." Ini lebih seperti menyediakan titik masuk yang stabil untuk mekanisme startup host, daripada mengganti alat manajemen proses tertentu.

dengan kata lain:

- Kemampuan seperti Docker, PM2, dan Supervisor lebih dekat dengan cara aplikasi dijalankan
- `systemd`, `launchd`, skrip startup host, lebih dekat ke lapisan startup sistem

Inilah sebabnya mengapa dalam lingkungan formal, Anda biasanya perlu menghubungkan `nb app autostart run` ke dalam proses startup sistem Anda sendiri, seperti `systemd`, `launchd`, skrip startup platform kontainer, atau mekanisme mulai otomatis host lain yang sudah Anda gunakan.

## Lingkup aplikasi

`nb app autostart` hanya berlaku untuk envs dengan runtime terkelola CLI, yaitu:

- `local`
- `docker`

Jika env ini hanya koneksi API jarak jauh, atau bukan aplikasi yang berjalan di bawah manajemen CLI pada mesin saat ini, maka rangkaian perintah ini tidak cocok untuk memulai sendiri.

##Latihan bawaan

Dalam sebagian besar skenario, urutan berikut sudah cukup:

1. Pertama-tama konfirmasikan bahwa aplikasi dapat dimulai secara normal pada mesin saat ini
2. Jalankan `nb app autostart enable --env <name> --yes`
3. Hubungkan `nb app autostart run` ke sistem untuk memulai proses
4. Nyalakan ulang mesin atau jalankan `run` secara manual untuk memverifikasi apakah mesin pulih secara normal.

Jika Anda masih perlu mengonfigurasi lapisan entri produksi selanjutnya, lanjutkan melihat [reverse proxy](./reverse-proxy/index.md).

## Perintah terkait

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Tautan terkait

- [Ikhtisar penerapan lingkungan produksi](./index.md)
- [Proksi terbalik](./reverse-proxy/index.md)
- [nb maksud desain aplikasi](../cli-design/nb-app-design-intent.md)
- [Kelola Aplikasi](../operations/manage-app.md)
