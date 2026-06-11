# Cadangkan dan pulihkan

Jika Anda telah menyimpan aplikasi NocoBase sebagai env CLI, pencadangan dan pemulihan harian pada dasarnya diselesaikan di grup perintah `nb backup`. `nb backup create` digunakan untuk membuat cadangan di env target dan mengunduhnya ke lokal. `nb backup restore` digunakan untuk memulihkan file cadangan lokal ke env target.

Seringkali, cukup mengingat saran default: buat cadangan sebelum memutakhirkan, memigrasi, atau mengubah data secara batch; lakukan pemulihan hanya jika Anda mengetahui dengan jelas bahwa Anda ingin menimpa data saat ini.

## Indeks cepat

| saya ingin... | Perintah mana yang harus digunakan |
| --- | --- |
| Pertama-tama buat cadangan env saat ini ke lokal | [`nb backup create`](../../api/cli/backup/create.md) |
| Simpan cadangan ke direktori yang ditentukan | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| Biarkan skrip terus menggunakan hasil cadangan | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| Pulihkan cadangan lokal ke env | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| Pulihkan cadangan lokal ke env | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip terlebih dahulu konfirmasikan env saat ini

Perintah `nb backup` bertindak pada env saat ini secara default. Jika Anda memelihara beberapa lingkungan secara bersamaan, rekomendasi defaultnya adalah melihat env saat ini sebelum melakukan pencadangan atau pemulihan.

```bash
nb env current
nb env use app1
```

Jika Anda secara eksplisit memasukkan `--env` yang berbeda, CLI biasanya akan meminta konfirmasi. Dalam skrip atau skenario non-interaktif, Anda dapat menambahkan `--yes` untuk melewati langkah ini.

:::

## Buat cadangan

Penggunaan paling sederhana adalah membuat cadangan secara langsung:

```bash
nb backup create
```

Setelah perintah berhasil dikembalikan, file cadangan telah diunduh secara lokal. Ketika `--output` dihilangkan, CLI menyimpan file ke direktori kerja saat ini dan menggunakan nama file yang dikembalikan oleh ujung jarak jauh—biasanya `backup_*.nbdata`.

Jika Anda ingin menyimpan cadangan ke dalam satu direktori, Anda dapat menggunakan ini:

```bash
nb backup create --output ./backups
```

Jika `./backups` sudah ada dan merupakan sebuah direktori, CLI akan secara otomatis menambahkan nama file cadangan jarak jauh ke direktori tersebut. Hanya jika jalurnya tidak ada, CLI akan memperlakukannya sebagai jalur file target.

Jika Anda ingin terus menggunakan hasil cadangan dalam skrip, CI, atau tautan agen, Anda dapat menambahkan `--json-output`:

```bash
nb backup create --env app1 --yes --json-output
```

Dalam mode ini, CLI tidak lagi mengeluarkan teks kemajuan, tetapi langsung mengembalikan JSON akhir, yang biasanya berisi tiga bidang: `env`, `name`, dan `output`.

## Pulihkan cadangan

Perintah pemulihan akan mengunggah file cadangan lokal ke env target dan menimpa data aplikasi saat ini:

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

Jika Anda ingin memulihkan ke sesuatu selain env saat ini, biasanya lebih aman untuk menulis seperti ini:

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::catatan peringatan

Pemulihan adalah operasi cakupan penuh. Secara default, disarankan untuk membuat cadangan lain dari target env saat ini sebelum memulihkan.

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` pertama-tama akan memeriksa apakah jalur yang ditunjuk oleh `--file` ada dan mengonfirmasi bahwa itu adalah file normal. Setelah pengunggahan berhasil, CLI akan terus menunggu aplikasi lolos pemeriksaan kesehatan lagi, sehingga ketika perintah berhasil dikembalikan, aplikasi biasanya telah dikembalikan ke keadaan dapat diakses.

Jika `--force` tidak diteruskan, terminal interaktif akan meminta konfirmasi Anda lagi. Di terminal non-interaktif, skrip, dan sesi agen AI, `--force` diperlukan.

## Situasi umum

Jika Anda lebih terbiasa mengoperasikan antarmuka, atau memerlukan kemampuan seperti pencadangan terjadwal dan sinkronisasi penyimpanan cloud, Anda dapat langsung melihat [Manajemen Cadangan](../../ops-management/backup-manager/index.mdx). Dalam skenario seperti itu, UI Web seringkali lebih cocok.

## Tautan terkait

- [`nb backup` Referensi Perintah](../../api/cli/backup/index.md)
- [`nb env` Referensi Perintah](../../api/cli/env/index.md)
- [Manajemen beberapa lingkungan](./multi-environment.md)
- [Manajemen Cadangan](../../ops-management/backup-manager/index.mdx)
