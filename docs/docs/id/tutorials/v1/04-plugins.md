# Bab 4: Plugin Tugas dan Komentar

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113532393752067&bvid=BV16XB2YqERC&cid=26937593203&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe

## Review Bab Sebelumnya

Teman-teman ingat tugas tantangan dari bab sebelumnya? Kita perlu mengonfigurasi field **Status** dan **Lampiran** untuk tabel tugas, dan menampilkannya di daftar tugas. Tenang, mari kita ungkap jawabannya!

1. **Konfigurasi Field Status**:
   - Pilih field [**Dropdown (Pilihan Tunggal)**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select), isi label opsi: **Belum Dimulai, Sedang Berjalan, Menunggu Review, Selesai, Dibatalkan, Diarsipkan**. Warna sesuai selera Anda dengan bebas, beri sedikit warna untuk tugas!

![Konfigurasi Field Status](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162341275.png)

2. **Konfigurasi Field Lampiran**:
   - Buat field [**Lampiran**](https://docs-cn.nocobase.com/handbook/file-manager/field-attachment) baru, beri nama, misalnya "Lampiran", klik submit, selesai dengan mudah.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162343470.png)

3. **Tampilkan Pembuat dan Status di Daftar Tugas**:
   - Pada Block tabel centang field "Pembuat", "Status", dan "Lampiran", agar daftar tugas menampilkan lebih banyak informasi kunci, menjadi lebih kaya.

![Field Tampilan Daftar Tugas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162344570.png)

4. **Tampilkan Field di Form Tambah dan Edit**:
   - Pada form popup, jangan lupa centang field status dan lampiran, agar baik saat menambah maupun edit tugas, dapat dengan nyaman melihat field-field ini.

![Field Tampilan di Form](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162345053.gif)

Bagus kan? Jangan terburu-buru, ulang operasi beberapa kali, Anda akan menemukan bahwa Anda secara bertahap menguasai cara penggunaan inti NocoBase. Setiap langkah operasi memberikan dasar yang kuat untuk manajemen tugas Anda selanjutnya, mari lanjutkan!

---

## 4.1 Konten Tugas dan Komentar: Interaksi Manajemen Tugas

Sampai saat ini, sistem manajemen tugas Anda sudah dapat menampung informasi tugas dasar. Namun, kita tahu bahwa manajemen tugas tidak hanya berupa beberapa baris deskripsi teks, terkadang kita membutuhkan konten yang lebih kaya, dan interaksi real-time antar anggota tim.

### 4.1.1 Markdown(Vditor): Membuat Konten Tugas Lebih Kaya

Anda mungkin sudah memperhatikan editor [**Rich Text**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/rich-text) dan [**Markdown**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/markdown) yang disediakan NocoBase, tetapi fiturnya mungkin belum cukup memuaskan Anda.
Editor Rich Text fiturnya relatif terbatas, editor Markdown meskipun praktis, tetapi tidak mendukung preview real-time.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162346447.png)

Lalu, apakah ada editor yang dapat preview real-time, dan mendukung fitur kaya? Jawabannya pasti ada! [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor) adalah editor teks paling kuat di NocoBase, mendukung preview real-time, upload gambar, bahkan rekaman suara. Selain itu, sudah bawaan dalam sistem, sepenuhnya gratis!

> **Pengenalan Plugin:** Plugin adalah salah satu fitur inti NocoBase, memungkinkan pengguna menambahkan fitur kustom atau mengintegrasikan layanan pihak ketiga sesuai kebutuhan proyek.
> Melalui ekstensi Plugin, dapat memperluas dan mengintegrasikan beberapa fitur yang nyaman atau tidak terduga, lebih memudahkan kreasi dan pengembangan Anda.

Selanjutnya saya akan membawa Anda langkah demi langkah membuka editor yang kuat ini, ingat Plugin Manager kita? Haha benar, ada di dalamnya.

> **Markdown(Vditor)**: Digunakan untuk menyimpan Markdown, dan menggunakan editor Vditor untuk render, mendukung sintaks Markdown umum seperti list, code, quote, dll., dan mendukung upload gambar, rekaman suara, dll. Sekaligus dapat melakukan render instan, WYSIWYG.

