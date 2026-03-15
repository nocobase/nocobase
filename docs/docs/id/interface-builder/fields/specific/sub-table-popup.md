:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/fields/specific/sub-table-popup).
:::

# Sub-tabel (Edit Pop-up)

## Pengantar

Sub-tabel (Edit Pop-up) digunakan untuk mengelola data asosiasi jamak (seperti One-to-Many atau Many-to-Many) di dalam formulir. Tabel ini hanya menampilkan rekaman yang telah dikaitkan. Penambahan atau pengeditan rekaman dilakukan di dalam jendela pop-up, dan data akan disimpan ke basis data secara kolektif saat formulir utama dikirimkan.

## Petunjuk Penggunaan

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Skenario Penggunaan:**

- Bidang asosiasi: o2m / m2m / mbm
- Penggunaan umum: Detail pesanan, daftar sub-item, label/anggota terkait, dll.

## Konfigurasi Bidang

### Izinkan memilih data yang sudah ada (Default: Aktif)

Mendukung pemilihan asosiasi dari rekaman yang sudah ada.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Komponen bidang

[Komponen bidang](/interface-builder/fields/association-field): Beralih ke komponen bidang relasi lainnya, seperti pilihan tunggal (Single select), pemilih koleksi (Collection selector), dll.

### Izinkan melepas tautan data yang sudah ada (Default: Aktif)

> Mengontrol apakah data terkait yang sudah ada dalam formulir edit diizinkan untuk dilepas tautannya. Data yang baru ditambahkan selalu diizinkan untuk dihapus.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Izinkan penambahan (Default: Aktif)

Mengontrol apakah tombol "Tambah" ditampilkan. Jika pengguna tidak memiliki izin `create` untuk koleksi target, tombol akan dinonaktifkan dengan keterangan "tidak ada izin".

### Izinkan edit cepat (Default: Nonaktif)

Saat diaktifkan, mengarahkan kursor ke sel akan memunculkan ikon edit, yang memungkinkan modifikasi cepat pada konten sel.

Anda dapat mengaktifkan edit cepat untuk semua bidang melalui pengaturan komponen bidang asosiasi.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Ini juga dapat diaktifkan untuk bidang kolom individual.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Ukuran halaman (Default: 10)

Mengatur jumlah rekaman yang ditampilkan per halaman dalam sub-tabel.

## Catatan Perilaku

- Saat memilih rekaman yang sudah ada, deduplikasi dilakukan berdasarkan kunci utama (primary key) untuk mencegah asosiasi ganda pada rekaman yang sama.
- Rekaman yang baru ditambahkan akan langsung dimasukkan kembali ke sub-tabel, dan tampilan secara otomatis berpindah ke halaman yang berisi rekaman baru tersebut.
- Pengeditan sebaris (inline edit) hanya mengubah data pada baris saat ini.
- Menghapus rekaman hanya akan melepas tautan asosiasi dalam formulir saat ini; hal ini tidak menghapus data sumber dari basis data.
- Data disimpan ke basis data hanya saat formulir utama dikirimkan.