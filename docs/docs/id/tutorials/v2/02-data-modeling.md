# Bab 2: Pemodelan Data — Dua Tabel untuk Sistem Tiket

Pada bab sebelumnya kita telah menginstal NocoBase dan mengenal antarmukanya. Sekarang, kita akan membangun kerangka untuk sistem tiket — mendefinisikan **model data**.

Bab ini akan membuat dua [tabel data](/data-sources/data-modeling/collection): tiket dan kategori, mengonfigurasi [tipe field](/data-sources/data-modeling/collection-fields) (teks satu baris, dropdown, asosiasi [many-to-one](/data-sources/data-modeling/collection-fields/associations/m2o), dan lainnya), serta membangun hubungan asosiasi antar tabel. Model data adalah fondasi sistem: pikirkan dengan jelas terlebih dahulu data apa yang perlu disimpan dan apa hubungan antara data, kemudian membangun antarmuka dan mengonfigurasi izin akan berjalan dengan lancar.


## 2.1 Apa itu Tabel Data dan Field

Jika Anda pernah menggunakan Excel, memahami tabel data sangat mudah:

| Konsep Excel | Konsep NocoBase | Penjelasan |
|------------|--------------|------|
| Worksheet | Tabel Data (Collection) | Container untuk satu jenis data |
| Header Kolom | Field | Atribut yang mendeskripsikan data |
| Setiap Baris | Record | Sebuah data konkret |

![02-data-modeling-2026-03-11-08-32-41](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-32-41.png)

Misalnya "tabel tiket" yang akan kita buat, seperti tabel Excel — setiap kolom adalah field (judul, status, prioritas, dll.), setiap baris adalah satu record tiket.

Namun, NocoBase jauh lebih kuat dari Excel. NocoBase mendukung berbagai **tipe tabel data**, dengan setiap tipe membawa kemampuan yang berbeda:

| Tipe Tabel | Skenario yang Cocok | Contoh |
|--------|---------|------|
| **Tabel Biasa** | Sebagian besar data bisnis | Tiket, pesanan, pelanggan |
| **Tabel Pohon** | Data dengan hubungan hierarki | Direktori kategori, struktur organisasi departemen |
| Tabel Kalender | Event tanggal | Rapat, jadwal |
| Tabel File | Manajemen lampiran | Dokumen, gambar |

Hari ini kita akan menggunakan **tabel biasa** dan **tabel pohon**, tipe lainnya akan dipelajari saat dibutuhkan nanti.

**Masuk ke Manajemen Data Source**: klik ikon **"Manajemen Data Source"** di pojok kiri bawah (ikon database di samping gear), Anda akan melihat "[Data Source Utama](/data-sources)" — semua tabel kita dibangun di sini.

![02-data-modeling-2026-03-11-08-35-08](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-35-08.png)


## 2.2 Membuat Tabel Inti: Tiket

Mari kita langsung ke topik utama, buat inti sistem terlebih dahulu — tabel tiket.

### Membuat Tabel

1. Pada halaman manajemen data source, klik **Data Source Utama** untuk masuk

![02-data-modeling-2026-03-11-08-36-06](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-36-06.png)

2. Klik **"Buat Tabel Data"**, pilih **"Tabel Biasa"**

![02-data-modeling-2026-03-11-08-38-52](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-38-52.png)

3. Nama tabel data: `tickets`, judul tabel data: `Tiket`

![02-data-modeling-2026-03-11-08-40-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-40-34.png)

Saat membuat tabel, sistem akan secara default mencentang sekelompok **field sistem**, yang akan mencatat metadata setiap record secara otomatis:

| Field | Penjelasan |
|------|------|
| ID | Primary key, identifikasi unik terdistribusi |
| Tanggal Pembuatan | Waktu pembuatan record |
| Pembuat | Siapa yang membuat record ini |
| Tanggal Modifikasi Terakhir | Waktu update terakhir |
| Pengubah Terakhir | Pengguna yang melakukan update terakhir |

Field sistem ini biarkan saja sebagai default, tidak perlu dikelola secara manual. Jika beberapa skenario tidak membutuhkannya, Anda juga bisa mencentangnya kembali.

### Menambahkan Field Dasar

Tabel sudah dibuat, selanjutnya tambahkan field. Klik **"Konfigurasi field (Configure fields)"** pada tabel tiket, Anda akan melihat field sistem default sudah ada di list.

![02-data-modeling-2026-03-11-08-58-48](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-58-48.png)

