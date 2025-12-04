:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Basis Data Vektor

## Pendahuluan

Dalam basis pengetahuan, basis data vektor menyimpan dokumen basis pengetahuan yang telah di-vektorisasi. Dokumen yang di-vektorisasi ini berfungsi sebagai indeks untuk dokumen-dokumen tersebut.

Ketika pengambilan RAG diaktifkan dalam percakapan agen AI, pesan pengguna akan di-vektorisasi, dan fragmen dokumen basis pengetahuan akan diambil dari basis data vektor untuk mencocokkan paragraf dokumen yang relevan dan teks aslinya.

Saat ini, plugin Basis Pengetahuan AI hanya memiliki dukungan bawaan untuk PGVector, yang merupakan plugin basis data PostgreSQL.

## Manajemen Basis Data Vektor

Buka halaman konfigurasi plugin Agen AI, klik tab `Vector store`, lalu pilih `Vector database` untuk masuk ke halaman manajemen basis data vektor.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Klik tombol `Add new` di pojok kanan atas untuk menambahkan koneksi basis data vektor `PGVector` yang baru:

- Pada kolom input `Name`, masukkan nama koneksi.
- Pada kolom input `Host`, masukkan alamat IP basis data vektor.
- Pada kolom input `Port`, masukkan nomor port basis data vektor.
- Pada kolom input `Username`, masukkan nama pengguna basis data vektor.
- Pada kolom input `Password`, masukkan kata sandi basis data vektor.
- Pada kolom input `Database`, masukkan nama basis data.
- Pada kolom input `Table name`, masukkan nama tabel, yang akan digunakan saat membuat tabel baru untuk menyimpan data vektor.

Setelah memasukkan semua informasi yang diperlukan, klik tombol `Test` untuk menguji apakah layanan basis data vektor tersedia, lalu klik tombol `Submit` untuk menyimpan informasi koneksi.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)