1. **Aktifkan Plugin Markdown(Vditor)**:
   - Buka **Plugin Manager** di pojok kanan atas, masukkan "markdown" untuk mencari Plugin, aktifkan [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor). Jangan khawatir halaman akan refresh sebentar, setelah beberapa detik akan kembali normal.

![Aktifkan Plugin Markdown](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162348237.png)

2. **Membuat Field Markdown**:

   - Kembali ke tabel tugas, klik "Buat Field", Markdown Pro Plus versi enhanced kita sudah muncul!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162349275.png)

- Beri nama, misalnya "Detail Tugas (task_detail)", centang semua fitur yang tersedia.

3. Anda mungkin memperhatikan opsi "Tabel Data File", apakah tidak memilih akan mempengaruhi fitur file? Tidak perlu khawatir, akan disimpan di ruang penyimpanan default kita, gunakan dengan tenang.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162350389.gif)

4. **Uji Field Markdown**:
   - Sekarang kembali ke halaman manajemen tugas, mulai tulis teks Markdown pertama Anda! Coba lagi paste gambar, atau upload file, bukankah terasa sangat kuat?

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162351380.gif)

Tabel tugas semakin kaya! Mengikuti setiap langkah, fitur sistem Anda secara bertahap diperluas, selanjutnya mari kita lihat bagaimana menyesuaikan tata letak field, agar antarmuka lebih menarik.

### 4.1.2 Menyesuaikan Tata Letak Field

Seiring bertambahnya field di tabel tugas, layout halaman mungkin terlihat agak berantakan, jangan khawatir, fleksibilitas NocoBase memungkinkan Anda dengan mudah menyesuaikan posisi field.

**Menyesuaikan Posisi Field**:

- Arahkan mouse ke ikon salib di pojok kanan atas field, klik dan drag field ke posisi yang diinginkan, lepaskan untuk menyelesaikan penyesuaian. Coba, layout halaman langsung lebih rapi!

![Menyesuaikan Posisi Field](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162352077.gif)

Setelah operasi seperti ini, layout halaman akan lebih sesuai dengan kebutuhan Anda. Selanjutnya, mari kita tambahkan fitur komentar untuk tabel tugas, agar interaksi tim lebih mudah.

## 4.2 Fitur Komentar

Hanya ada deskripsi tugas saja tidak cukup, terkadang kita juga perlu anggota tim menambahkan komentar untuk tugas, mendiskusikan masalah, mencatat feedback. Mari mulai mengimplementasikan.

### 4.2.1 Metode Pertama: Menggunakan Plugin Komentar

#### 4.2.1.1 Instalasi Plugin Komentar

> **Plugin Komentar (Plugin Komersial):** Menyediakan template tabel data komentar dan Block, menambahkan fitur komentar untuk data tabel data apa pun.
>
> Perhatikan saat menambahkan komentar perlu menghubungkan tabel data target melalui field relasi, untuk menghindari konflik data komentar

Pada [**Plugin Manager**](https://docs-cn.nocobase.com/handbook/plugin-manager), upload dan aktifkan **Plugin Komentar**. Setelah Plugin diaktifkan, di data source akan muncul opsi "Tabel Komentar" baru.
Klik tambah > Upload Plugin > Drag file kompresi > Submit
Cari komentar, Plugin komentar sudah muncul! Setelah diaktifkan masuk ke data source, terlihat opsi tabel komentar, instalasi berhasil!

![Instalasi Plugin Komentar](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162353550.gif)

#### 4.2.1.2 Membuat Tabel Komentar

Mari beralih ke data source, buat tabel data komentar **Tabel Komentar (Comments)**.

#### 4.2.1.3 Diskusi Hubungan Tabel Komentar dan Tabel Tugas

Kita telah membuat **Tabel Komentar (Comments)**, mungkin Anda berpikir: apakah dapat langsung menggambar area komentar di halaman? Jangan terburu-buru, mari kita pikir dulu, **setiap tugas memiliki area komentarnya sendiri**, dan komentar dengan tugas seharusnya **many-to-one**. Lalu bagaimana menghubungkan komentar dengan tugas?

**Benar! Inilah ["field relasi"](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations) yang akan kita gunakan selanjutnya!**

NocoBase memungkinkan kita melalui field relasi untuk membangun hubungan antar tabel di tingkat data, seperti membangun jembatan, menghubungkan data terkait dengan erat.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162355370.gif)

