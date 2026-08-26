# Bab 3: Manajemen Data Tugas

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113504258425496&bvid=BV1XvUxYREWx&cid=26827688969&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Sekarang kita telah menyusun kebutuhan sistem manajemen tugas, saatnya mulai praktik nyata! Ingat kembali, sistem manajemen tugas kita perlu dapat **[Tambah Baru](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [Edit](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit), [Hapus](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete)** tugas, dan **query daftar tugas**. Semua fitur ini dapat direalisasikan melalui halaman, Block, dan Action NocoBase.

> Akses dokumentasi resmi untuk melihat definisi detail [Menu](https://docs-cn.nocobase.com/handbook/ui/menus) dan [Halaman](https://docs-cn.nocobase.com/handbook/ui/pages).

### 3.1 Bagaimana Memulainya?

Anda mungkin masih ingat, sebelumnya kita telah memperkenalkan cara membuat halaman baru dan menampilkan daftar pengguna. Halaman-halaman ini seperti kanvas yang dapat menampung berbagai tipe Block, dan Anda dapat dengan bebas mengatur urutan dan ukurannya. Untuk memudahkan review langkah operasi:

1. [**Buat Halaman**](https://docs-cn.nocobase.com/handbook/ui/pages): Cukup klik beberapa kali untuk menyelesaikan pembuatan halaman.
   ![Buat Halaman](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333648.gif)
2. **Buat [Block Tabel](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)**: Setelah memilih Block tabel, Anda dapat menampilkan data yang berbeda.
   ![Buat Block Tabel](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333239.gif)

Kelihatan sangat sederhana, kan?
Tetapi, saat Anda membuka "Daftar Data", Anda akan menemukan bahwa di opsi default hanya ada dua tabel "Pengguna" dan "Role".
Lalu di mana tabel tugas? Jangan khawatir, jawabannya ada di fitur [**Data Source**](https://docs-cn.nocobase.com/handbook/data-source-manager) NocoBase.

> **Pengenalan Data Source:** Data source dapat berupa database, API, atau tipe penyimpanan data lainnya, mendukung koneksi ke berbagai database relasional, seperti MySQL, PostgreSQL, SQLite, MariaDB.
> NocoBase telah menyediakan **Plugin Manajemen Data Source**, yang digunakan untuk mengelola data source dan tabel data. Tetapi Plugin Manajemen Data Source hanya menyediakan antarmuka manajemen data source, tidak menyediakan kemampuan untuk terhubung ke data source, perlu dipasangkan dengan berbagai **Plugin Data Source**.

### 3.2 Data Source: Gudang Tabel Data Anda

![](https://static-docs.nocobase.com/20241009144356.png)

Di NocoBase, semua tabel data disimpan di [**Data Source**](https://docs-cn.nocobase.com/handbook/data-source-manager), data source seperti buku-buku, di dalamnya tertulis desain dan struktur setiap tabel data. Selanjutnya, mari tulis halaman baru milik kita: **Tabel Tugas**.

> [!NOTE] Note
> Jika Anda ingin mengetahui kemampuan lebih banyak dari data source dan tabel data, lihat [Manajemen Data Source](https://docs-cn.nocobase.com/handbook/data-source-manager) dan [Ikhtisar Tabel Data](https://docs-cn.nocobase.com/handbook/data-modeling/collection)

- **Masuk ke Pengaturan Data Source**:
  - Klik **Pengaturan** di pojok kanan atas > **Data Source** > **Konfigurasi Data Source Utama**.
  - Anda akan melihat semua tabel yang sudah ada di data source utama NocoBase, biasanya secara default hanya ada dua tabel "Pengguna" dan "Role".
    ![Konfigurasi Data Source](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334835.gif)

Sekarang, saatnya membuat tabel ketiga, yaitu **Tabel Tugas** kita. Ini akan menjadi pertama kalinya kita membuat tabel data di NocoBase, sungguh saat yang menggembirakan! Kita hanya perlu mengikuti desain sebelumnya, membuat tabel tugas sederhana yang berisi field berikut:

```
Tabel Tugas (Tasks):
        Nama Tugas (task_name) Teks Satu Baris
        Deskripsi Tugas (task_description) Teks Multi Baris
```

### 3.3 Membuat Tabel Tugas

1. **Buat Tabel Tugas**:

   - Klik "Buat Tabel Data" > Pilih **Tabel Data Biasa** > Isi **Nama Tabel Data** (seperti "Tabel Tugas") dan **Identifier Tabel Data** (seperti "tasks").
   - **Identifier Tabel Data** adalah ID unik tabel, disarankan menggunakan bahasa Inggris, angka, atau underscore untuk penamaan, memudahkan pencarian dan pemeliharaan selanjutnya.
   - Submit pembuatan.
     ![Buat Tabel Tugas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334006.gif)
2. **Penjelasan Field Default**:
   NocoBase akan menghasilkan field bawaan untuk setiap tabel data biasa:

   - **ID**: Identifier unik setiap record.
   - **Tanggal Pembuatan**: Otomatis mencatat waktu pembuatan tugas.
   - **Pembuat**: Otomatis mencatat pembuat tugas.
   - **Tanggal Modifikasi Terakhir** dan **Pengubah Terakhir**: Mencatat waktu dan pengguna setiap kali tugas dimodifikasi.

Field default ini persis yang kita butuhkan, menghemat banyak kerepotan menambah secara manual.

3. **Buat Field Kustom**:
   - **Nama Tugas**: Klik "Tambah Field" > Pilih **Teks Satu Baris** > Atur nama field menjadi "Nama Tugas", identifier field "task_name".
     ![Buat Field Nama Tugas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335943.gif)
   - **Deskripsi Tugas**: Buat lagi satu field **Teks Multi Baris**, identifier field "task_description".
     ![Buat Field Deskripsi Tugas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335521.gif)

Selamat! Sekarang **Tabel Tugas** kita sudah didefinisikan, Anda telah berhasil membuat struktur data tugas Anda sendiri. Selamat untuk Anda!

### 3.4 Membuat Halaman Manajemen Tugas

Sekarang kita sudah memiliki tabel tugas, selanjutnya menggunakan Block yang sesuai untuk menampilkannya di container halaman. Kita akan membuat **Halaman Manajemen Tugas** baru, dan menambahkan satu Block tabel yang menampilkan data tabel tugas.

1. **Buat Halaman Manajemen Tugas**:

   - Klik "Buat Halaman", beri nama "Manajemen Tugas".
   - Buat satu Block tugas, menampilkan data tabel tugas.
     ![Buat Block Tugas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162336833.gif)
2. **Tambahkan Data**:

   - "Eh, kenapa tidak ada data?" Jangan khawatir, sekarang kita akan menambahkannya!
   - Klik "Konfigurasi Action" di pojok kanan atas halaman, klik Action **"Tambah"**, Anda akan menemukan container popup kosong muncul.
     Action [Tambah](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [Edit](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) secara default akan terhubung ke popup.
   - Selanjutnya Block baru (form) muncul: Buat Block popup > Pilih **Tabel data saat ini**.
   - Tampilkan field nama tugas dan deskripsi, konfigurasi action submit, submit form selesai!
     ![Konfigurasi Action](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162337313.gif)
3. **Input Data**:

   - Input satu data uji, klik submit, berhasil! Data tugas telah ditambahkan.
     ![Submit Data](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338074.gif)

Saat yang menggembirakan! Anda berhasil menginput data tugas pertama, bukankah sangat sederhana?

### 3.5 Query dan Filter Tugas — Lokasi Tugas dengan Cepat

Saat tugas semakin banyak, bagaimana cepat menemukan tugas yang Anda inginkan? Saat itulah [**Action Filter**](https://docs-cn.nocobase.com/handbook/ui/actions/types/filter) berguna. Di NocoBase, Anda dapat dengan mudah menemukan tugas tertentu melalui konfigurasi kondisi action filter.

#### 3.5.1 Mengaktifkan Action Filter

Pertama, kita perlu mengaktifkan action filter:

- **Arahkan mouse ke "Konfigurasi Action"**, lalu klik **switch filter**, aktifkan filter.
  ![Aktifkan Filter](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338152.png)

#### 3.5.2 Menggunakan Kondisi Filter

Setelah mengaktifkan action filter, Anda akan melihat tombol filter muncul di halaman. Sekarang dapat menguji apakah action filter berlaku melalui **nama tugas**:

- Pada panel action filter pilih nama tugas, masukkan konten yang ingin Anda query.
- Klik "Submit", lihat apakah daftar tugas dengan benar menampilkan hasil setelah filter.
  ![Aktifkan Filter](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338495.gif)

#### 3.5.3 Menonaktifkan Action Filter

Jika Anda tidak lagi membutuhkan action filter, umumnya untuk action tipe switch, cukup tap sekali untuk membatalkan:

- **Reset kondisi filter**: Pastikan tidak ada kondisi filter yang sedang berlaku, klik tombol "Reset".
- Klik **switch "Filter"** lagi, filter akan disembunyikan dari halaman.
  ![Tutup Filter](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339299.gif)

Sesederhana itu! Action filter akan memberikan kemudahan besar untuk Anda mengelola banyak tugas, seiring kita semakin familiar dengan sistem, akan ada cara query yang fleksibel lainnya yang akan terungkap. (Anda dapat melihat [Block Form Filter](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) dan [Block Filter Collapse Panel](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/collapse))

Tetap semangat, mari lanjutkan!

### 3.6 Edit dan Hapus Tugas

Selain menambah dan query tugas, kita juga perlu dapat [**Edit**](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) dan [**Hapus**](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete) tugas. Anda sudah familiar dengan alur menambah Block, field, action, sekarang ini sangat sederhana:

1. **Edit Tugas**:

   - Pada konfigurasi daftar tugas tambahkan action **Edit**, klik edit > Tambah Block form (edit) > Pilih field yang perlu diedit.
2. **Hapus Tugas**:

   - Demikian juga, di konfigurasi kolom action buka switch action **Hapus**, setelah tombol hapus muncul, klik hapus > konfirmasi, tugas akan dihapus dari daftar.
     ![Edit Tugas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339672.gif)

Sampai sini, operasi **CRUD** daftar tugas semuanya telah direalisasikan.

Hebat! Anda berhasil menyelesaikan langkah ini!

### Tugas Tantangan

Setelah Anda semakin mahir mengoperasikan NocoBase, mari coba satu tantangan kecil: kita perlu menandai status tugas, dan agar mendukung upload lampiran, bagaimana melakukannya?

Tips:

- Untuk tabel tugas kita tambahkan:
  1. Field "**Status (status)**", sebagai dropdown pilihan tunggal, berisi opsi: **Belum Dimulai, Sedang Berjalan, Menunggu Review, Selesai, Dibatalkan, Diarsipkan**.
  2. Field "**Lampiran (attachment)**".
- Pada Block Tabel Tugas, form "Tambah" dan "Edit", tampilkan field "Status", "Lampiran".

Apakah Anda sudah memiliki ide? Jangan terburu-buru, [Bab berikutnya (Bab 4: Plugin Tugas dan Komentar — Seperti Macan Bersayap, Lancar Menguasai)](https://www.nocobase.com/cn/tutorials/task-tutorial-plugin-use) akan mengungkap jawabannya, mari kita nantikan!

---

Lanjutkan menjelajah, salurkan kreativitas Anda! Jika menemui masalah, jangan lupa Anda dapat mengakses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi kapan saja.
