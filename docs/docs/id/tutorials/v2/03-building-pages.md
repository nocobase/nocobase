# Bab 3: Membangun Halaman — Dari Kosong ke Bisa Dipakai

Pada bab sebelumnya kita telah membangun kerangka tabel data, tetapi sekarang data hanya ada di "backend" — pengguna tidak bisa melihatnya sama sekali. Pada bab ini, kita akan **menampilkan data**: membuat [Block tabel](/interface-builder/blocks/data-blocks/table) untuk menampilkan data tiket, mengonfigurasi tampilan field, sorting, [filter](/interface-builder/blocks/filter-blocks/form), dan paginasi, agar menjadi daftar tiket yang benar-benar bisa digunakan.

## 3.1 Apa itu Block

Di NocoBase, **Block** adalah "balok" pada halaman. Ingin menampilkan tabel? Letakkan satu [Block tabel](/interface-builder/blocks/data-blocks/table). Ingin menampilkan form? Letakkan satu Block form. Sebuah halaman dapat dengan bebas menggabungkan beberapa Block, dan dapat di-drag untuk mengatur layout.

Tipe Block yang umum:

| Tipe | Kegunaan |
|------|------|
| Tabel (Table) | Menampilkan banyak data dalam bentuk baris dan kolom |
| Form | Memungkinkan pengguna untuk menginput atau mengedit data |
| Detail (Details) | Menampilkan informasi lengkap dari satu record |
| Filter Form (Filter Form) | Menyediakan kondisi filter, memfilter data Block lainnya |
| Chart | Tampilan visualisasi seperti pie chart, line chart, dll. |
| Markdown | Meletakkan teks atau penjelasan kustom |

Ingat analogi ini: **Block = balok**, kita selanjutnya akan menggunakan balok untuk membangun halaman manajemen tiket.

## 3.2 Menambahkan Menu dan Halaman

Pertama, kita perlu membuat entry point "Manajemen Tiket" di sistem.

1. Klik switch **UI Editor** di pojok kanan atas, masuk ke [mode konfigurasi](/get-started/how-nocobase-works) antarmuka (seluruh halaman akan menampilkan border oranye yang dapat diedit).
2. Arahkan mouse ke tombol **"Tambah menu (Add menu item)"** di bilah navigasi atas, pilih **"Tambah grup (Add group)"**, beri nama **"Manajemen Tiket"**.

![03-building-pages-2026-03-12-09-38-36](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-38-36.png)


3. Bilah navigasi atas akan langsung menampilkan menu "Manajemen Tiket". **Klik menu tersebut**, panel menu grup akan terbuka di sebelah kiri.
4. Pada panel menu kiri, klik tombol oranye **"Tambah menu (Add menu item)"**, pilih **"Halaman versi baru (v2) (Modern page (v2))"**, tambahkan dua sub-halaman secara berurutan:
   - **Daftar Tiket** — menampilkan semua tiket
   - **Kategori Tiket** — mengelola data kategori

![03-building-pages-2026-03-12-09-41-26](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-41-26.png)

> **Perhatian**: Saat menambahkan halaman akan terlihat dua opsi "Halaman versi lama (v1)" dan "Halaman versi baru (v2)", tutorial ini secara konsisten menggunakan **v2**.

## 3.3 Menambahkan Block Tabel

Sekarang masuk ke halaman "Daftar Tiket", tambahkan Block tabel:

1. Pada halaman kosong, klik **"Buat Block (Add block)"**.
2. Pilih **Block Data → Tabel**.
3. Pada list tabel data yang muncul, pilih **"Tiket"** (yaitu tabel tickets yang dibuat di bab sebelumnya).

![03-building-pages-2026-03-13-08-44-07](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-07.png)

Setelah Block tabel berhasil ditambahkan, akan muncul tabel kosong di halaman.

![03-building-pages-2026-03-13-08-44-29](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-29.png)

Tabel kosong tanpa data tidak nyaman untuk debugging, mari kita tambahkan tombol baru dengan cepat untuk memasukkan beberapa data uji:

1. Klik **"Konfigurasi Action (Configure actions)"** di pojok kanan atas tabel, centang **"Tambah baru (Add new)"**.

![03-building-pages-2026-03-17-14-58-39](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-58-39.png)

2. Klik tombol **"Tambah baru"** yang baru muncul, di popup pilih **Tambah Block (Add block) → Form (Tambah Baru) (Form (Add New)) → Tabel saat ini (Current collection)**.

