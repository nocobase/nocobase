# Bab 5: Pengguna dan Izin — Siapa Bisa Melihat Apa

Pada bab sebelumnya kita telah membuat form dan halaman detail, sistem tiket sudah dapat menginput dan melihat data secara normal. Tetapi sekarang ada masalah — semua orang yang login melihat hal yang sama. Karyawan biasa yang mengirim tiket bisa melihat halaman manajemen, teknisi bisa menghapus kategori... ini tidak boleh.

Pada bab ini, mari kita tambahkan "kontrol akses" pada sistem: membuat [role](/users-permissions/acl/role), mengonfigurasi [izin menu](/users-permissions/acl/permissions) dan [data scope](/users-permissions/acl/permissions), merealisasikan **orang yang berbeda, melihat menu yang berbeda, mengoperasikan data yang berbeda**.

## 5.1 Memahami [Role](/users-permissions/acl/role)

Di NocoBase, **role adalah kumpulan [izin](/users-permissions/acl/role)**. Anda tidak perlu mengonfigurasi izin untuk setiap pengguna secara terpisah, melainkan mendefinisikan beberapa role terlebih dahulu, kemudian memasukkan pengguna ke role yang sesuai.

NocoBase setelah instalasi memiliki tiga role bawaan:

- **Root**: Super administrator, memiliki semua izin, tidak dapat dihapus
- **Admin**: Administrator, secara default memiliki izin untuk mengonfigurasi antarmuka
- **Member**: Anggota biasa, izin default lebih sedikit

Tetapi tiga role bawaan ini tidak cukup. Sistem tiket kita membutuhkan pembagian yang lebih detail, jadi selanjutnya kita akan membuat 3 role kustom.

## 5.2 Membuat Tiga Role

Buka menu pengaturan di pojok kanan atas, masuk ke **Pengguna dan Izin → Manajemen Role**.

Klik **Tambah Role**, buat secara berurutan:

| Nama Role | Identifier Role | Penjelasan |
|---------|---------|------|
| Administrator | admin-helpdesk | Bisa melihat semua tiket, mengelola kategori, menugaskan penangani |
| Teknisi | technician | Hanya melihat tiket yang ditugaskan ke dirinya, dapat memproses dan menutup |
| Pengguna Biasa | user | Hanya bisa mengirim tiket, hanya melihat yang dikirimnya sendiri |

![05-roles-and-permissions-2026-03-13-19-03-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-03-14.png)

> **Identifier role** adalah ID unik yang digunakan secara internal di sistem, tidak dapat diubah setelah dibuat, disarankan menggunakan huruf kecil bahasa Inggris. Nama role dapat dimodifikasi kapan saja.

![05-roles-and-permissions-2026-03-13-18-57-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-18-57-47.png)

Setelah selesai dibuat, di list role seharusnya bisa melihat tiga role baru yang kita buat.


## 5.3 Mengonfigurasi Izin Menu

Role sudah dibuat, selanjutnya beri tahu sistem: setiap role bisa melihat menu apa.

Klik salah satu role untuk masuk ke halaman konfigurasi izin, temukan tab **Izin Akses Menu**. Di sini akan menampilkan semua item menu di sistem, mencentang berarti diizinkan akses, batal mencentang berarti disembunyikan.

**Administrator (admin-helpdesk)**: Centang semua
- Manajemen Tiket, Manajemen Kategori, Dashboard — semuanya bisa dilihat

**Teknisi (technician)**: Centang sebagian
- ✅ Manajemen Tiket
- ✅ Dashboard
- ❌ Manajemen Kategori (teknisi tidak perlu mengelola kategori)

**Pengguna Biasa (user)**: Izin paling minimal
- ✅ Manajemen Tiket (hanya bisa melihat tiketnya sendiri)
- ❌ Manajemen Kategori
- ❌ Dashboard

![05-roles-and-permissions-2026-03-13-19-09-11](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-09-11.png)

> **Tips**: NocoBase memiliki pengaturan praktis — "Izinkan akses default item menu baru". Jika Anda tidak ingin mencentang setiap kali menambah halaman baru secara manual, Anda bisa mengaktifkan opsi ini untuk role administrator. Untuk role pengguna biasa, disarankan menonaktifkannya.

## 5.4 Mengonfigurasi Izin Data

Izin menu mengatur "bisa atau tidak masuk ke halaman ini", izin data mengatur "setelah masuk ke halaman bisa melihat data apa".

