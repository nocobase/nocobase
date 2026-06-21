---
pkg: "@nocobase/plugin-action-import-pro"
title: "Action Impor Pro"
description: "Action Impor Pro: fitur impor lanjutan, mendukung template kustom, impor multi-table, validasi data."
keywords: "Impor Pro, ImportPro, impor lanjutan, template kustom, interface builder, NocoBase"
---
# Impor Pro

## Pengantar

Plugin Impor Pro menyediakan fitur tambahan di atas fitur impor biasa.

## Instalasi

Plugin ini bergantung pada Plugin Manajemen Tugas Asynchronous, sebelum digunakan harus mengaktifkan Plugin Manajemen Tugas Asynchronous terlebih dahulu.

## Peningkatan Fitur

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)



- Mendukung Action impor asynchronous, dieksekusi di thread independen, mendukung impor data dalam jumlah besar.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Mendukung opsi impor lanjutan.


## Panduan Penggunaan

### Impor Asynchronous

Setelah impor dieksekusi, alur impor akan dieksekusi di thread background independen tanpa konfigurasi manual pengguna. Di antarmuka pengguna, setelah Action impor dieksekusi, di bagian kanan atas akan ditampilkan tugas impor yang sedang dieksekusi, dan progress tugas akan ditampilkan secara real-time.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Setelah impor selesai, Anda dapat melihat hasil impor di tugas impor.

#### Tentang Konkurensi

Jika ingin membatasi penggunaan resource sistem saat tugas asynchronous dieksekusi secara concurrent, dapat menggunakan beberapa variabel lingkungan berikut untuk mengontrol

- `ASYNC_TASK_MAX_CONCURRENCY`

Membatasi jumlah eksekusi concurrent tugas asynchronous, default 3

- `ASYNC_TASK_CONCURRENCY_MODE`

Menentukan mode batas eksekusi concurrent, nilai yang tersedia adalah `app` dan `process`, default `app`.

Ketika nilai variabel lingkungan ini diatur ke `app`, jumlah maksimum eksekusi concurrent tugas asynchronous untuk setiap sub-aplikasi dibatasi sebesar nilai yang ditentukan oleh `ASYNC_TASK_MAX_CONCURRENCY`.

Ketika nilai variabel lingkungan ini diatur ke `process`, total jumlah eksekusi concurrent tugas dari semua sub-aplikasi dalam proses tidak boleh melebihi nilai yang ditentukan oleh `ASYNC_TASK_MAX_CONCURRENCY`.

- `ASYNC_TASK_WORKER_MAX_OLD` dan `ASYNC_TASK_WORKER_MAX_YOUNG`

Membatasi memori heap old generation maksimum (Mb) dan memori heap young generation (Mb) yang dapat dialokasikan oleh thread worker yang menjalankan tugas asynchronous

#### Tentang Performa

Untuk mengevaluasi performa impor data skala besar, kami melakukan pengujian perbandingan dalam skenario, tipe Field, dan konfigurasi trigger yang berbeda (mungkin berbeda di server dan konfigurasi database yang berbeda, hanya untuk referensi):

| Jumlah Data | Tipe Field | Konfigurasi Impor | Durasi Pemrosesan |
|------|---------|---------|---------|
| 1 juta record | string, number, date, email, long text | • Trigger workflow: tidak<br>• Identifikasi duplikat: tidak ada | Sekitar 1 menit |
| 500 ribu record | string, number, date, email, long text, many-to-many | • Trigger workflow: tidak<br>• Identifikasi duplikat: tidak ada | Sekitar 16 menit|
| 500 ribu record | string, number, date, email, long text, many-to-many, many-to-one | • Trigger workflow: tidak<br>• Identifikasi duplikat: tidak ada | Sekitar 22 menit |
| 500 ribu record | string, number, date, email, long text, many-to-many, many-to-one | • Trigger workflow: trigger notifikasi asynchronous<br>• Identifikasi duplikat: tidak ada | Sekitar 22 menit |
| 500 ribu record | string, number, date, email, long text, many-to-many, many-to-one | • Trigger workflow: trigger notifikasi asynchronous<br>• Identifikasi duplikat: update duplikat, dengan 50 ribu data duplikat | Sekitar 3 jam |