![02-data-modeling-2026-03-11-08-59-47](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-59-47.png)

Klik tombol **"Tambah field (Add field)"** di pojok kanan atas, akan terbuka list dropdown tipe field — pilih tipe field yang ingin ditambahkan.

![02-data-modeling-2026-03-11-09-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-00-22.png)

Mari tambahkan field tiket sendiri terlebih dahulu, field asosiasi akan ditambahkan kemudian.

**1. Judul (Teks Satu Baris)**

Setiap tiket membutuhkan judul singkat untuk meringkas masalah. Klik **"Tambah field"** → pilih **"[Teks Satu Baris](/data-sources/data-modeling/collection-fields/basic/input)"**:

![02-data-modeling-2026-03-11-09-01-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-01-00.png)

- Nama field: `title`, judul field: `Judul`
- Klik **"Atur aturan validasi"**, tambahkan aturan **"Wajib"**

![02-data-modeling-2026-03-11-09-02-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-02-40.png)

**2. Deskripsi (Markdown(Vditor))**

Digunakan untuk mendeskripsikan masalah secara detail, mendukung formatting, memudahkan paste gambar dan paste kode. Pada "Tambah field" → kategori "Media" terdapat tiga opsi:

| Tipe Field | Karakteristik |
|---------|------|
| Markdown | Markdown dasar, gaya sederhana |
| Rich Text | Rich text, gaya sederhana + upload lampiran |
| **Markdown(Vditor)** | Fitur paling lengkap, mendukung WYSIWYG, instant rendering, mode edit source code |

Kita pilih **Markdown(Vditor)**.

![02-data-modeling-2026-03-11-09-09-58](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-09-58.png)

- Nama field: `description`, judul field: `Deskripsi`

![02-data-modeling-2026-03-11-09-10-50](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-10-50.png)

**3. Status (Dropdown - Pilihan Tunggal)**

![02-data-modeling-2026-03-11-09-12-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-12-00.png)
Tiket dari pengiriman hingga selesai membutuhkan status untuk melacak progress.

- Nama field: `status`, judul field: `Status`
- Tambahkan nilai opsi (setiap opsi perlu mengisi "nilai opsi" dan "label opsi", warna opsional):

| Nilai Opsi | Label Opsi | Warna |
|--------|---------|------|
| pending | Menunggu | Orange |
| in_progress | Sedang Diproses | Blue |
| completed | Selesai | Green |

![02-data-modeling-2026-03-11-09-17-44](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-17-44.png)

Isi opsi dan simpan terlebih dahulu. Kemudian klik **"Edit"** field tersebut lagi, sekarang Anda dapat memilih **"Menunggu"** di "Nilai default".

![02-data-modeling-2026-03-11-09-20-28](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-20-28.png)

![02-data-modeling-2026-03-11-09-22-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-22-34.png)

> Saat pertama kali membuat belum ada data opsi, jadi nilai default tidak bisa dipilih — perlu disimpan dulu lalu kembali untuk mengaturnya.

> Mengapa menggunakan dropdown pilihan tunggal? Karena status adalah beberapa nilai yang sudah ditetapkan, [dropdown menu](/data-sources/data-modeling/collection-fields/choices/select) dapat mencegah pengguna mengisi sembarangan dan menjamin standar data.

**4. Prioritas (Dropdown - Pilihan Tunggal)**

Membedakan tingkat urgensi tiket, memudahkan personel pemroses untuk sorting berdasarkan prioritas.

- Nama field: `priority`, judul field: `Prioritas`
- Tambahkan nilai opsi:

| Nilai Opsi | Label Opsi | Warna |
|--------|---------|------|
| low | Rendah | |
| medium | Sedang | |
| high | Tinggi | Orange |
| urgent | Mendesak | Red |

Sampai di sini, tabel tiket sudah memiliki 4 field dasar. Tetapi — tiket seharusnya memiliki "kategori" kan? Seperti "masalah jaringan" atau "gangguan software"?

Jika kategori dibuat sebagai dropdown, tentu saja bisa. Tetapi Anda akan segera menyadari: kategori mungkin memiliki sub-kategori ("masalah hardware" memiliki "monitor", "keyboard", "printer"), dropdown menjadi tidak cukup.

Kita membutuhkan **tabel lain** untuk khusus mengelola kategori. Dan tabel ini, paling cocok dibuat menggunakan **tabel pohon** NocoBase.


## 2.3 Membuat Tabel Pohon Kategori: Membuat Kategori Berhierarki

### Apa itu Tabel Pohon

