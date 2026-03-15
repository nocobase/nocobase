:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/blocks/filter-blocks/form).
:::

# Formulir Saring

## Pengantar

Formulir saring memungkinkan pengguna untuk menyaring data dengan mengisi bidang formulir. Ini dapat digunakan untuk menyaring blok tabel, blok grafik, blok daftar, dan lainnya.

## Cara Penggunaan

Mari kita pahami cara penggunaan formulir saring dengan cepat melalui contoh sederhana. Misalkan kita memiliki sebuah blok tabel yang berisi informasi pengguna, dan kita ingin menyaring data melalui formulir saring. Seperti di bawah ini:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Langkah-langkah konfigurasi adalah sebagai berikut:

1. Aktifkan mode konfigurasi, tambahkan sebuah blok "Formulir saring" dan sebuah "Blok tabel" di halaman.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Tambahkan bidang "Nama Panggilan" di blok tabel dan blok formulir saring.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Sekarang sudah dapat mulai digunakan.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Penggunaan Lanjutan

Blok formulir saring mendukung lebih banyak konfigurasi tingkat lanjut, berikut adalah beberapa penggunaan umum.

### Menghubungkan Beberapa Blok

Satu bidang formulir dapat menyaring data dari beberapa blok secara bersamaan. Operasi spesifiknya adalah sebagai berikut:

1. Klik item konfigurasi "Connect fields" pada bidang.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Tambahkan blok target yang perlu dihubungkan, di sini kita memilih blok daftar di halaman.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Pilih satu atau lebih bidang dalam blok daftar untuk dihubungkan. Di sini kita memilih bidang "Nama Panggilan".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klik tombol simpan untuk menyelesaikan konfigurasi, hasilnya adalah sebagai berikut:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Menghubungkan Blok Grafik

Referensi: [Filter Halaman dan Keterkaitan](../../../data-visualization/guide/filters-and-linkage.md)

### Bidang Kustom

Selain memilih bidang dari koleksi (collection), Anda juga dapat membuat bidang formulir melalui "Bidang kustom". Misalnya, Anda dapat membuat bidang kotak pilihan tunggal drop-down dan menyesuaikan opsinya. Operasi spesifiknya adalah sebagai berikut:

1. Klik opsi "Bidang kustom", antarmuka konfigurasi akan muncul.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Isi judul bidang, pilih "Pilihan" dalam "Tipe bidang", dan konfigurasikan opsi.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Bidang kustom yang baru ditambahkan perlu dihubungkan secara manual ke bidang blok target, metodenya adalah sebagai berikut:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfigurasi selesai, hasilnya adalah sebagai berikut:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Tipe bidang yang didukung saat ini adalah:

- Kotak teks (Single line text)
- Angka (Number)
- Tanggal (Date)
- Pilihan (Single select)
- Kotak pilihan tunggal (Radio group)
- Kotak centang (Checkbox group)
- Rekaman terkait (Association)

#### Rekaman Terkait (Bidang Relasi Kustom)

"Rekaman terkait" cocok untuk skenario "menyaring berdasarkan rekaman tabel terkait". Misalnya, dalam daftar pesanan, menyaring pesanan berdasarkan "Pelanggan", atau dalam daftar tugas menyaring tugas berdasarkan "Penanggung jawab".

Penjelasan item konfigurasi:

- **Tabel data target (Koleksi)**: Menunjukkan dari koleksi mana rekaman opsional akan dimuat.
- **Bidang judul**: Digunakan untuk teks tampilan pada opsi drop-down dan label yang dipilih (seperti nama, judul).
- **Bidang nilai**: Digunakan untuk nilai yang dikirimkan saat penyaringan aktual, biasanya memilih bidang kunci utama (seperti `id`).
- **Izinkan pilihan ganda**: Setelah diaktifkan, beberapa rekaman dapat dipilih sekaligus.
- **Operator**: Menentukan bagaimana kondisi penyaringan dicocokkan (lihat penjelasan "Operator" di bawah).

Konfigurasi yang direkomendasikan:

1. Pilih bidang dengan keterbacaan tinggi untuk `Bidang judul` (seperti "Nama"), hindari penggunaan ID murni yang memengaruhi kegunaan.
2. Prioritaskan bidang kunci utama untuk `Bidang nilai`, untuk memastikan penyaringan yang stabil dan unik.
3. Skenario pilihan tunggal biasanya menonaktifkan `Izinkan pilihan ganda`, skenario pilihan ganda mengaktifkan `Izinkan pilihan ganda` dan bekerja sama dengan `Operator` yang sesuai.

#### Operator

`Operator` digunakan untuk menentukan hubungan pencocokan antara "nilai bidang formulir saring" dan "nilai bidang blok target".

### Lipat

Tambahkan sebuah tombol lipat untuk melipat dan memperluas konten formulir saring, sehingga menghemat ruang halaman.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Mendukung konfigurasi berikut:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Jumlah baris yang ditampilkan saat dilipat**: Mengatur jumlah baris bidang formulir yang ditampilkan dalam keadaan dilipat.
- **Lipat secara default**: Setelah diaktifkan, formulir saring akan ditampilkan dalam keadaan dilipat secara default.