Konsep kunci: **[Data Scope](/users-permissions/acl/permissions)**.

Pada konfigurasi izin role, beralih ke tab **Izin Operasi [Tabel Data](/data-sources/data-modeling/collection)**. Temukan tabel "Tiket" kita, klik untuk masuk ke konfigurasi terpisah.

![05-roles-and-permissions-2026-03-13-19-51-06](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-51-06.png)

### Pengguna Biasa: Hanya Melihat Tiket yang Dikirim Sendiri

1. Temukan izin **Lihat** tabel "Tiket"
2. Data scope pilih → **Data Sendiri**
3. Dengan demikian pengguna biasa hanya bisa melihat tiket yang "pembuatnya adalah dirinya sendiri" (perlu diperhatikan, opsi default berdasarkan field pembuat sistem, bukan field pengirim, namun dapat dimodifikasi)

Demikian juga, atur izin "Edit" dan "Hapus" sebagai **Data Sendiri** (atau langsung tidak memberikan izin hapus).

![05-roles-and-permissions-2026-03-13-19-53-02](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-53-02.png)


Tentang konfigurasi global: jika hanya mengonfigurasi tabel tiket, mungkin menyebabkan data dan opsi konfigurasi lainnya (seperti tabel kategori, penangani) tidak terlihat. Sistem kita saat ini relatif sederhana, di sini langsung centang "Lihat semua data" di global, untuk tabel yang sensitif terhadap data scope, konfigurasi izin secara terpisah

![05-roles-and-permissions-2026-03-13-19-57-24](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-57-24.png)


### Teknisi: Hanya Melihat Tiket yang Ditugaskan ke Dirinya

1. Temukan izin **Lihat** tabel "Tiket"
2. Data scope pilih → **Data Sendiri**
3. Tetapi ada detail di sini — "Data Sendiri" NocoBase secara default difilter berdasarkan pembuat. Jika kita ingin difilter berdasarkan "penangani", dapat disesuaikan lebih lanjut di [izin operasi](/users-permissions/acl/permissions) global, atau direalisasikan di halaman frontend dengan **kondisi filter [Block](/interface-builder/blocks) data**

![05-roles-and-permissions-2026-03-13-20-01-54](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-20-01-54.png)

> **Tips Praktis**: Anda juga dapat mengatur kondisi filter default pada Block tabel untuk membantu kontrol izin, seperti "Penangani = Pengguna Saat Ini". Tetapi konfigurasi halaman berlaku global, administrator juga akan dibatasi. Solusi kompromi: konfigurasi "Penangani = Pengguna Saat Ini **atau** Pengirim = Pengguna Saat Ini", kompatibel dengan pengguna biasa dan teknisi; jika administrator membutuhkan tampilan global, buat halaman terpisah tanpa filter.

![05-roles-and-permissions-2026-03-13-22-21-34](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-21-34.png)

### Administrator: Melihat Semua Data

Data scope role administrator pilih **Semua Data**, semua operasi dibuka. Sederhana dan langsung.

![05-roles-and-permissions-2026-03-13-21-45-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-21-45-14.png)

## 5.5 Action Penugasan Tiket

Sebelum izin dikonfigurasi, mari tambahkan fitur praktis ke daftar tiket: **Tugaskan Penangani**. Administrator dapat langsung menugaskan tiket ke teknisi tertentu di list, tanpa perlu masuk ke halaman edit untuk mengubah banyak field.

Realisasinya sederhana — tambahkan tombol popup kustom di kolom Action tabel:

1. Masuk ke mode UI Editor, di kolom Action tabel daftar tiket, klik **"+"** untuk menambahkan tombol Action **"Popup"**.

![05-roles-and-permissions-2026-03-14-13-57-31](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-57-31.png)

2. Ubah judul tombol menjadi **"Tugaskan"** (klik konfigurasi tombol untuk modifikasi judul).

![05-roles-and-permissions-2026-03-14-13-59-22](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-59-22.png)


Karena hanya ada satu informasi penugasan sederhana, kita gunakan popup sederhana yang lebih cocok daripada drawer. Klik pengaturan popup di pojok kanan atas tombol, pilih Dialog kecil > Konfirmasi
![05-roles-and-permissions-2026-03-14-14-08-16](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-08-16.png)