Tabel pohon adalah tipe tabel data khusus yang memiliki **hubungan parent-child** bawaan — setiap record dapat memiliki satu "parent node". Ini secara alami cocok untuk data dengan struktur hierarki:

```
Masalah Hardware  ← kategori level 1
├── Monitor       ← kategori level 2
├── Keyboard Mouse
└── Printer
Gangguan Software
├── Software Office
└── Masalah Sistem
Masalah Jaringan
Izin Akun
```

Jika menggunakan tabel biasa, Anda perlu membuat field "kategori parent" sendiri secara manual untuk merealisasikan hubungan ini. Sedangkan **tabel pohon akan otomatis menanganinya untuk Anda**, juga mendukung tampilan struktur pohon, menambahkan sub-record, dan operasi lainnya, jauh lebih praktis.

### Membuat Tabel

1. Kembali ke manajemen data source, klik **"Buat Tabel Data"**
2. Kali ini pilih **"Tabel Pohon"** (bukan tabel biasa!)
![02-data-modeling-2026-03-11-09-26-07](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-07.png)

3. Nama tabel data: `categories`, judul tabel data: `Kategori Tiket`

![02-data-modeling-2026-03-11-09-26-55](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-55.png)

> Perhatikan bahwa setelah dibuat, selain field sistem, tabel akan otomatis muncul dua field relasi **"Parent"** dan **"Children"** — ini adalah kemampuan khusus tabel pohon. Melalui Parent dapat mengakses parent node, melalui Children dapat mengakses semua child node, tidak perlu Anda tambahkan secara manual.

![02-data-modeling-2026-03-11-09-27-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-27-40.png)

### Menambahkan Field

Klik **"Konfigurasi field"** untuk masuk ke daftar field, Anda dapat melihat field sistem dan field Parent, Children yang dibuat secara otomatis.
Klik **"Tambah field"** di pojok kanan atas:

**Field 1: Nama Kategori**

1. Pilih **"Teks Satu Baris"**
2. Nama field: `name`, judul field: `Nama Kategori`
3. Klik **"Atur aturan validasi"**, tambahkan aturan **"Wajib"**

**Field 2: Warna**

1. Pilih **"Warna"**
2. Nama field: `color`, judul field: `Warna`

![02-data-modeling-2026-03-11-09-28-59](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-28-59.png)

Field warna memungkinkan setiap kategori memiliki warna identifikasi sendiri, akan lebih intuitif saat ditampilkan di antarmuka nanti.

![02-data-modeling-2026-03-11-09-29-23](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-29-23.png)

Sampai di sini, field dasar dari kedua tabel data sudah dikonfigurasi. Selanjutnya kita akan menghubungkan keduanya.


## 2.4 Kembali ke Tabel Tiket: Menambahkan Field Asosiasi

> **Field relasi mungkin terasa abstrak saat pertama kali ditemui.** Jika Anda merasa kurang mudah dipahami, Anda bisa langsung lompat ke [Bab 3: Membangun Halaman](./03-building-pages), rasakan bagaimana data ditampilkan dalam operasi halaman aktual, kemudian kembali untuk menambahkan field asosiasi.

Tiket perlu diasosiasikan dengan kategori, pengirim, dan penangani. Jenis field ini disebut **field relasi** — tidak seperti "judul" yang langsung menyimpan teks, tetapi menyimpan ID record dari tabel lain, dan melalui ID ini dapat menemukan record yang sesuai.

Mari lihat dengan satu tiket konkret — di sebelah kiri adalah berbagai atribut tiket, di mana "kategori" dan "pengirim" tidak menyimpan teks, melainkan sebuah ID. Sistem melalui ID ini, dari tabel di sebelah kanan dapat menemukan record yang sesuai dengan tepat:


![02-data-modeling-2026-03-12-00-50-10](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-50-10.png)

Yang Anda lihat di antarmuka adalah nama ("masalah jaringan", "Bambang"), di belakangnya diasosiasikan melalui ID. **Beberapa tiket dapat menunjuk ke kategori yang sama atau pengguna yang sama** — hubungan ini disebut [**many-to-one**](/data-sources/data-modeling/collection-fields/associations/m2o).

### Menambahkan Field Relasi

Kembali ke "Konfigurasi field" tabel tiket → "Tambah field", pilih **"Many-to-One"**.
![02-data-modeling-2026-03-12-00-52-39](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-52-39.png)

Saat membuat Anda akan melihat opsi konfigurasi ini:

| Opsi Konfigurasi | Penjelasan | Cara Mengisi |
|--------|------|--------|
| Tabel Data Sumber | Tabel saat ini (otomatis terisi) | Tidak perlu diubah |
| **Tabel Data Target** | Tabel mana yang akan diasosiasikan | Pilih tabel yang sesuai |
| **Foreign Key** | Nama kolom asosiasi yang ada di tabel saat ini | Isi dengan nama yang bermakna |
| Field Identifier Tabel Data Target | Default `id` | Biarkan default |
| ON DELETE | Cara penanganan saat record target dihapus | Biarkan default |

![02-data-modeling-2026-03-12-00-58-38](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-58-38.png)

> Foreign key secara default akan otomatis menghasilkan nama acak (seperti `f_xxxxx`), disarankan diubah menjadi nama yang bermakna untuk memudahkan maintenance di masa depan. Penamaan menggunakan huruf kecil dan underscore (seperti `category_id`), jangan campur huruf besar dan kecil.

Dengan cara ini, tambahkan tiga field secara berurutan:

**5. Kategori → Tabel Kategori Tiket**

- Judul field: `Kategori`
- Tabel data target: pilih **"Kategori Tiket"** (jika tidak ada di list, langsung ketik nama tabel akan otomatis dibuat)
- Foreign key: `category_id`

**6. Pengirim → Tabel Pengguna**

Mencatat siapa yang mengirim tiket ini. NocoBase memiliki tabel pengguna bawaan, langsung asosiasikan saja.

- Judul field: `Pengirim`
- Tabel data target: pilih **"Pengguna"**
- Foreign key: `submitter_id`
![02-data-modeling-2026-03-12-01-00-09](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-09.png)

**7. Penangani → Tabel Pengguna**

Mencatat siapa yang bertanggung jawab menangani tiket ini.

- Judul field: `Penangani`
- Tabel data target: pilih **"Pengguna"**
- Foreign key: `assignee_id`

![02-data-modeling-2026-03-12-01-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-22.png)


## 2.5 Gambaran Lengkap Model Data

Mari kita tinjau kembali model data lengkap yang telah kita bangun:

![02-data-modeling-2026-03-16-00-30-35](https://static-docs.nocobase.com/02-data-modeling-2026-03-16-00-30-35.png)

`}o--||` mewakili hubungan many-to-one: di kiri "many", di kanan "one".


## Ringkasan

Pada bab ini kita telah menyelesaikan pemodelan data — kerangka seluruh sistem tiket:

1. **Tabel Tiket** (tickets): 4 field dasar + 3 field asosiasi, dibuat dengan **tabel biasa**
2. **Tabel Kategori Tiket** (categories): 2 field kustom + field Parent/Children otomatis, dibuat dengan **tabel pohon**, secara alami mendukung kategori berhierarki

Kita telah mempelajari beberapa konsep penting:

- **Tabel Data (Collection)** = container untuk satu jenis data
- **Tipe Tabel Data** = pilih tipe yang berbeda untuk skenario yang berbeda (tabel biasa, tabel pohon, dll.)
- **Field** = atribut data, dibuat melalui "Konfigurasi field" → "Tambah field"
- **Field Sistem** = ID, tanggal pembuatan, pembuat, dll., otomatis tercentang saat membuat tabel
- **Field Relasi (Many-to-One)** = mengarah ke record di tabel lain, membangun asosiasi antar tabel

> Anda mungkin memperhatikan bahwa screenshot di bab selanjutnya sudah memiliki data — data uji ini kami input terlebih dahulu untuk mendemonstrasikan efek, jangan terburu-buru. Di NocoBase, operasi CRUD data dilakukan melalui halaman frontend. Bab 3 akan membangun tabel untuk menampilkan data, Bab 4 akan membangun form untuk input data, akan diungkap secara bertahap.


## Pratinjau Bab Berikutnya

Kerangka sudah dibangun, tetapi sekarang hanya tabel kosong. Bab berikutnya, kita akan membangun halaman, agar data benar-benar dapat ditampilkan.

Sampai jumpa di bab berikutnya!

## Sumber Daya Terkait

- [Ikhtisar Data Source](/data-sources) — Konsep inti pemodelan data NocoBase
- [Field Tabel Data](/data-sources/data-modeling/collection-fields) — Penjelasan detail semua tipe field
- [Asosiasi Many-to-One](/data-sources/data-modeling/collection-fields/associations/m2o) — Penjelasan konfigurasi hubungan asosiasi
