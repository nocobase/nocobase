# Bab 8: Knowledge Base - Tabel Pohon

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113815089907668&bvid=BV1mfcgeTE7H&cid=27830914731&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

### 8.1 Selamat Datang di Bab Baru

Pada bab ini, kita akan secara mendalam belajar bagaimana membangun knowledge base. Ini akan menjadi modul komprehensif yang membantu kita mengelola dan mengorganisir dokumen, tugas, dan informasi. Melalui mendesain dan membuat tabel dokumen dengan struktur pohon, kita akan merealisasikan manajemen efisien atas status, lampiran, dan tugas terkait dokumen.

### 8.2 Eksplorasi Awal Desain Database

#### 8.2.1 Desain Dasar dan Pembuatan Tabel Dokumen

Pertama, kita mulai dari desain database sederhana, membangun "Tabel Dokumen" untuk knowledge base untuk mencatat informasi semua dokumen. Tabel dokumen berisi field kunci berikut:

1. **Judul (Title)**: Ini adalah nama dokumen, menggunakan format teks satu baris.
2. **Konten (Content)**: Konten detail dokumen, menggunakan format teks multi-baris yang mendukung Markdown.
3. **Status Dokumen (Status)**: Digunakan untuk menandai status saat ini dokumen, termasuk empat opsi: Draft, Diterbitkan, Diarsipkan, dan Dihapus.
4. **Lampiran (Attachment)**: Dapat menambahkan lampiran seperti file dan gambar, memperkaya konten dokumen.
5. **Tugas Terkait (Related Task)**: Ini adalah field hubungan many-to-one, digunakan untuk mengaitkan dokumen dengan tugas tertentu, memudahkan referensi dokumen dalam manajemen tugas.

![](https://static-docs.nocobase.com/2412061730%E6%96%87%E6%A1%A3-%E4%BB%BB%E5%8A%A1er.svg)

Kita juga akan secara bertahap menambahkan field lain dalam sistem manajemen dokumen seiring perluasan fitur.

#### 8.2.2 Pembangunan Struktur Pohon dan Manajemen Direktori

> Tabel struktur pohon (disediakan oleh Plugin Tabel Pohon), struktur pohon, di mana setiap item data dapat memiliki satu atau lebih sub-item, dan sub-item ini dapat memiliki sub-item mereka sendiri.

Untuk memastikan organisasi dan hierarki dokumen, tabel dokumen kita memilih [**Tabel Struktur Pohon**](https://docs-cn.nocobase.com/handbook/collection-tree), yang memudahkan untuk merealisasikan manajemen klasifikasi hubungan parent-child. Saat membuat tabel struktur pohon, sistem secara otomatis menghasilkan field berikut:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190010004.png)

- **ID Parent Record**: Digunakan untuk mencatat dokumen level atas dari dokumen saat ini.
- **Parent Record**: Field many-to-one, membantu kita merealisasikan hubungan asosiasi parent-child.
- **Child Record**: Field one-to-many, memudahkan untuk melihat semua sub-dokumen di bawah satu dokumen.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011580.png)

Beberapa field ini digunakan untuk memelihara hierarki direktori tabel struktur pohon, jadi tidak disarankan untuk dimodifikasi.

Sekaligus kita perlu membuat hubungan asosiasi dengan tabel tugas [(many-to-one)](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), bawakan asosiasi terbalik, memudahkan kita saat membutuhkan, untuk membuat daftar dokumen di popup asosiasi tugas.

### 8.3 Membuat Halaman Manajemen Dokumen

#### 8.3.1 Membuat Menu Manajemen Dokumen Baru

Pada menu utama sistem, tambahkan halaman baru — "Manajemen Dokumen", dan pilih ikon yang sesuai. Kemudian, buat satu Block tabel untuk tabel dokumen kita. Pada Block tabel tambahkan operasi CRUD dasar, dan input beberapa data uji untuk menguji apakah desain tabel data normal.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011929.gif)

#### Latihan

