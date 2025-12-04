:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Alur Peristiwa

## Pendahuluan

Jika Anda ingin memicu tindakan kustom saat ada perubahan pada formulir, Anda dapat menggunakan alur peristiwa. Selain formulir, halaman, blok, tombol, dan bidang juga dapat menggunakan alur peristiwa untuk mengonfigurasi operasi kustom.

## Cara Penggunaan

Mari kita lihat contoh sederhana untuk memahami cara mengonfigurasi alur peristiwa. Kita akan membuat keterkaitan antara dua tabel, di mana mengklik baris pada tabel kiri akan secara otomatis memfilter data pada tabel kanan.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Langkah-langkah konfigurasi:

1. Klik ikon "petir" di sudut kanan atas blok tabel kiri untuk membuka antarmuka konfigurasi alur peristiwa.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klik "Tambahkan alur peristiwa (Add event flow)", pilih "Klik baris (Row click)" sebagai "Pemicu peristiwa (Trigger event)", yang berarti alur akan terpicu saat baris tabel diklik.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. "Kondisi pemicu (Trigger condition)" digunakan untuk mengonfigurasi kondisi. Alur peristiwa hanya akan terpicu jika kondisi ini terpenuhi. Dalam contoh ini, kita tidak perlu mengonfigurasi kondisi apa pun, sehingga alur akan terpicu pada setiap klik baris.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Arahkan kursor ke "Tambahkan langkah (Add step)" untuk menambahkan langkah-langkah operasi. Kita pilih "Atur cakupan data (Set data scope)" untuk mengonfigurasi cakupan data untuk tabel kanan.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Salin UID tabel kanan dan tempelkan ke kolom input "UID blok target (Target block UID)". Panel konfigurasi kondisi akan segera muncul di bawahnya, tempat Anda dapat mengonfigurasi cakupan data untuk tabel kanan.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Mari kita konfigurasikan kondisi seperti yang ditunjukkan di bawah ini:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Setelah mengonfigurasi cakupan data, Anda perlu me-refresh blok untuk menampilkan hasil yang difilter. Selanjutnya, mari kita konfigurasikan refresh blok tabel kanan. Tambahkan langkah "Refresh blok target (Refresh target blocks)", lalu masukkan UID tabel kanan.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Terakhir, klik tombol simpan di sudut kanan bawah untuk menyelesaikan konfigurasi.

## Jenis Peristiwa

### Sebelum Render (Before render)

Peristiwa universal yang dapat digunakan di halaman, blok, tombol, atau bidang. Gunakan peristiwa ini untuk tugas inisialisasi, seperti mengonfigurasi cakupan data yang berbeda berdasarkan kondisi yang berbeda.

### Klik Baris (Row click)

Peristiwa khusus blok tabel. Terpicu saat baris tabel diklik. Saat terpicu, ia akan menambahkan `Clicked row record` ke konteks, yang dapat digunakan sebagai variabel dalam kondisi dan langkah-langkah.

### Perubahan Nilai Formulir (Form values change)

Peristiwa khusus blok formulir. Terpicu saat nilai bidang formulir berubah. Anda dapat mengakses nilai formulir melalui variabel `Current form` dalam kondisi dan langkah-langkah.

### Klik (Click)

Peristiwa khusus tombol. Terpicu saat tombol diklik.

## Jenis Langkah

### Variabel Kustom (Custom variable)

Digunakan untuk mendefinisikan variabel kustom, lalu menggunakannya dalam konteks.

#### Cakupan

Variabel kustom memiliki cakupan. Misalnya, variabel yang didefinisikan dalam alur peristiwa suatu blok hanya dapat digunakan dalam blok tersebut. Jika Anda ingin variabel tersedia di semua blok pada halaman saat ini, Anda perlu mengonfigurasinya dalam alur peristiwa halaman.

#### Variabel Formulir (Form variable)

Menggunakan nilai dari blok formulir sebagai variabel. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Judul variabel
- Variable identifier: Pengidentifikasi variabel
- Form UID: UID Formulir

#### Variabel Lainnya

Jenis variabel lainnya akan didukung di masa mendatang. Nantikan pembaruannya.

### Atur Cakupan Data (Set data scope)

Mengatur cakupan data untuk blok target. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID blok target
- Condition: Kondisi filter

### Refresh Blok Target (Refresh target blocks)

Me-refresh blok target. Beberapa blok dapat dikonfigurasi. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID blok target

### Navigasi ke URL (Navigate to URL)

Melakukan navigasi ke URL tertentu. Konfigurasi spesifiknya adalah sebagai berikut:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL target, mendukung penggunaan variabel
- Search parameters: Parameter kueri dalam URL
- Open in new window: Jika dicentang, akan membuka halaman browser baru saat navigasi.

### Tampilkan Pesan (Show message)

Menampilkan pesan umpan balik operasi secara global.

#### Kapan Digunakan

- Dapat memberikan umpan balik seperti sukses, peringatan, dan kesalahan.
- Ditampilkan di tengah atas dan menghilang secara otomatis, ini adalah cara notifikasi ringan yang tidak mengganggu operasi pengguna.

#### Konfigurasi

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Jenis pesan
- Message content: Konten pesan
- Duration: Durasi tampilan (dalam detik)

### Tampilkan Notifikasi (Show notification)

Menampilkan notifikasi peringatan secara global.

#### Kapan Digunakan

Menampilkan notifikasi peringatan di empat sudut sistem. Sering digunakan untuk situasi berikut:

- Konten notifikasi yang lebih kompleks.
- Notifikasi interaktif yang memberikan poin tindakan selanjutnya kepada pengguna.
- Notifikasi yang didorong secara aktif oleh sistem.

#### Konfigurasi

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Jenis notifikasi
- Notification title: Judul notifikasi
- Notification description: Deskripsi notifikasi
- Placement: Posisi, pilihan: kiri atas, kanan atas, kiri bawah, kanan bawah

### Jalankan JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Menjalankan kode JavaScript.