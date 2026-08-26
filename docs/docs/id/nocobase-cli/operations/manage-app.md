#Kelola aplikasi

Jika Anda telah menyimpan aplikasi NocoBase sebagai env CLI, manajemen harian pada dasarnya diselesaikan dalam grup perintah `nb app`: mulai, hentikan, mulai ulang, lihat log, dan tingkatkan.

Seringkali, Anda tidak perlu mengingat semua parameter. Pertama-tama perjelas apakah yang ingin Anda lakukan adalah "menjalankan aplikasi", "membaca log untuk memecahkan masalah", atau "meningkatkan ke versi baru", lalu pilih perintah yang sesuai.

Jika Anda ingin memahami terlebih dahulu mengapa `nb app` disatukan ke dalam kumpulan perintah ini dan hubungannya dengan `nb app autostart`, baca dulu [nb maksud desain aplikasi](../cli-design/nb-app-design-intent.md). Halaman ini hanya menyimpan operasi harian yang paling umum.

## Indeks cepat

| saya ingin... | Perintah mana yang harus digunakan |
| --- | --- |
| Memulai atau melanjutkan operasi aplikasi | [`nb app start`](../../api/cli/app/start.md) |
| Hentikan sementara aplikasi | [`nb app stop`](../../api/cli/app/stop.md) |
| Berhenti bersama dengan database bawaan yang dikelola CLI | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| Mulai ulang aplikasi setelah mengubah konfigurasi | [`nb app restart`](../../api/cli/app/restart.md) |
| Lihat log aplikasi secara real time | [`nb app logs`](../../api/cli/app/logs.md) |
| Tingkatkan ke versi sumber atau gambar baru | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

:::tip terlebih dahulu konfirmasikan env saat ini

Perintah `nb app` bertindak pada env saat ini secara default. Jika Anda memelihara beberapa lingkungan secara bersamaan, disarankan secara default untuk mengonfirmasi env target sebelum memulai, menghentikan, mencatat, atau meningkatkan operasi.

Jika Anda secara eksplisit memasukkan `--env` yang berbeda, CLI biasanya akan meminta konfirmasi. Dalam skrip atau skenario non-interaktif, Anda dapat menambahkan `--yes` untuk melewati langkah ini. Peralihan, tampilan, dan penghapusan multi-lingkungan diperkenalkan di [Manajemen Multi-Lingkungan](./multi-environment.md).

:::

## Mulai aplikasi

Tarik aplikasi dan gunakan `nb app start` secara default:

```bash
nb app start
```

Jika Anda ingin mengoperasikan sesuatu selain env saat ini, Anda dapat menentukannya secara eksplisit:

```bash
nb app start --env app1 --yes
```

Beberapa parameter startup lain yang umum digunakan:

- `nb app start` Secara default, persiapan instalasi atau peningkatan yang diperlukan akan diselesaikan secara otomatis terlebih dahulu, dan kemudian layanan akan dimulai.

Npm/Git env lokal akan memulai proses aplikasi lokal, dan Docker env akan membangun kembali wadah aplikasi sesuai dengan konfigurasi yang disimpan. Untuk parameter detailnya, lihat [`nb app start`](../../api/cli/app/start.md).

## Berhenti dan mulai ulang

Jika Anda hanya ingin menghentikan aplikasi sementara, gunakan `nb app stop`:

```bash
nb app stop
```

Jika Anda baru saja mengubah konfigurasi, dependensi, atau kode, biasanya lebih mudah menggunakan `nb app restart` secara langsung:

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` akan dihentikan terlebih dahulu lalu dimulai ulang dengan cara yang sama seperti `start`. Untuk penggunaan detailnya, lihat [`nb app stop`](../../api/cli/app/stop.md) dan [`nb app restart`](../../api/cli/app/restart.md).

## Lihat catatan

Saat memecahkan masalah, Anda biasanya melihat log terlebih dahulu:

```bash
nb app logs
```

Jika Anda hanya ingin melihat keluaran terbaru, atau tidak ingin terus mengikuti log, Anda dapat menggunakan ini:

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

Npm/Git env lokal membaca log pm2, dan Docker env membaca log container. Secara default, `nb app logs` akan terus mengikuti keluaran log baru. Untuk parameter detailnya, lihat [`nb app logs`](../../api/cli/app/logs.md).

## Tingkatkan aplikasi

Perintah peningkatan adalah `nb app upgrade`:

```bash
nb app upgrade
```

Perintah ini tidak hanya sekedar "mengunduh versi baru". Proses default biasanya mencakup:

1. Hentikan aplikasi saat ini
2. Unduh dan ganti kode sumber atau gambar yang disimpan
3. Sinkronisasi plug-in komersial
4. Tingkatkan dan mulai aplikasi
5. Segarkan informasi runtime env

Jika Anda telah memperbarui kode sumber atau gambar terlebih dahulu dan hanya ingin melanjutkan peningkatan dan memulai aplikasi berdasarkan konten saat ini, Anda dapat menambahkan `--skip-download`:

```bash
nb app upgrade --skip-download
```

Jika Anda ingin menentukan versi target secara eksplisit, Anda juga dapat menambahkan `--version`:

```bash
nb app upgrade --version beta
```

:::catatan peringatan

`nb app upgrade` Biasanya Anda juga akan diminta konfirmasi satu kali sebelum benar-benar memulai. Dalam skrip, CI, atau skenario non-interaktif lainnya, `--force` harus diteruskan secara eksplisit. Jika Anda juga beroperasi di seluruh envs pada saat yang sama, Anda biasanya perlu menyatukan `--yes`.

```bash
nb app upgrade --env app1 --yes --force
```

:::

Untuk deskripsi parameter yang lebih lengkap, lihat [`nb app upgrade`](../../api/cli/app/upgrade.md).

## Tautan terkait

- [nb maksud desain aplikasi](../cli-design/nb-app-design-intent.md)
- [Manajemen beberapa lingkungan](./multi-environment.md)
- [`nb app` Referensi Perintah](../../api/cli/app/index.md)
