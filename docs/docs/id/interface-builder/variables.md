---
title: "Variabel"
description: "Variabel Interface Builder: menyimpan data sementara, transfer antar Block, mendukung variabel global dan variabel lokal, dapat direferensikan dalam aturan linkage dan event flow."
keywords: "variabel, variables, variabel global, variabel lokal, transfer antar Block, aturan linkage, interface builder, NocoBase"
---

# Variabel

## Pengantar

Variabel adalah sekumpulan tag yang digunakan untuk mengidentifikasi nilai tertentu dalam konteks saat ini. Dapat digunakan di skenario seperti konfigurasi cakupan data Block, nilai default Field, aturan linkage, workflow, dan lainnya.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Variabel yang Saat Ini Didukung

### Pengguna Saat Ini

Merepresentasikan data pengguna yang sedang login.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Peran Saat Ini

Merepresentasikan tag peran (role name) pengguna yang sedang login.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Form Saat Ini

Nilai Form saat ini, hanya digunakan untuk Block Form. Skenario penggunaan meliputi:

- Aturan linkage Form saat ini
- Nilai default Field Form (hanya valid saat menambahkan data baru)
- Pengaturan cakupan data Field relasi
- Konfigurasi penugasan Field pada Action submit

#### Aturan Linkage Form Saat Ini

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Nilai Default Field Form (Hanya Form Tambah Baru)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

