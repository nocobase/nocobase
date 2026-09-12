# Bab 6: Pengguna dan Izin

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113595157318206&bvid=BV1EwiUYYE4f&cid=27181319746&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Dalam kolaborasi tim, setiap orang harus memahami tanggung jawab dan izin mereka sendiri, untuk memastikan pekerjaan berjalan lancar. Hari ini, kita akan belajar bersama tentang pembuatan role dan manajemen izin, agar kolaborasi lebih lancar dan teratur.

Jangan khawatir, proses ini tidak rumit, kita akan membawa Anda menyelesaikannya langkah demi langkah, memandu Anda di setiap titik kunci. Jika Anda menemui masalah apa pun, silakan bertanya ke forum resmi kami.

### Diskusi Kebutuhan:

Kita membutuhkan satu role "Mitra" (Partner), role ini memiliki izin tertentu untuk berpartisipasi dalam manajemen tugas, tetapi tidak dapat sembarangan memodifikasi tugas orang lain. Dengan cara ini, kita dapat secara fleksibel melakukan penugasan tugas dan kolaborasi.

![](https://static-docs.nocobase.com/241219-5-er.svg)

> **Pengenalan Role dan Izin:** Role dan izin adalah mekanisme penting untuk mengelola akses dan operasi pengguna, memastikan keamanan sistem dan integritas data, role dapat dihubungkan ke pengguna, satu pengguna dapat memiliki banyak role. Pengaturan izin role dapat mengontrol perilaku, operasi pengguna di sistem, serta batasan tampilan fitur halaman untuk pengguna, dll., memiliki makna penting dalam kontrol izin.
> Menggunakan fitur role dan izin, dihubungkan dengan pengguna. Dapat membuat Anda dalam studi kasus pembelajaran ini memiliki kontrol yang lebih baik atas sistem manajemen Anda sendiri, sebagai manajer Anda dapat dengan bebas mengatur siapa memiliki izin operasi sistem seperti apa!

### 6.1 **Pembuatan dan Penghubungan Role**

#### 6.1.1 **Pembuatan Role "Mitra (Partner)"**

- Klik ["**Pengguna dan Izin**"](https://docs-cn.nocobase.com/handbook/users) di pojok kanan atas antarmuka, pilih ["**Role dan Izin**"](https://docs-cn.nocobase.com/handbook/acl). Ini adalah tempat kita mengatur role dan mengelola izin.
- Klik tombol "**Buat Role**", muncul satu dialog. Di sini, beri nama role **Mitra (Partner)**, dan konfirmasi simpan.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172222974.gif)

Anda telah berhasil membuat role baru! Selanjutnya, kita perlu memberikan izin kepada role ini, memastikan mereka dapat berpartisipasi dalam manajemen tugas.

#### 6.1.2 **Hubungkan Role Baru ke Diri Sendiri**

Untuk memastikan izin role yang kita atur berlaku, kita dapat menghubungkan role ini ke akun kita sendiri terlebih dahulu untuk uji. Operasinya sangat sederhana:

- Pada manajemen pengguna temukan akun Anda, klik untuk masuk, pilih "**Hubungkan Role**", pilih "**Mitra**".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223483.gif)

Dengan demikian Anda dapat menggunakan akun Anda sendiri untuk mensimulasikan pengalaman role "Mitra". Selanjutnya, kita coba bagaimana beralih role.

#### 6.1.3 **Beralih ke Role "Mitra"**

Sekarang, Anda telah menghubungkan role "Mitra". Selanjutnya, mari lihat bagaimana beralih role.

- Klik **Personal Center** di pojok kanan atas, lalu pilih "**Beralih Role**".
- Anda mungkin menemukan opsi role "Mitra" tidak muncul untuk sementara, jangan khawatir, saat ini cukup **refresh halaman/cache**, role akan ditampilkan!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223922.gif)

### 6.2 Mengalokasikan Izin Halaman untuk Role

Setelah beralih ke role "Mitra", Anda mungkin menemukan tidak ada halaman dan menu di sistem. Ini karena kita belum mengalokasikan izin akses ke halaman tertentu untuk role ini. Tidak masalah, selanjutnya kita akan mengatur izin akses untuk role "Mitra".

#### 6.2.1 **Alokasikan Izin Halaman Tugas untuk Role "Mitra"**

- Pertama, beralih kembali ke role **Root** (super administrator), lalu masuk ke halaman "**Role dan Izin**".
- Klik role "Mitra", masuk ke halaman konfigurasi. Di sini kita dapat melihat tab "**Menu**", mewakili semua halaman dalam sistem.
- Centang izin halaman "**Manajemen Tugas**", dengan demikian role "Mitra" dapat mengakses halaman manajemen tugas.

