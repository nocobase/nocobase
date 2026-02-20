:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Rencana Eksekusi (Riwayat)

Setelah sebuah alur kerja terpicu, sebuah rencana eksekusi yang sesuai akan dibuat untuk melacak proses eksekusi tugas tersebut. Setiap rencana eksekusi memiliki nilai status untuk menunjukkan status eksekusi saat ini, yang dapat dilihat di daftar dan detail riwayat eksekusi:

![Status Rencana Eksekusi](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Ketika semua node dalam cabang alur utama dieksekusi hingga akhir alur dengan status "Selesai", seluruh rencana eksekusi akan berakhir dengan status "Selesai". Ketika sebuah node dalam cabang alur utama memiliki status akhir seperti "Gagal", "Error", "Dibatalkan", atau "Ditolak", seluruh rencana eksekusi akan **dihentikan lebih awal** dengan status yang sesuai. Ketika sebuah node dalam cabang alur utama memiliki status "Menunggu", seluruh rencana eksekusi akan dijeda, tetapi akan tetap menampilkan status "Berjalan", hingga node yang menunggu dilanjutkan kembali. Berbagai jenis node menangani status menunggu dengan cara yang berbeda. Misalnya, node manual perlu menunggu pemrosesan manual, sedangkan node tunda perlu menunggu waktu yang ditentukan berlalu sebelum melanjutkan.

Status rencana eksekusi adalah sebagai berikut:

| Status        | Status node terakhir yang dieksekusi di alur utama | Arti                                                               |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| Dalam Antrean | -                                                  | Alur kerja telah terpicu dan rencana eksekusi telah dibuat, menunggu dalam antrean untuk dijadwalkan oleh penjadwal. |
| Berjalan      | Menunggu                                           | Node memerlukan jeda, menunggu masukan lebih lanjut atau panggilan balik untuk melanjutkan. |
| Selesai       | Selesai                                            | Tidak ada masalah yang ditemui, dan semua node dieksekusi satu per satu sesuai harapan. |
| Gagal         | Gagal                                              | Gagal karena konfigurasi node tidak terpenuhi.                     |
| Error         | Error                                              | Node mengalami kesalahan program yang tidak tertangani dan berakhir lebih awal. |
| Dibatalkan    | Dibatalkan                                         | Node yang menunggu dibatalkan secara eksternal oleh administrator alur kerja, berakhir lebih awal. |
| Ditolak       | Ditolak                                            | Pada node pemrosesan manual, ditolak secara manual, dan alur selanjutnya tidak akan dilanjutkan. |

Dalam contoh [Memulai Cepat](../getting-started.md), kita sudah tahu bahwa dengan melihat detail riwayat eksekusi alur kerja, kita dapat memeriksa apakah semua node dieksekusi secara normal, serta status eksekusi dan data hasil dari setiap node yang telah dieksekusi. Dalam beberapa alur kerja dan node tingkat lanjut, sebuah node mungkin memiliki beberapa hasil, seperti hasil dari node perulangan:

![Hasil node dari beberapa eksekusi](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Tips}
Alur kerja dapat dipicu secara bersamaan, tetapi eksekusinya dilakukan secara berurutan dalam antrean. Meskipun beberapa alur kerja dipicu pada saat yang sama, mereka akan dieksekusi satu per satu, tidak secara paralel. Oleh karena itu, status "Dalam Antrean" berarti ada alur kerja lain yang sedang berjalan dan perlu menunggu.

Status "Berjalan" hanya menunjukkan bahwa rencana eksekusi telah dimulai dan biasanya dijeda karena status menunggu dari node internal. Ini tidak berarti bahwa rencana eksekusi ini telah mengambil alih sumber daya eksekusi di kepala antrean. Oleh karena itu, ketika ada rencana eksekusi "Berjalan", rencana eksekusi "Dalam Antrean" lainnya masih dapat dijadwalkan untuk dimulai.
:::

## Status Eksekusi Node

Status rencana eksekusi ditentukan oleh eksekusi setiap nodenya. Dalam sebuah rencana eksekusi setelah terpicu, setiap node akan menghasilkan status eksekusi setelah berjalan, dan status ini akan menentukan apakah alur selanjutnya akan berlanjut. Umumnya, setelah node berhasil dieksekusi, node berikutnya akan dieksekusi, hingga semua node selesai dieksekusi secara berurutan, atau terinterupsi. Ketika menemukan node terkait kontrol alur, seperti cabang, perulangan, paralel, tunda, dll., arah eksekusi node berikutnya ditentukan berdasarkan kondisi yang dikonfigurasi dalam node dan data konteks saat runtime.

Status yang mungkin dihasilkan oleh sebuah node setelah eksekusi adalah sebagai berikut:

| Status    | Apakah Status Akhir | Menghentikan Lebih Awal | Arti                                                               |
| --------- | :-----------------: | :-------------------: | ------------------------------------------------------------------ |
| Menunggu  |         Tidak       |          Tidak        | Node memerlukan jeda, menunggu masukan lebih lanjut atau panggilan balik untuk melanjutkan. |
| Selesai   |         Ya          |          Tidak        | Tidak ada masalah yang ditemui, eksekusi berhasil, dan berlanjut ke node berikutnya hingga selesai. |
| Gagal     |         Ya          |          Ya           | Gagal karena konfigurasi node tidak terpenuhi.                     |
| Error     |         Ya          |          Ya           | Node mengalami kesalahan program yang tidak tertangani dan berakhir lebih awal. |
| Dibatalkan|         Ya          |          Ya           | Node yang menunggu dibatalkan secara eksternal oleh administrator alur kerja, berakhir lebih awal. |
| Ditolak   |         Ya          |          Ya           | Pada node pemrosesan manual, ditolak secara manual, dan alur selanjutnya tidak akan dilanjutkan. |

Kecuali status "Menunggu", semua status lainnya adalah status akhir untuk eksekusi node. Hanya ketika status akhir adalah "Selesai" maka proses akan berlanjut; jika tidak, seluruh eksekusi alur kerja akan dihentikan lebih awal. Ketika sebuah node berada dalam alur cabang (cabang paralel, kondisi, perulangan, dll.), status akhir yang dihasilkan oleh eksekusi node akan ditangani oleh node yang memulai cabang tersebut, dan ini akan menentukan aliran seluruh alur kerja.

Sebagai contoh, ketika kita menggunakan node kondisi dalam mode "'Ya' untuk melanjutkan", jika hasilnya adalah "Tidak" selama eksekusi, seluruh alur kerja akan dihentikan lebih awal dengan status "Gagal", dan node selanjutnya tidak akan dieksekusi, seperti yang ditunjukkan pada gambar di bawah ini:

![Eksekusi node gagal](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Tips}
Semua status penghentian selain "Selesai" dapat dianggap sebagai kegagalan, tetapi alasan kegagalannya berbeda. Anda dapat melihat hasil eksekusi node untuk memahami lebih lanjut penyebab kegagalan tersebut.
:::