3. Klik tombol "Tugaskan" untuk membuka popup, di popup **"Buat Block → Block Data → Form (Edit)"**, pilih tabel data saat ini.
4. Pada form hanya centang field **"Penangani"** saja, dan atur sebagai **wajib** di konfigurasi field.
5. Tambahkan tombol Action **"Submit"**.

![05-roles-and-permissions-2026-03-14-14-10-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-10-50.png)

Dengan demikian, administrator pada daftar tiket klik "Tugaskan", muncul form sangat sederhana, pilih penangani lalu submit. Cepat, akurat, tidak akan salah ubah field lain.

### Menggunakan Aturan Linkage untuk Mengontrol Show/Hide Tombol

Tombol "Tugaskan" hanya perlu digunakan oleh administrator, pengguna biasa dan teknisi melihatnya malah membuat bingung. Kita dapat menggunakan **aturan linkage** untuk mengontrol show/hide tombol berdasarkan role pengguna saat ini:

1. Pada mode UI Editor, klik konfigurasi tombol "Tugaskan", temukan **"Aturan Linkage"**.
2. Tambahkan satu aturan, kondisi atur sebagai: **Pengguna Saat Ini / Role / Nama Role** tidak sama dengan **Administrator** (yaitu nama yang sesuai dengan role admin-helpdesk).
3. Action saat memenuhi kondisi: **Sembunyikan** tombol tersebut.

Dengan demikian, hanya pengguna dengan role administrator yang dapat melihat tombol "Tugaskan", role lain saat login tombol ini akan otomatis disembunyikan.

![05-roles-and-permissions-2026-03-14-14-17-37](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-17-37.png)

## 5.6 Membuat Pengguna Uji dan Mengalami

Izin sudah dikonfigurasi, mari verifikasi secara aktual.

Masuk ke **Manajemen Pengguna** (pusat pengaturan atau halaman manajemen pengguna yang sudah Anda bangun sebelumnya), buat 3 pengguna uji:

| Username | Role |
|-------|------|
| Alice | Administrator (admin-helpdesk) |
| Bob | Teknisi (technician) |
| Charlie | Pengguna Biasa (user) |

![05-roles-and-permissions-2026-03-13-22-23-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-23-47.png)

Setelah dibuat, login ke sistem dengan tiga akun ini secara terpisah, periksa dua hal:

**1. Apakah menu ditampilkan sesuai harapan?**
- Alice → bisa melihat semua menu

![05-roles-and-permissions-2026-03-14-14-19-29](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-19-29.png)

- Bob → hanya melihat manajemen tiket dan dashboard

![05-roles-and-permissions-2026-03-13-22-26-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-26-50.png)

- Charlie → hanya melihat "Tiket Saya"

![05-roles-and-permissions-2026-03-13-22-30-57](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-30-57.png)

**2. Apakah data difilter sesuai harapan?**
- Pertama gunakan Alice untuk membuat beberapa tiket, tugaskan ke penangani yang berbeda
- Beralih login ke Bob → hanya melihat tiket yang ditugaskan ke dirinya
- Beralih login ke Charlie → hanya melihat tiket yang dikirimnya sendiri

Bukankah keren? Sistem yang sama, pengguna yang berbeda melihat konten yang sepenuhnya berbeda! Inilah kekuatan izin.

## Ringkasan

Pada bab ini kita telah menyelesaikan sistem izin sistem tiket:

- **3 role**: Administrator, Teknisi, Pengguna Biasa
- **Izin menu**: mengontrol setiap role dapat masuk ke halaman apa
- **Izin data**: mengontrol setiap role dapat melihat data apa (direalisasikan melalui data scope)
- **Verifikasi uji**: login dengan akun yang berbeda, konfirmasi izin berlaku

Sampai di sini, sistem tiket sudah terlihat layak — bisa input, bisa lihat, bisa kontrol akses berdasarkan role. Tetapi semua operasi masih manual.

## Pratinjau Bab Berikutnya

Bab berikutnya kita akan belajar **Workflow** — biarkan sistem secara otomatis bekerja untuk kita. Misalnya tiket setelah dikirim otomatis memberi tahu penangani, saat status berubah otomatis mencatat log.

## Sumber Daya Terkait

- [Manajemen Pengguna](/users-permissions/user) — Detail manajemen pengguna
- [Role dan Izin](/users-permissions/acl/role) — Penjelasan konfigurasi role
- [Data Scope](/users-permissions/acl/permissions) — Kontrol izin level data
