:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Aturan Keterkaitan Blok

## Pendahuluan

Aturan keterkaitan blok memungkinkan pengguna untuk mengontrol tampilan blok secara dinamis, mengelola presentasi elemen secara keseluruhan pada tingkat blok. Karena blok berfungsi sebagai wadah untuk bidang (field) dan tombol aksi, aturan ini memungkinkan pengguna untuk secara fleksibel mengontrol tampilan seluruh tampilan (view) dari dimensi blok.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Catatan**: Sebelum menjalankan aturan keterkaitan blok, tampilan blok harus terlebih dahulu melalui **pemeriksaan izin ACL**. Logika aturan keterkaitan blok hanya akan dievaluasi jika pengguna memiliki izin akses yang sesuai. Dengan kata lain, aturan keterkaitan blok hanya berlaku setelah persyaratan izin tampilan ACL terpenuhi. Jika tidak ada aturan keterkaitan blok, blok akan ditampilkan secara default.

### Mengontrol Blok dengan Variabel Global

**Aturan keterkaitan blok** mendukung penggunaan variabel global untuk mengontrol konten yang ditampilkan dalam blok secara dinamis, memungkinkan pengguna dengan peran dan izin berbeda untuk melihat dan berinteraksi dengan tampilan data yang disesuaikan. Sebagai contoh, dalam sistem manajemen pesanan, meskipun peran yang berbeda (seperti administrator, staf penjualan, dan personel keuangan, dll.) semuanya memiliki izin untuk melihat pesanan, bidang dan tombol aksi yang perlu dilihat oleh setiap peran mungkin berbeda. Dengan mengonfigurasi variabel global, Anda dapat secara fleksibel menyesuaikan bidang yang ditampilkan, tombol aksi, bahkan aturan pengurutan dan pemfilteran data berdasarkan peran pengguna, izin, atau kondisi lainnya.

#### Skenario Penggunaan Spesifik:

-   **Kontrol Peran dan Izin**: Mengontrol visibilitas atau kemampuan edit bidang tertentu berdasarkan izin peran yang berbeda. Misalnya, staf penjualan hanya dapat melihat informasi dasar pesanan, sementara personel keuangan dapat melihat detail pembayaran.
-   **Tampilan yang Dipersonalisasi**: Menyesuaikan tampilan blok yang berbeda untuk departemen atau tim yang berbeda, memastikan bahwa setiap pengguna hanya melihat konten yang relevan dengan pekerjaan mereka, sehingga meningkatkan efisiensi kerja.
-   **Manajemen Izin Aksi**: Mengontrol tampilan tombol aksi menggunakan variabel global. Misalnya, beberapa peran mungkin hanya dapat melihat data, sementara peran lain dapat melakukan aksi seperti memodifikasi atau menghapus.

### Mengontrol Blok dengan Variabel Kontekstual

Blok juga dapat dikontrol oleh variabel dalam konteks. Misalnya, Anda dapat menggunakan variabel kontekstual seperti "Catatan saat ini", "Formulir saat ini", dan "Catatan pop-up saat ini" untuk menampilkan atau menyembunyikan blok secara dinamis.

Contoh: Blok "Informasi Peluang Pesanan" hanya ditampilkan jika status pesanan adalah "Sudah Dibayar".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Untuk informasi lebih lanjut tentang aturan keterkaitan, lihat [Aturan Keterkaitan](/interface-builder/linkage-rule)