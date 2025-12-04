:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Formulir Filter

## Pengantar
Formulir filter memungkinkan pengguna untuk menyaring data dengan mengisi kolom formulir. Ini dapat digunakan untuk memfilter blok tabel, blok grafik, blok daftar, dan lainnya.

## Cara Menggunakan
Mari kita mulai dengan contoh sederhana untuk memahami cara menggunakan formulir filter dengan cepat. Misalkan kita memiliki blok tabel yang berisi informasi pengguna, dan kita ingin memfilter data menggunakan formulir filter, seperti ini:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Langkah-langkah konfigurasi:

1. Aktifkan mode konfigurasi, lalu tambahkan blok "Formulir filter" dan blok "Tabel" ke halaman.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Tambahkan kolom "Nama Panggilan" ke blok tabel dan blok formulir filter.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Sekarang Anda sudah bisa mulai menggunakannya.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Penggunaan Lanjutan
Blok formulir filter mendukung lebih banyak konfigurasi lanjutan. Berikut adalah beberapa kasus penggunaan umum.

### Menghubungkan Beberapa Blok
Satu kolom formulir dapat memfilter data di beberapa blok secara bersamaan. Berikut cara melakukannya:

1. Klik opsi konfigurasi "Connect fields" pada kolom.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Tambahkan blok target yang ingin Anda hubungkan. Dalam contoh ini, kita akan memilih blok daftar di halaman.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Pilih satu atau lebih kolom dari blok daftar untuk dihubungkan. Di sini kita memilih kolom "Nama Panggilan".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klik tombol simpan untuk menyelesaikan konfigurasi. Hasilnya terlihat seperti ini:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Menghubungkan Blok Grafik
Referensi: [Filter Halaman dan Keterkaitan](../../../data-visualization/guide/filters-and-linkage.md)

### Kolom Kustom
Selain memilih kolom dari tabel data, Anda juga dapat membuat kolom formulir menggunakan "Kolom kustom". Misalnya, Anda dapat membuat kolom pilihan *dropdown* dengan opsi kustom. Berikut cara melakukannya:

1. Klik opsi "Kolom kustom" untuk membuka panel konfigurasi.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Isi judul kolom, pilih "Select" sebagai model kolom, dan konfigurasikan opsinya.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Kolom kustom yang baru ditambahkan perlu dihubungkan secara manual ke kolom di blok target. Berikut cara melakukannya:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfigurasi selesai. Hasilnya terlihat seperti ini:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Model kolom yang saat ini didukung:

- Input: Input teks satu baris
- Number: Input numerik
- Date: Pemilih tanggal
- Select: *Dropdown* (dapat dikonfigurasi untuk pilihan tunggal atau ganda)
- Radio group: Tombol radio
- Checkbox group: Kotak centang

### Ciutkan
Tambahkan tombol ciutkan untuk menciutkan dan memperluas konten formulir filter, sehingga menghemat ruang halaman.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Konfigurasi yang didukung:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Baris yang diciutkan**: Mengatur berapa banyak baris kolom formulir yang ditampilkan dalam keadaan diciutkan.
- **Ciutkan secara *default***: Saat diaktifkan, formulir filter akan ditampilkan dalam keadaan diciutkan secara *default*.