Kembali ke **Personal Center**, beralih lagi ke role "Mitra", saat ini Anda seharusnya sudah dapat melihat halaman menu manajemen tugas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223592.gif)

#### 6.2.2 Mengatur Izin Tabel Data dan Operasi

Meskipun sekarang role "Mitra" sudah dapat mengakses halaman manajemen tugas, kita masih perlu lebih lanjut membatasi izin operasi mereka. Kita berharap "Mitra" dapat:

- **Melihat dan mengedit** tugas yang ditugaskan kepada dirinya;
- **Memperbarui progres tugas**;
- Tetapi **tidak dapat membuat atau menghapus tugas**.

Untuk itu, kita perlu mengonfigurasi izin "tabel tugas". Mari lanjutkan!

##### 6.2.2.1 **Konfigurasi Izin Tabel Data untuk Role "Mitra"**

- Masuk ke halaman "**Role dan Izin**", klik role "Mitra", beralih ke tab "**Data Source**".
- Di sini, Anda akan melihat pengaturan "**Izin Operasi Tabel Data**". Temukan "**Tabel Tugas**", kita perlu mengalokasikan izin "Lihat" dan "Edit" untuk "Mitra".
- Mengapa izin edit dialokasikan sebagai 'Semua Data'?
  Meskipun untuk sementara kita memberikan semua izin edit kepada Mitra. Tetapi nantinya kita akan secara dinamis membatasi izin field berdasarkan "Penanggung Jawab Tugas".
  Jadi mempertahankan izin maksimum di awal adalah agar kontrol nantinya lebih fleksibel.
- Kita tidak ingin membuka "Tambah", "Hapus" untuk role lain, jadi tidak perlu mengalokasikan dari awal.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224941.gif)

Sampai sini, role mitra sudah memiliki izin untuk melihat dan mengedit semua tabel tugas. Selanjutnya kita perlu kontrol lebih jauh, untuk memastikan mereka hanya dapat mengedit tugas yang ditugaskan kepada dirinya.

### 6.3 Tambahkan Field "Penanggung Jawab" pada Tugas

Selanjutnya, kita akan menentukan satu penanggung jawab untuk setiap tugas. Dengan menentukan penanggung jawab, kita dapat memastikan hanya penanggung jawab tugas yang dapat memodifikasi tugas, sedangkan orang lain hanya dapat melihat. Saat itulah kita perlu menggunakan **field relasi**, untuk menghubungkan tabel tugas dan tabel pengguna.

#### 6.3.1 **Membuat Field "Penanggung Jawab"**

1. Masuk ke "**Tabel Tugas**", klik "**Tambah Field**", pilih "**Field Relasi**".
2. Pilih hubungan "**Many-to-One**" (karena satu tugas hanya dapat memiliki satu penanggung jawab, sedangkan satu pengguna dapat bertanggung jawab atas banyak tugas).
3. Beri nama field "**Penanggung Jawab (Assignee)**". Tidak perlu centang hubungan terbalik, untuk sementara kita tidak menggunakannya.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224751.gif)

#### 6.3.2 **Tampilkan Field "Penanggung Jawab"**

Selanjutnya, kita perlu memastikan field "Penanggung Jawab" ditampilkan di tabel dan form pada halaman manajemen tugas, agar Anda dapat dengan mudah menetapkan penanggung jawab untuk setiap tugas. (Jika field Anda secara default menampilkan nomor, jangan panik, ubah field judul dari ID menjadi "nickname")

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224547.png)

### 6.4 Menggunakan **Manajemen Izin** untuk Mengontrol Izin

Selanjutnya adalah acara utamanya!! Sekarang, kita akan menggunakan [**Manajemen Izin**](https://docs-cn.nocobase.com/handbook/acl) NocoBase untuk merealisasikan satu fitur yang sangat kuat: **hanya penanggung jawab dan pembuat tugas yang dapat mengedit tugas**, orang lain hanya dapat melihat. Fleksibilitas NocoBase berikutnya akan ditampilkan.

#### 6.4.1 **Coba Sederhana, Hanya Penanggung Jawab Bisa Mengedit Form**

Kita berharap hanya penanggung jawab tugas yang dapat mengedit tugas, oleh karena itu kita perlu mengatur kondisi berikut:

- Kita kembali ke izin tabel data "Mitra", buka "Konfigurasi" tabel tugas, dan klik "Data Scope" di belakang "Izin Edit".
- Buat aturan kustom baru, beri nama "Penanggung Jawab Bisa Edit":
  **Ketika "Penanggung Jawab/ID" sama dengan "Pengguna Saat Ini/ID"**, baru bisa edit;
  Ini berarti hanya penanggung jawab tugas yang dapat mengedit tugas, orang lain hanya dapat melihat.
- Karena field penanggung jawab kita menggunakan tabel pengguna, pengguna login juga ada di tabel pengguna, jadi aturan ini sempurna mengimplementasikan kebutuhan pertama kita.

Klik tambah, konfirmasi

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172226879.gif)