![03-building-pages-2026-03-17-14-59-42](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-59-42.png)

3. Pada popup klik **"Konfigurasi field (Configure fields)"**, centang field judul, status, prioritas, dll.; klik **"Konfigurasi Action (Configure actions)"**, aktifkan tombol **"Submit"**.

![03-building-pages-2026-03-17-15-00-54](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-00-54.png)

![03-building-pages-2026-03-17-15-01-49](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-01-49.png)

4. Isi beberapa data tiket sembarang dan submit, tabel akan menampilkan kontennya.

![03-building-pages-2026-03-17-15-03-04](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-03-04.png)

> Konfigurasi detail form (linkage field, edit form, popup detail, dll.) akan dibahas lebih dalam pada [Bab 4](/tutorials/v2/04-forms-and-details), di sini cukup bisa input data saja.

## 3.4 Mengonfigurasi Kolom Tampilan

Secara default, tabel tidak menampilkan semua field secara otomatis, kita perlu memilih kolom yang akan ditampilkan secara manual:

1. Pada bagian kanan header tabel, klik **"[Field](/data-sources/data-modeling/collection-fields) (Fields)"**.
2. Centang field yang perlu ditampilkan:
   - **Judul** — topik tiket, langsung terlihat
   - **Status** — progress saat ini
   - **Prioritas** — tingkat urgensi
   - **Kategori** — field asosiasi, akan menampilkan nama kategori
   - **Pengirim** — siapa yang mengirim tiket
   - **Penangani** — siapa yang menangani
3. Field yang tidak perlu ditampilkan (seperti ID, waktu pembuatan) tidak dicentang, agar tabel tetap bersih.

![03-building-pages-2026-03-13-08-47-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-47-18.png)

> **Tips**: Urutan tampilan field dapat diatur dengan drag. Letakkan "Judul" dan "Status" yang paling penting di depan untuk memudahkan melihat informasi kunci sekilas.

### Masalah Field Asosiasi Menampilkan ID

Setelah mencentang "Kategori", Anda akan menemukan tabel menampilkan ID kategori (angka), bukan nama. Ini karena field asosiasi secara default menggunakan ID sebagai field judul. Ada dua cara untuk memperbaikinya:

**Cara Pertama: Modifikasi pada konfigurasi kolom tabel (hanya berlaku untuk tabel saat ini)**

Klik konfigurasi kolom "Kategori", temukan **"Field Judul (Title field)"**, ubah dari ID menjadi **Nama**. Cara ini hanya mempengaruhi Block tabel saat ini.

![03-building-pages-2026-03-13-09-23-03](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-03.png)

![03-building-pages-2026-03-13-09-57-40](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-57-40.gif)

**Cara Kedua: Modifikasi di data source (berlaku global, direkomendasikan)**

Masuk ke **Pengaturan → [Data Source](/data-sources) → [Tabel Data](/data-sources/data-modeling/collection) → Tabel Kategori**, ubah **"Field Judul"** menjadi **Nama**. Dengan demikian semua tempat yang merefer ke tabel kategori akan secara default menampilkan nama, sekali untuk semua. Setelah modifikasi, perlu kembali ke halaman dan menambahkan field tersebut kembali agar berlaku.
![03-building-pages-2026-03-13-09-23-41](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-41.png)

## 3.5 Menambahkan Filter dan Sorting

Saat tiket semakin banyak, kita perlu cepat menemukan tiket tertentu. NocoBase menyediakan beberapa cara, kita perkenalkan yang paling sering digunakan terlebih dahulu yaitu **Block Filter Form**.

### Menambahkan Filter Form

1. Pada halaman daftar tiket, klik **"Buat Block"**, pilih **Block Filter → Filter Form**.
2. Pada halaman v2 tidak perlu memilih tabel data — filter form akan langsung ditambahkan ke halaman.
3. Pada filter form, klik **"Field (Fields)"**, akan menampilkan list semua Block data yang dapat difilter di halaman saat ini, contohnya `Table: Tiket #c48b` (kode di belakang adalah UID Block, digunakan untuk membedakan beberapa Block dari tabel yang sama).

![03-building-pages-2026-03-13-08-48-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-48-37.png)

4. Arahkan mouse ke nama Block, akan menampilkan list field yang dapat difilter dari Block tersebut. Klik field untuk menambahkannya sebagai item filter: **Status**, **Prioritas**, **Kategori**.