Berdasarkan hasil pengujian performa di atas dan beberapa desain yang ada, berikut penjelasan dan rekomendasi untuk faktor pengaruh:

1. **Mekanisme Pemrosesan Record Duplikat**: Saat memilih opsi **Update Record Duplikat** atau **Hanya Update Record Duplikat**, sistem akan menjalankan operasi query dan update satu per satu, yang akan secara signifikan menurunkan efisiensi impor. Jika di Excel Anda terdapat data duplikat yang tidak berguna, hal ini akan lebih lanjut secara signifikan mempengaruhi kecepatan impor. Disarankan untuk membersihkan data duplikat yang tidak berguna di Excel sebelum impor (misalnya dengan menggunakan tool profesional untuk dedup), kemudian baru impor ke sistem, sehingga dapat menghindari pemborosan waktu yang tidak perlu.

2. **Efisiensi Pemrosesan Field Relasi**: Sistem memproses Field relasi dengan cara query asosiasi satu per satu, yang akan menjadi bottleneck performa dalam skenario data dalam jumlah besar. Untuk struktur relasi sederhana (seperti asosiasi one-to-many dua Table), disarankan untuk mengadopsi strategi impor bertahap: impor data dasar Table utama terlebih dahulu, setelah selesai baru bangun relasi antar Table. Jika kebutuhan bisnis mengharuskan impor data relasi secara bersamaan, silakan merujuk ke hasil pengujian performa di tabel di atas untuk merencanakan waktu impor secara wajar.

3. **Mekanisme Pemrosesan Workflow**: Tidak disarankan untuk mengaktifkan trigger workflow dalam skenario impor data skala besar, terutama berdasarkan dua pertimbangan berikut:
   - Status tugas impor menunjukkan 100%, tetapi tidak akan langsung selesai. Sistem masih memerlukan waktu tambahan untuk memproses pembuatan rencana eksekusi workflow. Pada tahap ini, sistem akan menghasilkan rencana eksekusi workflow yang sesuai untuk setiap data yang diimpor, menempati thread impor, tetapi tidak akan mempengaruhi penggunaan data yang sudah diimpor.
   - Setelah tugas impor sepenuhnya selesai, eksekusi concurrent dari banyak workflow dapat menyebabkan resource sistem tegang, mempengaruhi kecepatan respons sistem secara keseluruhan dan pengalaman pengguna.

3 faktor pengaruh di atas akan dipertimbangkan untuk optimasi lebih lanjut nantinya.

### Konfigurasi Impor

#### Opsi Impor - Apakah Trigger Workflow

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Saat impor, dapat memilih apakah akan trigger workflow. Jika dicentang opsi ini dan Collection ini terikat workflow (event Collection), impor akan trigger eksekusi workflow per baris.

#### Opsi Impor - Identifikasi Record Duplikat

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Centang opsi ini, pilih mode yang sesuai, maka saat impor akan mengidentifikasi record duplikat, dan memprosesnya.

Opsi dalam konfigurasi impor akan diterapkan sebagai nilai default, admin dapat mengontrol apakah uploader diizinkan untuk memodifikasi opsi ini (kecuali opsi trigger workflow).

**Pengaturan Izin Uploader**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)


- Izinkan uploader memodifikasi opsi impor

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Nonaktifkan uploader memodifikasi opsi impor

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Penjelasan Mode

- Lewati Record Duplikat: Berdasarkan konten "Field rujukan" untuk query record yang sudah ada. Jika record sudah ada, langsung lewati baris ini; jika tidak ada, impor sebagai record baru.
- Update Record Duplikat: Berdasarkan konten "Field rujukan" untuk query record yang sudah ada. Jika record sudah ada, update record baris ini; jika tidak ada, impor sebagai record baru.
- Hanya Update Record Duplikat: Berdasarkan konten "Field rujukan" untuk query record yang sudah ada. Jika record sudah ada, update record ini; jika tidak ada, lewati.

##### Field Rujukan

Sistem mengidentifikasi apakah baris adalah record duplikat berdasarkan nilai Field ini.


- [Aturan Linkage](/interface-builder/actions/action-settings/linkage-rule): tampilan/sembunyi tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Edit judul, tipe, ikon tombol;
