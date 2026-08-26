---
pkg: "@nocobase/preset-cluster"
title: "Alur Operasi Cluster"
description: "Operasi cluster mode: urutan startup pertama, alur upgrade versi (stop service, backup, update, verifikasi), maintenance dalam aplikasi (manajemen plugin, backup restore) perlu dikurangi ke single node."
keywords: "operasi cluster,upgrade versi,maintenance dalam aplikasi,manajemen plugin,backup restore,upgrade dengan stop service,NocoBase"
---

# Alur Operasi

## Startup Aplikasi Pertama Kali

Saat menjalankan aplikasi pertama kali, sebaiknya menjalankan satu node terlebih dahulu, tunggu hingga plugin terinstal dan diaktifkan, kemudian baru menjalankan node lainnya.

## Upgrade Versi

Saat perlu meng-upgrade versi NocoBase, ikuti alur ini.

:::warning{title=Perhatian}
Pada **production environment** cluster, perlu hati-hati atau dilarang menggunakan fitur seperti manajemen plugin dan upgrade versi.

NocoBase saat ini belum mengimplementasikan online upgrade untuk versi cluster. Untuk memastikan konsistensi data, layanan eksternal harus dihentikan selama proses upgrade.
:::

Langkah operasi:

1.  Hentikan service saat ini

    Hentikan semua instance aplikasi NocoBase, dan alihkan traffic load balancer ke halaman status 503.

2.  Backup data

    Sebelum upgrade, sangat disarankan untuk membackup data database, untuk mencegah anomali selama proses upgrade.

3.  Update versi

    Lihat [Upgrade Docker](../get-started/upgrading/docker) untuk update versi image aplikasi NocoBase.

4.  Jalankan service

    1. Jalankan satu node dalam cluster, tunggu hingga update selesai dan startup berhasil
    2. Verifikasi fitur berjalan dengan benar, jika ada anomali dan tidak dapat diselesaikan setelah investigasi, dapat di-rollback ke versi sebelumnya
    3. Jalankan node lainnya
    4. Alihkan traffic load balancer ke application cluster

## Maintenance dalam Aplikasi

Maintenance dalam aplikasi mengacu pada operasi fitur terkait maintenance saat aplikasi berjalan, termasuk:

* Manajemen plugin (instal, aktifkan, nonaktifkan plugin, dll)
* Backup dan restore
* Manajemen migrasi environment

Langkah operasi:

1.  Kurangi node

    Kurangi node yang menjalankan aplikasi dalam cluster menjadi 1, hentikan service di node lainnya.

2.  Lakukan operasi maintenance dalam aplikasi, seperti instal dan aktifkan plugin, backup data, dll.

3.  Pulihkan node

    Setelah operasi maintenance selesai dan fitur diverifikasi tanpa masalah, jalankan node lainnya, tunggu hingga node berhasil dijalankan, kemudian pulihkan status running cluster.