![03-building-pages-2026-03-13-09-25-44](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-25-44.png)

5. Setelah ditambahkan, pengguna dapat menginput kondisi pada filter form, dan data tabel akan **otomatis difilter secara real-time**.

![03-building-pages-2026-03-13-10-00-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-10-00-25.gif)

### Pencarian Fuzzy Multi-field

Bagaimana jika kita ingin mencari beberapa field sekaligus melalui satu kolom pencarian?

Klik konfigurasi di pojok kanan atas field pencarian, akan terlihat opsi **"Connect fields"**. Setelah dibuka akan menampilkan field yang dapat diasosiasikan untuk pencarian di setiap Block — Anda akan menemukan secara default hanya "Judul" yang terhubung.
![03-building-pages-2026-03-13-09-30-06](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-30-06.png)

Kita dapat memilih lebih banyak field, seperti: **Deskripsi**, sehingga saat pengguna menginput keyword akan mencari di field-field ini juga.

Bahkan dapat memfilter melalui field objek asosiasi — klik "Kategori", pada opsi level berikutnya centang "Nama Kategori", saat pencarian juga akan mencocokkan nama kategori.

![03-building-pages-2026-03-13-09-31-35](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-31-35.png)
![03-building-pages-2026-03-13-09-32-20](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-32-20.png)

> **Connect fields sangat kuat**: dapat berlaku lintas beberapa Block dan beberapa field. Jika halaman memiliki beberapa Block data, coba buat Block baru sendiri untuk melihat efeknya!

### Tidak Ingin Auto-Filter?

Jika ingin filter dipicu setelah pengguna mengklik tombol, klik **"[Action](/interface-builder/actions) (Actions)"** di pojok kanan bawah filter form, centang tombol **"Filter"** dan **"Reset"**. Dengan demikian setelah pengguna mengisi kondisi perlu klik manual untuk mengeksekusi filter.
![03-building-pages-2026-03-13-09-33-15](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-33-15.png)

### Cara Filter Lain: Action Filter Bawaan Tabel

Selain Block filter form independen, Block tabel sendiri juga memiliki tombol Action **"Filter"** bawaan. Pada bagian atas Block tabel klik **"Action (Actions)"**, centang **"Filter"**, toolbar tabel akan menampilkan tombol filter. Setelah diklik akan muncul panel kondisi, pengguna dapat langsung memfilter data berdasarkan kondisi field.
![03-building-pages-2026-03-13-09-34-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-34-25.png)
![03-building-pages-2026-03-13-09-36-09](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-36-09.png)

Jika tidak ingin setiap kali membuka tombol filter lalu mencari field secara manual, Anda dapat menetapkan field filter default di konfigurasi tombol filter, sehingga pengguna saat membuka langsung dapat melihat kondisi filter yang sering digunakan.
![03-building-pages-2026-03-13-09-38-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-38-37.png)

> **Perhatian**: Action filter bawaan tabel saat ini **tidak mendukung pencarian fuzzy multi-field**. Jika perlu pencarian multi-field, gunakan Block filter form di atas yang dikombinasikan dengan fitur "connect fields".

### Menetapkan Sorting Default

Kita ingin tiket terbaru ditampilkan paling atas:

1. Klik **Pengaturan Block** (ikon tiga garis horizontal) di pojok kanan atas Block tabel.
2. Temukan **"Atur aturan [sorting](/interface-builder/blocks/data-blocks/table)"**.
3. Tambahkan field sorting: pilih **Waktu Pembuatan**, metode sorting pilih **Descending**.

![03-building-pages-2026-03-13-09-40-54](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-40-54.png)

Dengan demikian, tiket yang baru dikirim selalu di paling atas, lebih nyaman untuk diproses.

## 3.6 Mengonfigurasi Action Baris

Hanya melihat list saja tidak cukup, kita juga perlu bisa klik untuk melihat detail tiket dan mengedit tiket.

1. Pada bagian atas kolom Action, klik tombol "+" kedua.
2. Klik Action: **Lihat**, **[Edit](/interface-builder/actions/edit)**, **[Hapus](/interface-builder/actions/delete)**.
3. Setiap baris kolom Action data akan muncul tombol "Lihat", "Edit", dan "Hapus".

![03-building-pages-2026-03-13-09-42-42](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-42-42.png)

Klik tombol "Lihat" akan membuka drawer, di dalamnya dapat menempatkan Block detail untuk menampilkan informasi lengkap. Kita akan mengonfigurasinya secara detail di bab berikutnya.
Klik "Hapus", baris data ini akan dibersihkan.

