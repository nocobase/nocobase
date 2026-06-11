---
pkg: '@nocobase/plugin-record-history'
title: "Record History"
description: "Plugin record history melacak perubahan tabel data: secara otomatis menyimpan snapshot dan diff dari penambahan, modifikasi, penghapusan, mendukung perubahan tingkat field, sinkronisasi snapshot historis, block record history, dan konfigurasi template deskripsi."
keywords: "record history,riwayat record,pelacakan perubahan data,snapshot,perubahan tingkat field,audit,block record history,NocoBase"
---
# Record History

## Pengantar

Plugin record history digunakan untuk melacak proses perubahan data, secara otomatis menyimpan snapshot dan diff dari operasi penambahan, modifikasi, dan penghapusan, membantu pengguna dengan cepat menelusuri kembali perubahan data dan mengaudit perilaku operasi.

![](https://static-docs.nocobase.com/202511011338499.png)

## Mengaktifkan Record History

### Menambahkan Tabel Data dan Field

Pertama, masuk ke halaman konfigurasi plugin record history, lalu tambahkan tabel data dan field yang perlu dicatat riwayat operasinya. Untuk meningkatkan efisiensi pencatatan dan menghindari redundansi data, disarankan hanya mengkonfigurasi tabel data dan field yang diperlukan. Field seperti ID unik, tanggal pembuatan, tanggal pembaruan, pembuat, pemodifikasi biasanya tidak perlu dicatat.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Sinkronisasi Snapshot Data Historis

- Data yang dibuat sebelum record history diaktifkan, hanya akan dapat dicatat perubahannya setelah snapshot pertama dibuat saat update pertama; oleh karena itu update atau delete pertama tidak akan meninggalkan riwayat.
- Jika perlu mempertahankan riwayat data yang sudah ada, Anda dapat menjalankan sinkronisasi snapshot sekali.
- Volume data snapshot tabel tunggal = jumlah record × jumlah field yang perlu dicatat.
- Jika volume data sangat besar, disarankan untuk hanya menyinkronkan data penting melalui filter rentang data.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Klik tombol "Sync history record snapshot", atur field dan rentang data yang perlu disinkronkan, lalu sinkronisasi akan dimulai.

![](https://static-docs.nocobase.com/202511011320958.png)

Tugas sinkronisasi akan diantrekan dan berjalan di background, Anda dapat me-refresh daftar untuk memeriksa apakah tugas telah selesai.

## Menggunakan Block Record History

### Menambahkan Block

Pilih block record history, lalu pilih tabel data, untuk menambahkan block record history yang sesuai dengan tabel data tersebut.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Jika Anda menambahkan block record history di dalam popup record data tertentu, Anda dapat memilih "Current record" untuk menambahkan block record history yang ditujukan untuk record data tersebut.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Mengedit Template Deskripsi

Klik "Edit template" pada konfigurasi block, untuk mengkonfigurasi teks deskripsi record operasi.

![](https://static-docs.nocobase.com/202511011340406.png)

Saat ini mendukung konfigurasi teks deskripsi terpisah untuk record create, update, dan delete; di mana untuk record update, juga mendukung konfigurasi teks deskripsi perubahan field, mendukung konfigurasi terpadu maupun konfigurasi terpisah untuk field tertentu.

![](https://static-docs.nocobase.com/202511011346400.png)

Saat mengkonfigurasi teks, Anda dapat menggunakan variable.

![](https://static-docs.nocobase.com/202511011347163.png)

Setelah konfigurasi selesai, Anda dapat memilih untuk menerapkannya pada "All record history blocks of current data table" atau "Only the current record history block".

![](https://static-docs.nocobase.com/202511011348885.png)