1. Coba tambahkan satu dokumen parent bernama "Dokumen 1" di halaman manajemen dokumen.
2. Tambahkan satu sub-dokumen untuk "Dokumen 1", beri nama "Bab Pertama".

#### 8.3.2 Konversi ke View Tabel Pohon

Saya tahu Anda mungkin bingung, mengapa bukan struktur pohon direktori?

Secara default, Block tabel akan ditampilkan sebagai view tabel biasa, mari kita aktifkan secara manual:

1. Klik pojok kanan atas Block tabel > Tabel Pohon.

   Anda akan menemukan saat dicentang, di bawah tabel pohon muncul switch "Buka Semua".

   Sekaligus "Bab Pertama" yang baru dibuat menghilang.
2. Klik aktifkan opsi "Buka Semua" di bawah tabel pohon.

   Saat ini, kita akan melihat struktur parent-child dokumen ditampilkan lebih intuitif, dapat dengan mudah melihat dan membuka semua dokumen level.

   Kita lanjutkan menambahkan operasi "Tambah Sub-record".

Konversi tabel pohon berhasil!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012338.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012178.png)

### 8.3.3 Konfigurasi "Tambah Sub-record"

Mari kita gambar konten dasar yang dibutuhkan untuk menambah. Perhatikan saat ini jika kita centang field parent record, akan ditemukan defaultnya adalah status "Read-only (tidak dapat diedit)", karena kita secara default membuat di bawah dokumen saat ini.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012648.png)

Jika data tugas terlalu banyak, Anda mungkin merasa mengalokasikan tugas terkait sangat merepotkan, kita dapat mengatur nilai default untuk filter tugas, biarkan saja sama dengan tugas yang terkait dengan parent record.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012417.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013403.png)

Nilai default mungkin tidak langsung berlaku, kita tutup lalu klik untuk melihat, sudah otomatis terisi~

### 8.4 Mengonfigurasi Template Form dan Asosiasi Tugas

#### 8.4.1 Membuat [Template](https://docs-cn.nocobase.com/handbook/block-template) Tabel dan Form

Untuk memudahkan manajemen selanjutnya, kita akan [menyimpan sebagai template](https://docs-cn.nocobase.com/handbook/block-template) tabel, form pembuatan, dan edit dokumen, agar dapat digunakan kembali di halaman lain.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013599.png)

#### 8.4.2 Tampilan Duplikasi Block Tabel Dokumen

Pada popup lihat tabel tugas, tambahkan [tab](https://docs-cn.nocobase.com/manual/ui/pages) baru — "Dokumen". Pada tab ini, tambahkan Block form > Record lain > Tabel dokumen > "Duplikasi Template" > klik untuk memperkenalkan template form dokumen yang dibuat sebelumnya. (Pastikan memilih [**Duplikasi Template**](https://docs-cn.nocobase.com/handbook/block-template).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013140.png)

Cara ini memudahkan pembuatan semua daftar dokumen.

#### 8.4.3 Modifikasi Asosiasi Tugas

Karena kita mendupliasi template tabel eksternal, dan tidak dihubungkan dengan tabel tugas. Anda akan menemukan menampilkan semua data dokumen, tentu bukan efek yang kita harapkan.

Situasi seperti ini relatif umum, jika kita tidak membuat field hubungan yang sesuai, dan perlu menampilkan data terkait, kita perlu melakukan asosiasi manual antara keduanya. (Pastikan kita menggunakan [**Duplikasi Template**](https://docs-cn.nocobase.com/handbook/block-template), jangan pilih [Referensi Template](https://docs-cn.nocobase.com/handbook/block-template), jika tidak semua perubahan yang kita buat akan tersinkronisasi ke Block tabel lain!)

- Asosiasi Tampilan Data

Kita klik pojok kanan atas Block tabel, ["Atur Data Scope"](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/data-scope) menjadi:

【Tugas/ID】= 【Record Popup Saat Ini/ID】

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014372.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014983.gif)

Berhasil, dokumen yang tertinggal di tabel saat ini akan terikat dengan tugas kita.

- Asosiasi Block Form Tambah.

Masuk ke Block tambah:

Untuk field tabel tugas yang terkait, atur [Nilai Default](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/default-value) > 【Record Popup Atas】.

Popup atas adalah dalam operasi "Lihat" data tugas tempat kita berada, akan langsung mengikat data tugas yang sesuai.

Kita atur [Read-only (Mode Baca)](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/pattern), mewakili dalam popup saat ini, hanya dapat mengikat tugas saat ini.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014424.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014289.gif)

Selesai! Sekarang penambahan, tampilan akan menjadi dokumen yang terkait dengan tugas yang ada.

Anda yang teliti dapat melengkapi filter asosiasi di "Edit", "Tambah Sub-tugas".

Untuk membuat struktur pohon lebih jelas dan menonjol, kolom action lebih rapi dan menarik, kita pindahkan judul ke kolom pertama.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015378.png)

### 8.5 Filter dan Pencarian dalam Manajemen Dokumen

#### 8.5.1 Menambahkan [Block Filter](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)

Mari kita sekalian tambahkan fitur filter ke tabel dokumen.

- Tambahkan [Block Filter](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) di halaman manajemen dokumen.
- Pilih form dalam filter, drag ke paling atas.
- Centang field judul, status, tabel tugas, dll. sebagai kondisi filter.
- Tambahkan operasi "Filter" dan "Reset".

Form ini adalah kotak pencarian kita, memudahkan untuk dengan cepat menemukan dokumen terkait setelah memasukkan kata kunci.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015868.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015365.gif)

