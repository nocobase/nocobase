---
title: "Konfigurasi Lanjutan"
description: "Konfigurasi lanjutan: opsi runtime seperti transaksi, percobaan ulang kegagalan, timeout, konkurensi, optimalkan stabilitas dan kinerja eksekusi."
keywords: "Workflow,konfigurasi lanjutan,Options,transaksi,percobaan ulang kegagalan,timeout,konkurensi,NocoBase"
---

# Konfigurasi Lanjutan

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
