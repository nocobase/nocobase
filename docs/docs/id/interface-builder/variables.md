:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Variabel

## Pengantar

Variabel adalah sekumpulan token yang digunakan untuk mengidentifikasi suatu nilai dalam konteks saat ini. Variabel dapat digunakan dalam berbagai skenario, seperti mengonfigurasi cakupan data blok, nilai default bidang, aturan keterkaitan, dan alur kerja.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Variabel yang Saat Ini Didukung

### Pengguna Saat Ini

Mewakili data pengguna yang sedang masuk (login).

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Peran Saat Ini

Mewakili identifikasi peran (nama peran) dari pengguna yang sedang masuk.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Formulir Saat Ini

Nilai-nilai dari formulir saat ini, hanya digunakan dalam blok formulir. Kasus penggunaannya meliputi:

- Aturan keterkaitan untuk formulir saat ini
- Nilai default untuk bidang formulir (hanya berlaku saat menambahkan data baru)
- Pengaturan cakupan data untuk bidang relasi
- Konfigurasi penugasan nilai bidang untuk aksi pengiriman

#### Aturan keterkaitan untuk formulir saat ini

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Nilai default untuk bidang formulir (hanya formulir tambah)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Pengaturan cakupan data untuk bidang relasi

Digunakan untuk menyaring opsi bidang hilir secara dinamis berdasarkan bidang hulu, memastikan entri data yang akurat.

**Contoh:**

1. Pengguna memilih nilai untuk bidang **Owner**.
2. Sistem secara otomatis menyaring opsi untuk bidang **Account** berdasarkan **userName** dari Owner yang dipilih.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Rekaman Saat Ini

Rekaman mengacu pada baris dalam sebuah koleksi, di mana setiap baris mewakili satu rekaman. Variabel "Rekaman Saat Ini" tersedia dalam **aturan keterkaitan untuk aksi baris** pada blok tipe tampilan.

Contoh: Nonaktifkan tombol hapus untuk dokumen yang "Sudah Dibayar".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Rekaman Pop-up Saat Ini

Aksi pop-up memainkan peran yang sangat penting dalam konfigurasi antarmuka NocoBase.

- Pop-up untuk aksi baris: Setiap pop-up memiliki variabel "Rekaman Pop-up Saat Ini", yang mewakili rekaman baris saat ini.
- Pop-up untuk bidang relasi: Setiap pop-up memiliki variabel "Rekaman Pop-up Saat Ini", yang mewakili rekaman relasi yang sedang diklik.

Blok di dalam pop-up dapat menggunakan variabel "Rekaman Pop-up Saat Ini". Kasus penggunaan terkait meliputi:

- Mengonfigurasi cakupan data sebuah blok
- Mengonfigurasi cakupan data bidang relasi
- Mengonfigurasi nilai default untuk bidang (dalam formulir untuk menambahkan data baru)
- Mengonfigurasi aturan keterkaitan untuk aksi

### Parameter Kueri URL

Variabel ini mewakili parameter kueri dalam URL halaman saat ini. Variabel ini hanya tersedia jika ada string kueri dalam URL halaman. Akan lebih mudah untuk menggunakannya bersama dengan [aksi Tautan](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### Token API

Nilai variabel ini adalah string, yang merupakan kredensial untuk mengakses API NocoBase. Ini dapat digunakan untuk memverifikasi identitas pengguna.

### Tipe Perangkat Saat Ini

Contoh: Jangan tampilkan aksi "Cetak template" pada perangkat non-desktop.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)