<!-- ![20240416171129_rec_](https://static-docs.nocobase.com/20240416171129_rec_.gif) -->

#### Pengaturan Cakupan Data Field Relasi

Digunakan untuk memfilter opsi Field downstream secara dinamis berdasarkan Field upstream, memastikan input data yang akurat.

**Contoh:**

1. Pengguna memilih nilai Field **Owner**.
2. Sistem secara otomatis memfilter opsi Field **Account** berdasarkan **userName** Owner yang dipilih.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

<!-- ![20240416171743_rec_](https://static-docs.nocobase.com/20240416171743_rec_.gif) -->

<!-- #### Konfigurasi Penugasan Field pada Action Submit

![20240416171215_rec_](https://static-docs.nocobase.com/20240416171215_rec_.gif) -->

<!-- ### Objek Saat Ini

Saat ini hanya digunakan untuk konfigurasi Field Sub-Form dan Sub-Table di Block Form, merepresentasikan nilai setiap itemnya:

- Nilai default Sub-Field
- Cakupan data Sub-Field relasi

#### Nilai Default Sub-Field

![20240416172933_rec_](https://static-docs.nocobase.com/20240416172933_rec_.gif)

#### Cakupan Data Sub-Field Relasi

![20240416173043_rec_](https://static-docs.nocobase.com/20240416173043_rec_.gif) -->

<!-- ### Objek Parent

Mirip dengan "Objek Saat Ini", merepresentasikan objek parent dari objek saat ini. Didukung di NocoBase v1.3.34-beta dan versi lebih tinggi. -->

### Record Saat Ini

Record adalah baris dalam Table data, setiap baris merepresentasikan satu record. Di **aturan linkage Action baris** pada Block tampilan, semuanya memiliki variabel "Record Saat Ini".

Contoh: Tombol Hapus dinonaktifkan untuk dokumen yang "sudah dibayar".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Record Popup Saat Ini

Action Popup memainkan peran yang sangat penting dalam konfigurasi antarmuka NocoBase.

- Popup Action baris: setiap Popup memiliki variabel "Record Popup Saat Ini", merepresentasikan record baris saat ini.
- Popup Field relasi: setiap Popup memiliki variabel "Record Popup Saat Ini", merepresentasikan record relasi yang sedang diklik.

Block dalam Popup semuanya dapat menggunakan variabel "Record Popup Saat Ini" ini. Skenario penggunaan terkait meliputi:

- Konfigurasi cakupan data Block
- Konfigurasi cakupan data Field relasi
- Konfigurasi nilai default Field (Form tambah data baru)
- Konfigurasi aturan linkage Action

<!-- #### Konfigurasi Cakupan Data Block

![20251027151107](https://static-docs.nocobase.com/20251027151107.png)

#### Konfigurasi Cakupan Data Field Relasi

![20240416224641_rec_](https://static-docs.nocobase.com/20240416224641_rec_.gif)

#### Konfigurasi Nilai Default Field (Form Tambah Data Baru)

![20240416223846_rec_](https://static-docs.nocobase.com/20240416223846_rec_.gif)

#### Konfigurasi Aturan Linkage Action

![20240416223101_rec_](https://static-docs.nocobase.com/20240416223101_rec_.gif)

<!--
#### Konfigurasi Penugasan Field pada Action Submit Form

![20240416224014_rec_](https://static-docs.nocobase.com/20240416224014_rec_.gif) -->

<!-- ### Record Terpilih Table

Saat ini hanya digunakan untuk nilai default Field Form pada Action Add record di Block Table

#### Nilai Default Field Form pada Action Add record -->

<!-- ### Record Parent (Deprecated)

Hanya digunakan dalam Block relasi, merepresentasikan record sumber data relasi.

:::warning
"Record Parent" sudah deprecated, disarankan untuk menggunakan "Record Popup Saat Ini" yang setara.
:::

<!-- ### Variabel Tanggal

Variabel tanggal adalah placeholder tanggal yang dapat di-resolve secara dinamis. Di sistem dapat digunakan untuk mengatur cakupan data Block, cakupan data Field relasi, kondisi tanggal pada aturan linkage Action, serta nilai default Field tanggal. Tergantung pada skenario penggunaan, cara resolve variabel tanggal juga berbeda: dalam skenario penugasan (seperti pengaturan nilai default), di-resolve menjadi waktu spesifik; dalam skenario filter (seperti kondisi cakupan data), di-resolve menjadi rentang waktu untuk mendukung filter yang lebih fleksibel.

#### Skenario Filter

Skenario penggunaan terkait meliputi:

- Pengaturan kondisi Field tanggal pada cakupan data Block
- Pengaturan kondisi Field tanggal pada cakupan data Field relasi
- Pengaturan kondisi Field tanggal pada aturan linkage Action

![20250522211606](https://static-docs.nocobase.com/20250522211606.png)

Variabel terkait meliputi:

- Current time
- Yesterday
- Today
- Tomorrow
- Last week
- This week
- Next week
- Last month
- This month
- Next month
- Last quarter
- This quarter
- Next quarter
- Last year
- This year
- Next year
- Last 7 days
- Next 7 days
- Last 30 days
- Next 30 days
- Last 90 days
- Next 90 days

#### Skenario Penugasan

Dalam skenario penugasan, variabel tanggal yang sama akan otomatis di-resolve menjadi format yang berbeda berdasarkan tipe Field target. Misalnya, ketika menggunakan Today untuk menetapkan nilai pada Field tanggal yang berbeda tipe:

- Untuk Field timestamp (Timestamp) dan Field date-time dengan timezone (DateTime with timezone), variabel akan di-resolve menjadi string waktu UTC lengkap, seperti 2024-04-20T16:00:00.000Z, termasuk informasi timezone, cocok untuk kebutuhan sinkronisasi lintas timezone.

- Untuk Field date-time tanpa timezone (DateTime without timezone), variabel akan di-resolve menjadi string format waktu lokal, seperti 2025-04-21 00:00:00, tanpa informasi timezone, lebih cocok untuk pemrosesan logika bisnis lokal.

- Untuk Field hanya tanggal (DateOnly), variabel akan di-resolve menjadi string tanggal murni, seperti 2025-04-21, hanya berisi tahun-bulan-tanggal, tanpa bagian waktu.

Sistem akan secara cerdas me-resolve variabel berdasarkan tipe Field, memastikan format yang benar saat penugasan, menghindari kesalahan data atau pengecualian akibat ketidakcocokan tipe.

![20250522212802](https://static-docs.nocobase.com/20250522212802.png)

Skenario penggunaan terkait meliputi:

- Pengaturan nilai default Field tanggal di Block Form
- Pengaturan value atribut Field tanggal pada aturan linkage
- Penugasan Field tanggal pada tombol submit

Variabel terkait meliputi:

- Now
- Yesterday
- Today
- Tomorrow -->

### Parameter Query URL

Variabel ini merepresentasikan parameter query di URL halaman saat ini. Variabel ini hanya tersedia ketika ada query string di URL halaman. Akan lebih nyaman digunakan bersama dengan [Action Link](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API token

Nilai variabel ini adalah string yang merupakan kredensial untuk mengakses NocoBase API. Dapat digunakan untuk memverifikasi identitas pengguna.

### Tipe Perangkat Saat Ini

Contoh: Action "Print Template" tidak ditampilkan pada perangkat non-komputer.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)