## 3.7 Menyesuaikan Layout Halaman

Sampai saat ini, halaman sudah memiliki dua Block yaitu filter form dan tabel, tetapi secara default mereka bertumpuk vertikal, mungkin terlihat kurang menarik. NocoBase mendukung **drag** untuk menyesuaikan posisi dan layout Block.

Pada mode konfigurasi, arahkan mouse ke handle drag di pojok kiri atas Block (kursor akan berubah menjadi panah salib), tahan dan drag.

**Drag filter form ke atas tabel**: tahan Block filter form, pindahkan ke tepi atas Block tabel, setelah muncul garis biru lepas, filter form akan berada di atas tabel.

![03-building-pages-2026-03-13-11-50-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-18.gif)

**Drag field filter ke baris yang sama**: di dalam filter form, field secara default juga tersusun vertikal. Drag "Prioritas" ke sebelah kanan "Status", setelah muncul garis vertikal lepas, kedua field akan berdampingan di baris yang sama, menghemat ruang vertikal.

![03-building-pages-2026-03-13-11-50-58](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-58.gif)

> Hampir semua elemen di NocoBase mendukung drag — tombol Action, kolom tabel, item menu, dan lainnya, silakan eksplorasi sendiri!

## 3.8 Mengonfigurasi Halaman Kategori Tiket

Jangan lupa kita membuat sub-halaman "Kategori Tiket" di Bagian 3.2, sekarang kita akan menambahkan kontennya. Alur konfigurasi mirip dengan daftar tiket — menambahkan Block tabel, mencentang field, mengonfigurasi Action — tidak akan diulang di sini, hanya menjelaskan satu perbedaan kunci.

Ingat tabel "Kategori Tiket" yang kita buat di Bab 2? Itu adalah **tabel pohon** (mendukung hierarki parent-child). Untuk membuat tabel menampilkan struktur pohon dengan benar, perlu mengaktifkan satu opsi konfigurasi:

1. Masuk ke halaman "Kategori Tiket", tambahkan Block tabel, pilih tabel data "Kategori Tiket".
2. Klik **Pengaturan Block** (ikon tiga garis horizontal) Block tabel, temukan **"Aktifkan Tabel Pohon (Tree table)"**, aktifkan.


Setelah diaktifkan, tabel akan menampilkan hubungan kategori parent-child dengan indentasi level, bukan menampilkan semua record secara datar.

3. Centang field yang perlu ditampilkan (seperti nama, deskripsi, dll.), konfigurasi Action baris (tambah, edit, hapus).
4. **Saran Layout**: Letakkan "Nama" di kolom pertama, kolom "Action" di kolom kedua. Tabel kategori tidak banyak field, dengan layout dua kolom seperti ini lebih kompak dan ramah.

![03-building-pages-2026-03-13-18-51-36](https://static-docs.nocobase.com/03-building-pages-2026-03-13-18-51-36.png)

## Ringkasan

Selamat! Sistem tiket kita sudah memiliki **antarmuka manajemen** yang layak:

- Struktur menu yang jelas (Manajemen Tiket → Daftar Tiket / Kategori Tiket)
- **Block tabel** yang menampilkan data tiket
- **Filter form** yang dapat memfilter cepat berdasarkan status, prioritas, kategori
- **Aturan sorting** descending berdasarkan waktu pembuatan
- Tombol Action baris, memudahkan untuk melihat dan mengedit
- **Tabel pohon** yang menampilkan hierarki kategori

Bukankah lebih sederhana dari yang dibayangkan? Seluruh proses tidak menulis satu baris kode pun, semua diselesaikan melalui drag dan konfigurasi antarmuka.

## Pratinjau Bab Berikutnya

Hanya bisa "melihat" saja tidak cukup — pengguna juga harus bisa **mengirim tiket baru**. Bab berikutnya, kita akan membangun Block form, mengonfigurasi aturan linkage field, dan juga akan mengaktifkan riwayat record untuk melacak setiap perubahan tiket.

## Sumber Daya Terkait

- [Ikhtisar Block](/interface-builder/blocks) — Penjelasan semua tipe Block
- [Block Tabel](/interface-builder/blocks/data-blocks/table) — Konfigurasi detail Block tabel
- [Block Filter](/interface-builder/blocks/filter-blocks/form) — Konfigurasi filter form
