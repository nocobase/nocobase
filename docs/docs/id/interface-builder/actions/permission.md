:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Izin Operasi

## Pendahuluan

Di NocoBase 2.0, izin operasi saat ini terutama dikendalikan oleh izin sumber daya koleksi:

- **Izin Sumber Daya Koleksi**: Digunakan untuk mengontrol secara seragam izin operasi dasar bagi berbagai peran terhadap sebuah koleksi, seperti Buat (Create), Lihat (View), Perbarui (Update), dan Hapus (Delete). Izin ini berlaku untuk seluruh koleksi di bawah sumber data, memastikan bahwa izin operasi yang sesuai untuk koleksi tersebut tetap konsisten bagi suatu peran di berbagai halaman, pop-up, dan blok.
<!-- - **Izin Operasi Independen**: Digunakan untuk kontrol yang lebih terperinci mengenai operasi mana yang terlihat oleh peran yang berbeda, cocok untuk mengelola izin untuk operasi tertentu seperti Memicu Alur Kerja, Permintaan Kustom, Tautan Eksternal, dll. Jenis izin ini cocok untuk kontrol izin tingkat operasi, memungkinkan peran yang berbeda untuk melakukan operasi tertentu tanpa memengaruhi konfigurasi izin seluruh koleksi. -->

### Izin Sumber Daya Koleksi

Dalam sistem izin NocoBase, izin operasi koleksi pada dasarnya dibagi berdasarkan dimensi CRUD untuk memastikan konsistensi dan standardisasi dalam manajemen izin. Contohnya:

- **Izin Buat (Create)**: Mengontrol semua operasi terkait pembuatan untuk koleksi, termasuk operasi tambah, operasi duplikasi, dll. Selama suatu peran memiliki izin buat untuk koleksi ini, maka operasi tambah, duplikasi, dan operasi terkait pembuatan lainnya akan terlihat di semua halaman dan pop-up.
- **Izin Hapus (Delete)**: Mengontrol operasi hapus untuk koleksi ini. Izin tetap konsisten, baik itu operasi hapus massal di blok tabel maupun operasi hapus untuk satu catatan di blok detail.
- **Izin Perbarui (Update)**: Mengontrol operasi jenis perbarui untuk koleksi ini, seperti operasi edit dan operasi perbarui catatan.
- **Izin Lihat (View)**: Mengontrol visibilitas data koleksi ini. Blok data terkait (Tabel, Daftar, Detail, dll.) hanya akan terlihat jika peran memiliki izin lihat untuk koleksi ini.

Metode manajemen izin universal ini cocok untuk kontrol izin data yang terstandardisasi, memastikan bahwa untuk `koleksi yang sama`, `operasi yang sama` memiliki aturan izin yang `konsisten` di `berbagai halaman, pop-up, dan blok`, sehingga memberikan keseragaman dan kemudahan pemeliharaan.

#### Izin Global

Izin operasi global berlaku untuk semua koleksi di bawah sumber data, dikategorikan berdasarkan jenis sumber daya sebagai berikut:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Izin Operasi Koleksi Spesifik

Izin operasi koleksi spesifik mengesampingkan izin umum dari sumber data, lebih lanjut menyempurnakan izin operasi dan memungkinkan konfigurasi izin kustom untuk mengakses sumber daya koleksi tertentu. Izin ini dibagi menjadi dua aspek:

1.  **Izin Operasi**: Izin operasi meliputi operasi tambah, lihat, edit, hapus, ekspor, dan impor. Izin ini dikonfigurasi berdasarkan dimensi cakupan data:
    *   **Semua data**: Memungkinkan pengguna untuk melakukan operasi pada semua catatan dalam koleksi.
    *   **Data sendiri**: Membatasi pengguna untuk melakukan operasi hanya pada catatan data yang mereka buat.

2.  **Izin Bidang**: Izin bidang memungkinkan konfigurasi izin untuk setiap bidang dalam operasi yang berbeda. Misalnya, beberapa bidang dapat dikonfigurasi agar hanya dapat dilihat dan tidak dapat diedit.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Izin Operasi Independen

> **Catatan**: Fitur ini didukung **mulai dari versi v1.6.0-beta.13**

Berbeda dengan izin operasi terpadu, izin operasi independen hanya mengontrol operasi itu sendiri, memungkinkan operasi yang sama memiliki konfigurasi izin yang berbeda di lokasi yang berbeda.

Metode izin ini cocok untuk operasi yang dipersonalisasi, misalnya:

Operasi pemicu alur kerja mungkin perlu memanggil alur kerja yang berbeda di halaman atau blok yang berbeda, sehingga memerlukan kontrol izin independen.
Operasi kustom di lokasi yang berbeda menjalankan logika bisnis tertentu dan cocok untuk manajemen izin terpisah.

Saat ini, izin independen dapat dikonfigurasi untuk operasi berikut:

- Pop-up (mengontrol visibilitas dan izin operasi tindakan pop-up)
- Tautan (membatasi apakah suatu peran dapat mengakses tautan eksternal atau internal)
- Pemicu alur kerja (untuk memanggil alur kerja yang berbeda di halaman yang berbeda)
- Operasi di panel operasi (misalnya, pindai kode, operasi pop-up, pemicu alur kerja, tautan eksternal)
- Permintaan kustom (mengirim permintaan ke pihak ketiga)

Melalui konfigurasi izin operasi independen, Anda dapat mengelola izin operasi berbagai peran dengan lebih terperinci, membuat kontrol izin lebih fleksibel.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Jika tidak ada peran yang diatur, secara default akan terlihat oleh semua peran.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## Dokumentasi Terkait

[Konfigurasi Izin]
<!-- (/users-and-permissions) -->