**Mengapa Memilih Hubungan Many-to-One?**

Mengapa kita memilih hubungan [**many-to-one**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), bukan [**one-to-many**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/o2m) atau tipe hubungan lainnya? Ingat kembali, **setiap tugas memiliki banyak komentar**, oleh karena itu, banyak komentar dapat menunjuk ke tugas yang sama. Dalam kasus ini, kita perlu membuat field **many-to-one** di tabel komentar, menunjuk ke tugas di tabel tugas.

> Anda yang cerdas mungkin sudah berpikir:
> Karena komentar dan tugas adalah hubungan many-to-one, apakah di tabel tugas dapat dibuat field **one-to-many**, untuk menunjuk ke tabel komentar?
> **Selamat, sepenuhnya benar!** One-to-many dan many-to-one adalah hubungan kebalikan satu sama lain, kita juga dapat membuat field one-to-many di tabel tugas, dihubungkan ke tabel komentar. Anda sungguh hebat!

#### 4.2.1.4 Mengatur Field Hubungan Many-to-One

Selanjutnya, kita akan membuat satu field many-to-one di tabel komentar, digunakan untuk menghubungkan dengan tabel tugas. Kita dapat menamai field ini **Tugas yang Dimiliki (belong_task)**. Saat pengaturan, ada beberapa konfigurasi kunci yang perlu diperhatikan:

1. **Tabel Sumber Data**: Dari mana kita memulai hubungan? Di sini dipilih **Tabel Komentar**.
2. **Tabel Data Target**: Tabel mana yang akan kita hubungkan? Di sini dipilih **Tabel Tugas**.

> **Foreign Key dan Identifier Field Tabel Data Target: Contoh:**
> Selanjutnya adalah bagian kunci: **Foreign Key** dan **Identifier Field Tabel Data Target**.
> Konsep ini terdengar agak rumit? Jangan khawatir, selanjutnya kita akan menggunakan contoh detail untuk membantu Anda memahaminya dengan mudah.
>
> **Bayangkan satu skenario**, anggap Anda memiliki banyak rapor ujian SMA, tugas kita adalah menemukan siswa yang sesuai untuk setiap rapor. Lalu bagaimana kita melakukannya?
> Kita mendapatkan satu rapor, di atasnya ada informasi berikut:
>
> - **Nama**: Bambang
> - **Kelas**: 12 IPA-15
> - **Nomor Peserta**: 202300000001
> - **Nomor KTP**: 111111111111
>   Sekarang, anggap Anda ingin menemukan siswa Bambang melalui **nama** dan **kelas**. Tetapi masalahnya — di sekolah yang sama, banyak siswa dengan nama yang sama, hanya kelas 12 IPA-15 saja ada **20 siswa bernama Bambang**! Hanya mengandalkan nama dan kelas, sulit memastikan secara tepat Bambang yang mana, kan?
>   **Saat ini, kita memerlukan identifier yang lebih unik untuk membantu kita mengidentifikasi**. Misalnya, **nomor peserta** adalah pilihan yang sangat bagus. Setiap siswa memiliki nomor peserta yang unik, melalui nomor peserta, kita dapat dengan tepat menemukan siswa yang sesuai dengan rapor. Contohnya, Anda mengirim query nomor peserta 202300000001, tidak lama kemudian, ada satu sekolah memberi balasan: "Rapor ini milik Bambang, kami siswa kelas 12 IPA-15 baris ke-3 yang berkacamata!"
>   **Logika yang sama**, kembali ke skenario desain hubungan **komentar**, apakah Anda terinspirasi: kita dapat memilih satu field identifier unik dari tabel tugas (seperti **id**), disimpan di komentar ini, untuk memastikan komentar milik tugas mana?
>   Inilah konsep inti realisasi hubungan many-to-one: **Foreign Key**, sederhana kan, hahaha

Di tabel komentar, kita simpan field id unik dari tabel tugas, kita beri nama **task_id**, dengan demikian dapat mengikat komentar dan tugas melalui task_id.

#### 4.2.1.5 Strategi Penanganan Foreign Key Saat Penghapusan

