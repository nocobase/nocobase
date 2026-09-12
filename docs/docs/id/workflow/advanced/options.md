---
title: "Konfigurasi Lanjutan"
description: "Konfigurasi lanjutan: opsi runtime seperti transaksi, percobaan ulang kegagalan, timeout, konkurensi, optimalkan stabilitas dan kinerja eksekusi."
keywords: "Workflow,konfigurasi lanjutan,Options,transaksi,percobaan ulang kegagalan,timeout,konkurensi,NocoBase"
---

# Konfigurasi Lanjutan

## Pengaturan Timeout

Mulai versi `2.1.0`, Workflow mendukung pengaturan timeout untuk membatasi durasi maksimum satu kali eksekusi, sejak mulai diproses hingga selesai. Pengaturan timeout cocok digunakan untuk mencegah Workflow terus memakai resource eksekusi karena berjalan terlalu lama, menunggu penanganan manual, atau menunggu callback eksternal.

Di dialog pembuatan atau pengeditan Workflow, buka "Opsi lanjutan" untuk mengonfigurasi "Pengaturan timeout":

![20260604212454](https://static-docs.nocobase.com/20260604212454.png)

Opsi yang dapat dikonfigurasi adalah:

- Masukkan `0` berarti tidak membatasi waktu timeout (nilai default).
- Masukkan nilai lebih besar dari `0` berarti mengaktifkan batas timeout. Antarmuka mendukung satuan detik, menit, jam, dan hari.
- Waktu timeout maksimum yang dapat diatur adalah 180 hari.

### Aturan Perhitungan Waktu

Waktu timeout mulai dihitung ketika Workflow pertama kali masuk ke prosesor. Setelah Workflow dipicu, jika masih menunggu penjadwalan di antrian, atau disimpan sementara untuk mulai tertunda, waktu tersebut tidak akan mengurangi waktu timeout.

Setelah masuk ke prosesor, waktu timeout akan terus dihitung, termasuk waktu eksekusi aktual Node dan juga waktu Node yang sudah masuk ke status menunggu, seperti penanganan manual, persetujuan, penundaan, menunggu callback eksternal, dan sebagainya. Waktu timeout tidak berhenti ketika Workflow dijeda untuk menunggu tindakan pengguna.

Batas akhir timeout ditentukan saat eksekusi ini dimulai. Mengubah pengaturan timeout Workflow hanya memengaruhi eksekusi yang mulai diproses setelahnya, dan tidak menghitung ulang eksekusi yang sudah dimulai.

### Penanganan Setelah Timeout

Jika saat waktu timeout tercapai eksekusi ini belum selesai, sistem akan menghentikan eksekusi tersebut:

- Status riwayat eksekusi berubah menjadi "Dihentikan", dan alasan penghentian ditampilkan sebagai "Timeout".
- Tugas Node yang sedang berjalan atau sedang menunggu akan ditandai sebagai "Dihentikan".
- Node berikutnya tidak akan melanjutkan eksekusi.
- Jika di bawah eksekusi ini masih ada eksekusi subflow yang sedang berjalan, subflow juga akan dihentikan bersama eksekusi induknya.

Contoh:

- Jika Node loop menjalankan loop yang sangat panjang, dan proses di dalam loop cukup memakan waktu sehingga keseluruhan waktu eksekusi Node loop melebihi timeout yang ditetapkan, maka Node loop yang sedang berjalan dan Node internalnya akan dihentikan secara paksa, dan Node berikutnya tidak akan melanjutkan eksekusi.
- Jika Node penanganan manual atau persetujuan menunggu sangat lama hingga melebihi timeout yang ditetapkan, maka Node penanganan manual yang sedang menunggu akan dihentikan secara paksa, Node berikutnya tidak akan melanjutkan eksekusi, dan tugas terkait juga akan dibatalkan.

:::info{title=Tips}
Pengaturan timeout adalah batas global untuk seluruh eksekusi Workflow, bukan timeout terpisah untuk Node tertentu. Jika hanya perlu membatasi waktu tunggu Node tertentu seperti HTTP Request atau JavaScript Script, gunakan pengaturan timeout milik Node tersebut.
:::

:::info{title=Tips}
Jika perlu menerapkan penanganan berbatas waktu pada level bisnis, misalnya "jika tiket kerja tidak diproses dalam 10 menit, perbarui menjadi timeout", biasanya gunakan [Node penundaan](../nodes/delay.md) bersama cabang paralel untuk menyusun penanganan berikutnya. Timeout global akan langsung menghentikan eksekusi saat ini, sehingga cocok sebagai perlindungan cadangan, bukan untuk menjalankan cabang bisnis berikutnya.
:::

## Mode Eksekusi

Workflow akan dieksekusi dengan mode "asinkron" atau "sinkron" berdasarkan tipe Trigger yang dipilih saat pembuatan. Mode asinkron berarti setelah event tertentu dipicu, Workflow akan masuk ke antrian untuk dieksekusi satu per satu oleh penjadwal di latar belakang. Sedangkan mode sinkron berarti setelah pemicuan, Workflow tidak akan masuk ke antrian penjadwalan, melainkan langsung mulai dieksekusi, dan akan memberikan umpan balik segera setelah eksekusi selesai.

Event tabel data, event setelah action, event action kustom, event tugas terjadwal, dan event persetujuan secara default akan dieksekusi secara asinkron, sedangkan event sebelum action secara default akan dieksekusi secara sinkron. Di antaranya, event tabel data dan event formulir mendukung kedua mode, dan dapat dipilih saat membuat Workflow:

![Mode sinkron_buat Workflow sinkron](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Tips}
Workflow mode sinkron dibatasi oleh modenya, secara internal tidak dapat menggunakan Node yang menghasilkan status "menunggu", seperti "Penanganan Manual", dll.
:::

## Hapus Riwayat Otomatis

Ketika Workflow dipicu cukup sering, Anda dapat mengonfigurasi penghapusan riwayat otomatis untuk mengurangi gangguan, sekaligus mengurangi tekanan penyimpanan database.

Sama halnya, di dialog pembuatan dan pengeditan Workflow, Anda dapat mengonfigurasi apakah alur tersebut akan menghapus riwayat secara otomatis:

![Konfigurasi penghapusan riwayat otomatis](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Penghapusan otomatis dapat dikonfigurasi berdasarkan status hasil eksekusi. Dalam kebanyakan kasus, disarankan hanya mencentang status "Selesai", agar catatan eksekusi yang gagal dipertahankan untuk memudahkan penyelidikan masalah selanjutnya.

Disarankan untuk tidak mengaktifkan penghapusan riwayat otomatis saat men-debug Workflow, agar Anda dapat memeriksa apakah logika eksekusi Workflow sesuai harapan melalui catatan riwayat.

:::info{title=Tips}
Menghapus riwayat Workflow tidak akan mengurangi jumlah eksekusi yang sudah dijalankan oleh Workflow.
:::
