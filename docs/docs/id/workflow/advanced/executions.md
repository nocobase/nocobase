---
title: "Workflow - Rencana Eksekusi (Riwayat)"
description: "Rencana eksekusi (riwayat): status dalam antrian, sedang berjalan, selesai, gagal, riwayat eksekusi dan detailnya."
keywords: "Workflow,rencana eksekusi,riwayat eksekusi,status eksekusi,riwayat,NocoBase"
---

# Rencana Eksekusi (Riwayat)

Setiap kali Workflow dipicu, sebuah rencana eksekusi akan dibuat untuk melacak proses eksekusi tugas tersebut. Setiap rencana eksekusi memiliki nilai status yang merepresentasikan status eksekusi saat ini, status ini dapat dilihat baik di daftar maupun detail riwayat eksekusi:

![Status rencana eksekusi](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Ketika semua Node di cabang utama berhasil dieksekusi sampai akhir alur dengan status "Selesai", seluruh rencana eksekusi akan berakhir dengan status "Selesai". Ketika Node di cabang utama mengalami status final seperti "Gagal", "Error", "Dibatalkan", "Ditolak", dll., seluruh rencana eksekusi akan **dihentikan lebih awal** dengan status yang sesuai. Ketika Node di cabang utama mengalami status "Menunggu", seluruh rencana eksekusi akan dijeda eksekusinya, namun tetap menampilkan status "Sedang berjalan", sampai Node yang menunggu dipulihkan untuk dilanjutkan. Tipe Node yang berbeda menangani status menunggu dengan cara yang berbeda, misalnya Node manual perlu menunggu pemrosesan manual, sedangkan Node tunda perlu menunggu sampai waktu tiba untuk melanjutkan eksekusi.

Status rencana eksekusi seperti pada tabel berikut:

| Status         | Status Node Terakhir di Alur Utama | Arti                                                                  |
| -------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Dalam antrian  | -                                  | Alur sudah dipicu dan rencana eksekusi dihasilkan, mengantri eksekusi |
| Sedang berjalan | Menunggu                           | Node meminta jeda, menunggu input atau callback selanjutnya            |
| Selesai        | Selesai                            | Tidak ada masalah, semua Node dieksekusi sesuai rencana satu per satu |
| Gagal          | Gagal                              | Karena tidak memenuhi konfigurasi Node, menyebabkan kegagalan         |
| Error          | Error                              | Node mengalami error program yang tidak ditangkap, berakhir lebih awal |
| Dibatalkan     | Dibatalkan                         | Node yang menunggu dibatalkan dari luar oleh manajer alur, berakhir lebih awal |
| Ditolak        | Ditolak                            | Pada Node penanganan manual, ditolak secara manual sehingga alur tidak dilanjutkan |

Pada contoh [Memulai](../getting-started.md), kita sudah mengetahui bahwa melihat detail riwayat eksekusi Workflow dapat memeriksa apakah eksekusi semua Node berjalan normal selama proses eksekusi, serta status eksekusi dan data hasil setiap Node yang sudah dieksekusi. Pada beberapa alur dan Node lanjutan, hasil Node bisa juga ada beberapa, misalnya hasil Node Loop:

![Hasil Node yang dieksekusi beberapa kali](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Tips}
Workflow dapat dipicu secara konkuren, namun eksekusinya berurutan satu per satu. Bahkan jika beberapa Workflow dipicu bersamaan, eksekusinya akan dilakukan secara berurutan, tidak paralel. Jadi, ketika muncul status "Dalam antrian", artinya ada Workflow lain yang sedang dieksekusi dan perlu menunggu.

Status "Sedang berjalan" hanya menandakan bahwa rencana eksekusi tersebut sudah dimulai, dan biasanya dijeda karena status menunggu dari Node internal, tidak berarti rencana eksekusi tersebut menempati sumber daya eksekusi di kepala antrian. Sehingga ketika ada rencana eksekusi yang "Sedang berjalan", rencana eksekusi lain yang "Dalam antrian" tetap dapat dijadwalkan untuk mulai dieksekusi.
:::

## Status Eksekusi Node

Status rencana eksekusi ditentukan oleh eksekusi setiap Node di dalamnya. Pada satu rencana eksekusi setelah pemicuan, setiap Node setelah dieksekusi akan menghasilkan status eksekusi, dan status ini akan menentukan apakah alur selanjutnya dilanjutkan. Biasanya, setelah Node berhasil dieksekusi, eksekusi akan berlanjut ke Node berikutnya, sampai semua Node selesai dieksekusi secara berurutan, atau dihentikan. Ketika menghadapi Node terkait kontrol alur, seperti cabang, loop, paralel, tunda, dll., arah eksekusi Node berikutnya akan ditentukan berdasarkan kondisi konfigurasi Node dan data konteks runtime.

Status yang mungkin dihasilkan setelah setiap Node dieksekusi seperti pada tabel berikut:

| Status     | Status Final | Penghentian Awal | Arti                                                              |
| ---------- | :----------: | :--------------: | ----------------------------------------------------------------- |
| Menunggu   |     Tidak    |       Tidak      | Node meminta jeda, menunggu input atau callback selanjutnya        |
| Selesai    |      Ya      |       Tidak      | Tidak ada masalah, eksekusi berhasil, lanjut ke Node berikutnya sampai akhir |
| Gagal      |      Ya      |        Ya        | Karena tidak memenuhi konfigurasi Node, menyebabkan kegagalan     |
| Error      |      Ya      |        Ya        | Node mengalami error program yang tidak ditangkap, berakhir lebih awal |
| Dibatalkan |      Ya      |        Ya        | Node yang menunggu dibatalkan dari luar oleh manajer alur, berakhir lebih awal |
| Ditolak    |      Ya      |        Ya        | Pada Node penanganan manual, ditolak secara manual sehingga alur tidak dilanjutkan |

Selain status menunggu, status lainnya merupakan status final dari eksekusi Node. Hanya status final "Selesai" yang akan melanjutkan eksekusi, selain itu akan menghentikan eksekusi seluruh alur lebih awal. Ketika Node berada dalam alur cabang (cabang paralel, kondisi, loop, dll.), status final yang dihasilkan dari eksekusi Node akan ditangani oleh Node yang membuka cabang tersebut, dan demikian seterusnya untuk menentukan alur seluruh alur.

Misalnya ketika kita menggunakan Node kondisi dengan mode "Lanjutkan jika 'Ya'", saat dieksekusi jika hasilnya "Tidak", eksekusi seluruh alur akan dihentikan lebih awal dan keluar dengan status gagal, tidak melanjutkan Node berikutnya, seperti pada gambar di bawah:

![Eksekusi Node gagal](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Tips}
Semua status final selain "Selesai" dapat dianggap sebagai kegagalan, namun alasan kegagalannya berbeda-beda, Anda dapat mengetahui alasan kegagalan lebih lanjut dengan melihat hasil eksekusi Node.
:::
