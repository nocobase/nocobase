:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Koleksi Event

## Pendahuluan

Pemicu (trigger) dengan tipe **koleksi event** akan memantau event penambahan, penghapusan, dan pembaruan data pada sebuah **koleksi**. Ketika operasi data pada **koleksi** tersebut terjadi dan memenuhi kondisi yang telah dikonfigurasi, **alur kerja** yang sesuai akan terpicu. Contohnya, skenario seperti mengurangi stok produk setelah pesanan baru dibuat, atau menunggu tinjauan manual setelah komentar baru ditambahkan.

## Penggunaan Dasar

Ada beberapa kondisi perubahan pada **koleksi**:

1.  Setelah data dibuat.
2.  Setelah data diperbarui.
3.  Setelah data dibuat atau diperbarui.
4.  Setelah data dihapus.

![Koleksi Event_Pemilihan Waktu Pemicu](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Anda dapat memilih waktu pemicu berdasarkan kebutuhan bisnis yang berbeda. Ketika kondisi perubahan yang dipilih mencakup pembaruan **koleksi**, Anda juga dapat membatasi bidang (field) yang berubah. Kondisi pemicu hanya akan terpenuhi jika bidang yang dipilih berubah. Jika tidak ada bidang yang dipilih, berarti perubahan pada bidang apa pun dapat memicu **alur kerja**.

![Koleksi Event_Pilih Bidang yang Berubah](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Lebih lanjut, Anda dapat mengonfigurasi aturan kondisi untuk setiap bidang pada baris data yang memicu. Pemicu hanya akan aktif jika bidang-bidang tersebut memenuhi kondisi yang sesuai.

![Koleksi Event_Konfigurasi Kondisi Data](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Setelah **koleksi event** terpicu, baris data yang menghasilkan event akan disuntikkan ke dalam rencana eksekusi sebagai data konteks pemicu. Data ini kemudian dapat digunakan sebagai variabel oleh node-node selanjutnya dalam **alur kerja**. Namun, jika node selanjutnya ingin menggunakan bidang relasi dari data ini, Anda perlu mengonfigurasi *preloading* data relasi terlebih dahulu. Data relasi yang dipilih akan disuntikkan ke dalam konteks bersamaan dengan pemicu dan dapat dipilih serta digunakan secara hierarkis.

## Tips Terkait

### Pemicuan oleh Operasi Data Massal Saat Ini Belum Didukung

**Koleksi event** saat ini belum mendukung pemicuan oleh operasi data massal. Contohnya, ketika membuat data artikel dan secara bersamaan menambahkan beberapa data tag untuk artikel tersebut (data relasi satu-ke-banyak), hanya **alur kerja** untuk pembuatan artikel yang akan terpicu. Beberapa tag yang ditambahkan secara bersamaan tidak akan memicu **alur kerja** untuk pembuatan tag. Ketika mengasosiasikan atau menambahkan data relasi banyak-ke-banyak, **alur kerja** untuk **koleksi** perantara juga tidak akan terpicu.

### Operasi Data di Luar Aplikasi Tidak Akan Memicu Event

Operasi pada **koleksi** melalui panggilan HTTP API ke antarmuka aplikasi juga dapat memicu event yang sesuai. Namun, jika perubahan data dilakukan langsung melalui operasi basis data dan bukan melalui aplikasi NocoBase, event yang sesuai tidak dapat terpicu. Misalnya, pemicu (trigger) basis data bawaan tidak akan terkait dengan **alur kerja** di aplikasi.

Selain itu, menggunakan node operasi SQL untuk mengoperasikan basis data sama dengan mengoperasikan basis data secara langsung, dan ini juga tidak akan memicu **koleksi event**.

### Sumber Data Eksternal

**Alur kerja** telah mendukung **sumber data** eksternal sejak versi `0.20`. Jika Anda menggunakan **plugin sumber data** eksternal, dan **koleksi event** dikonfigurasi untuk **sumber data** eksternal, selama operasi data pada **sumber data** tersebut dilakukan di dalam aplikasi (seperti pembuatan, pembaruan oleh pengguna, dan operasi data **alur kerja**), **koleksi event** yang sesuai dapat terpicu. Namun, jika perubahan data dilakukan melalui sistem lain atau langsung di dalam basis data eksternal, **koleksi event** tidak dapat terpicu.

## Contoh

Mari kita ambil contoh skenario penghitungan total harga dan pengurangan stok setelah pesanan baru dibuat.

Pertama, kita membuat **koleksi** Produk dan **koleksi** Pesanan dengan model data sebagai berikut:

| Nama Bidang    | Tipe Bidang      |
| -------------- | ---------------- |
| Nama Produk    | Teks Satu Baris  |
| Harga          | Angka            |
| Stok           | Bilangan Bulat   |

| Nama Bidang    | Tipe Bidang          |
| -------------- | -------------------- |
| ID Pesanan     | Nomor Urut           |
| Produk Pesanan | Banyak-ke-Satu (Produk) |
| Total Pesanan  | Angka                |

Dan tambahkan beberapa data produk dasar:

| Nama Produk   | Harga | Stok |
| ------------- | ----- | ---- |
| iPhone 14 Pro | 7999  | 10   |
| iPhone 13 Pro | 5999  | 0    |

Kemudian, buat **alur kerja** berdasarkan **koleksi event** Pesanan:

![Koleksi Event_Contoh_Pemicu Pesanan Baru](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Berikut adalah beberapa opsi konfigurasi:

-   **Koleksi**: Pilih **koleksi** "Pesanan".
-   Waktu Pemicu: Pilih "Setelah data dibuat".
-   Kondisi Pemicu: Biarkan kosong.
-   *Preload* Data Relasi: Centang "Produk".

Selanjutnya, konfigurasikan node-node lain sesuai logika **alur kerja**: periksa apakah stok produk lebih besar dari 0. Jika ya, kurangi stok; jika tidak, pesanan tidak valid dan harus dihapus:

![Koleksi Event_Contoh_Orkestrasi Alur Kerja Pesanan Baru](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Konfigurasi node akan dijelaskan secara rinci dalam dokumentasi untuk tipe node tertentu.

Aktifkan **alur kerja** ini dan uji dengan membuat pesanan baru melalui antarmuka. Setelah memesan "iPhone 14 Pro", stok produk yang sesuai akan berkurang menjadi 9. Sedangkan jika memesan "iPhone 13 Pro", pesanan akan dihapus karena stok tidak mencukupi.

![Koleksi Event_Contoh_Hasil Eksekusi Pesanan Baru](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)