Di NocoBase, setelah mengatur hubungan many-to-one, perlu juga mempertimbangkan jika menghapus tugas, bagaimana data komentar harus diproses. Anda dapat memilih beberapa cara berikut:

- **CASCADE**: Jika Anda menghapus tugas, semua komentar yang terhubung dengan tugas ini juga akan dihapus bersamaan.
- **SET NULL** (pengaturan default): Saat tugas dihapus, data komentar akan dipertahankan, tetapi field foreign key yang terhubung akan dikosongkan.
- **RESTRICT dan NO ACTION**: Saat tugas memiliki komentar terkait, sistem akan mencegah Anda menghapus tugas ini, memastikan komentar tidak hilang.

#### 4.2.1.7 Membuat Hubungan Terbalik di Tabel Tugas

Akhirnya, kita centang "**Buat field hubungan terbalik di tabel data target**", digunakan untuk memudahkan kita melihat semua komentar terkait dari tugas. Ini membuat manajemen data lebih nyaman.

Di NocoBase, lokasi penyimpanan field relasi menentukan cara mendapatkan data, jadi jika kita ingin di tabel tugas juga dapat melihat data komentar yang sesuai, kita perlu membuat satu field hubungan **one-to-many** di tabel tugas, dihubungkan ke tabel komentar.

Saat Anda membuka tabel tugas lagi, sistem akan otomatis menghasilkan field komentar yang terhubung, dan menandai hubungan "**one-to-many**", dengan demikian Anda dapat dengan mudah melihat dan mengelola semua komentar yang terhubung!

## 4.3 Pembangunan Halaman

### 4.3.1 Mengaktifkan Tabel Komentar

Saat menegangkan dan menyenangkan tiba, kita kembali ke popup edit, buat Block tabel komentar, sekalian centang fitur yang dibutuhkan, selesai!

![demov3N-16.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162357118.gif)

### 4.3.2 Menyesuaikan Halaman

Mari kita percantik gaya halaman, arahkan mouse ke pojok kanan atas tombol edit, pilih popup yang lebih lebar. Gunakan pengetahuan yang baru dipelajari, drag Block komentar, letakkan di sebelah kanan popup, sempurna!

![demov3N-17.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162358300.gif)

Sekarang ada teman yang mungkin iri: saya juga ingin mengimplementasikan komentar! Jangan takut, saya juga sudah menyiapkan opsi gratis kedua untuk Anda.

### 4.2.2 Metode Kedua: Tabel Komentar Kustom

Jika Anda tidak membeli Plugin komentar, kita masih dapat mengimplementasikan fitur komentar serupa dengan membuat tabel biasa.

1. **Buat Tabel Komentar Baru**:

   - Buat **Tabel Komentar (comments2)**, tambahkan field **Konten Komentar (content)** (tipe Markdown) dan field **Tugas yang Dimiliki (belong_task)** (tipe many-to-one).
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170001040.gif)
2. **Membuat Block Daftar Komentar di Halaman**:

   - Pada popup edit tabel tugas, tambahkan satu [**Block List**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) (Block ketiga kita muncul, list dapat menampilkan informasi detail field), pilih komentar, uji:
     ![Buat Block Daftar Komentar](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170003544.gif)

## Ringkasan

Anda telah belajar bagaimana memperkaya konten tugas melalui Markdown(Vditor), dan menambahkan fitur komentar untuk tugas! Sistem manajemen tugas sudah memiliki dasar fitur yang lengkap, bukankah Anda merasa lebih dekat satu langkah untuk membangun alat manajemen tugas profesional?

Jangan lupa terus menjelajah dan beroperasi, NocoBase penuh dengan kemungkinan tak terbatas. Jika Anda menemui masalah, jangan panik, saya akan terus menemani Anda, membawa Anda melalui setiap langkah.

[Bab berikutnya (Bab 5: Tab Halaman & Block — View yang Kaya, Beragam dan Indah)](https://www.nocobase.com/cn/tutorials/task-tutorial-tabs-blocks), kita akan secara mendalam menjelajahi lebih banyak fitur Block NocoBase, membantu Anda meningkatkan sistem ke tingkat baru. Tetap semangat!

---

Lanjutkan menjelajah, salurkan kreativitas Anda! Jika menemui masalah, jangan lupa Anda dapat mengakses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi kapan saja.
