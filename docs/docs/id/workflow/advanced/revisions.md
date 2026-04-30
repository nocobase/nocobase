---
title: "Manajemen Versi"
description: "Manajemen versi: versi alur Workflow, rilis, rollback, perbandingan dan pemulihan versi historis, mendukung koeksistensi multi-versi."
keywords: "Workflow,manajemen versi,Revisions,rilis rollback,versi historis,NocoBase"
---

# Manajemen Versi

Setelah Workflow yang dikonfigurasi dipicu setidaknya sekali, jika Anda ingin memodifikasi konfigurasi Workflow atau Node di dalamnya, Anda perlu membuat versi baru terlebih dahulu sebelum memodifikasi. Hal ini juga memastikan bahwa ketika meninjau riwayat eksekusi Workflow yang sudah dipicu, tidak terpengaruh oleh modifikasi di masa depan.

Pada halaman konfigurasi Workflow, Anda dapat melihat versi Workflow yang ada di menu versi pojok kanan atas:

![Lihat versi Workflow](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

Pada menu operasi tambahan ("…") di sebelah kanannya, Anda dapat memilih untuk menyalin versi yang sedang dilihat ke versi baru:

![Salin Workflow ke versi baru](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Setelah menyalin ke versi baru, klik sakelar "Aktifkan"/"Nonaktifkan", ubah versi tersebut ke status aktif, maka versi Workflow yang baru akan berlaku.

Jika perlu memilih kembali versi lama, setelah berpindah dari menu versi, klik kembali sakelar "Aktifkan"/"Nonaktifkan" ke status aktif, versi yang sedang dilihat akan berlaku, dan pemicuan selanjutnya akan menjalankan alur dari versi yang sesuai.

Ketika perlu menonaktifkan Workflow, klik sakelar "Aktifkan"/"Nonaktifkan" ke status nonaktif, maka Workflow tersebut tidak akan dipicu lagi.

:::info{title=Tips}
Berbeda dengan "Salin" Workflow di daftar manajemen Workflow, Workflow yang "Disalin ke versi baru" tetap dikumpulkan dalam grup Workflow yang sama, hanya dibedakan melalui versi. Sedangkan Workflow yang disalin akan dianggap sebagai Workflow baru, tidak terkait dengan versi Workflow sebelumnya, dan jumlah eksekusi juga akan direset ke nol.
:::