Mari kita kembali ke halaman untuk melihat:

Sempurna, sekarang kita beralih role mitra, kembali ke halaman untuk melihat, hanya saat penanggung jawab proyek adalah kita sendiri, action edit baru akan terlihat oleh kita.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227581.gif)

#### 6.4.2 **Tambahan Kondisi, Pembuat Memodifikasi Form**

Selanjutnya Anda mungkin segera menemukan masalah baru:

Karena sebagian besar tugas kita bukan penanggung jawab, kita sendiri tidak dapat mengedit form, dan teman-teman lain juga tidak dapat melihat detail tugas!

Jangan khawatir, masih ingat kita mengalokasikan izin "**Lihat**" semua data ke mitra?

- Kita kembali ke halaman, klik "Lihat" pada konfigurasi, tambahkan satu action lihat baru

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227426.png)

- Layout popup mirip dengan action edit, buat satu popup lihat, ingat untuk memilih Block "Detail".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227807.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227352.gif)

Selesai~

### 6.5 **Verifikasi Kontrol Izin**

Jika Anda mencoba beralih ke pengguna yang berbeda, saat melihat form, Anda akan menemukan dalam Block form, secara otomatis menampilkan action yang berbeda berdasarkan izin pengguna yang sesuai. Semua tugas yang sudah menjadi tanggung jawab kita akan membuka izin action edit, sedangkan proyek yang bukan tanggung jawab kita, hanya ada action lihat.

Saat kita beralih ke role Root, semua izin akan dipulihkan, inilah kekuatan kontrol izin NocoBase!

Selanjutnya dapat dengan bebas menetapkan penanggung jawab tugas, mengajak teman-teman untuk berkolaborasi. Mari tambahkan satu anggota baru untuk tim, dan uji apakah izin yang kita atur sudah benar.

#### 6.5.1 **Buat Pengguna Baru dan Alokasikan Role**

- Buat satu pengguna baru, contohnya **Tom**, dan alokasikan role "**Mitra**".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228278.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228648.gif)

- Pada halaman manajemen tugas, alokasikan beberapa tugas ke **Tom**.

#### 6.5.2 **Uji Login**

Biarkan Tom login ke sistem, lihat apakah dia dapat secara normal melihat dan mengedit tugas yang ditugaskan kepadanya. Melalui aturan izin yang ditetapkan, Tom seharusnya hanya dapat mengedit tugas yang menjadi tanggung jawabnya, tugas lainnya read-only baginya.

Izin form edit semua halaman telah berhasil tersinkronisasi~

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172229408.gif)

### Ringkasan

Selamat! Sampai sekarang, Anda telah belajar bagaimana membuat role di NocoBase, mengalokasikan izin, mengatur izin kustom, memastikan anggota tim hanya dapat mengedit tugas yang ditugaskan kepada mereka. Melalui langkah-langkah ini, Anda telah membangun sistem manajemen izin yang jelas dan teratur untuk kolaborasi tim.

### Tugas Tantangan

Sampai saat ini, Tom sudah dapat melihat dan mengedit tugas yang menjadi tanggung jawabnya, tetapi Anda mungkin memperhatikan, dia **masih tidak dapat memposting komentar**, tidak dapat berinteraksi dalam tugas. Lalu, bagaimana kita mengalokasikan izin untuk Tom, agar dia dapat dengan bebas memposting opini, berpartisipasi dalam diskusi? Ini akan menjadi tantangan yang sangat menarik!

**Tips Tantangan:**

Anda dapat mencoba kembali ke pengaturan izin role, sesuaikan izin role "Mitra", seperti tabel data, lihat bagaimana membuat Tom memiliki izin komentar, sambil memastikan tidak akan mempengaruhi operasi pembatasannya pada tugas lain.

Cepat coba! Kami akan mengungkap jawabannya pada konten selanjutnya.

Pada bab berikutnya, kita juga akan mengimplementasikan fitur "Dinamika Anggota", dan memperkenalkan modul fitur kuat lainnya — [**Workflow**](https://docs-cn.nocobase.com/handbook/workflow). Melalui Workflow, Anda dapat merealisasikan alur dinamis data, memicu berbagai operasi, membuat sistem secara otomatis menangani proses bisnis yang membosankan. Siap melanjutkan eksplorasi? Sampai jumpa di [Bab 7: Workflow — Memberdayakan Otomatis, Lompatan Efisiensi](https://www.nocobase.com/cn/blog/task-tutorial-workflow)!

---

Lanjutkan menjelajah, salurkan kreativitas Anda! Jika menemui masalah, jangan lupa kapan saja Anda dapat mengakses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi.