#### 8.5.2 [Hubungkan Block Data](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

Saat ini Anda akan menemukan setelah klik tidak ada efek, kita masih perlu langkah terakhir: menghubungkan antar Block yang memiliki fitur pencarian.

- Kita klik konfigurasi pojok kanan atas Block > [Hubungkan Block Data](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block).

  ```
  Di dalamnya disediakan Block yang dapat dihubungkan.

  Karena kita membuat form dokumen, jadi akan mencari semua Block data yang terkait dengan tabel dokumen (di halaman ini hanya ada satu), dan menampilkannya sebagai opsi.

  Tidak perlu khawatir tidak bisa membedakan, saat mouse digerakkan ke atasnya, view layar juga akan otomatis terfokus ke Block yang sesuai.
  ```
- Klik untuk mengaktifkan Block yang perlu dihubungkan, uji pencarian.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190016981.gif)

Dengan klik tombol konfigurasi pojok kanan atas Block filter, hubungkan Block filter dengan Block data utama tabel dokumen. Dengan demikian, setiap kali setelah mengatur kondisi di Block filter, Block tabel akan secara otomatis memperbarui hasil berdasarkan kondisi.

### 8.6 [Pengaturan Izin](https://docs-cn.nocobase.com/handbook/acl) Knowledge Base

Untuk memastikan keamanan dokumen dan standar manajemen, dapat mengalokasikan [izin](https://docs-cn.nocobase.com/handbook/acl) untuk knowledge base berdasarkan role. Pengguna role yang berbeda dapat berdasarkan konfigurasi izin, melakukan operasi lihat, edit, atau hapus pada dokumen.

Tetapi selanjutnya kita akan memodifikasi tabel dokumen, menambahkan fitur berita, pengumuman tugas, izin dapat dilonggarkan sedikit.

### 8.7 Ringkasan dan Langkah Selanjutnya

Pada bab ini, kita membuat knowledge base dasar, termasuk tabel dokumen, [struktur pohon](https://docs-cn.nocobase.com/handbook/collection-tree), dan tampilan asosiasi dengan tugas. Dengan menambahkan Block filter dan reuse template untuk dokumen, kita merealisasikan manajemen dokumen yang efisien.

Selanjutnya, kita akan masuk ke [bab berikutnya](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-1), belajar bagaimana membangun dashboard pribadi yang berisi [chart analisis data](https://docs-cn.nocobase.com/handbook/data-visualization), tampilan informasi penting!

---

Lanjutkan menjelajah, salurkan kreativitas Anda! Jika menemui masalah, jangan lupa kapan saja Anda dapat mengakses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi.
