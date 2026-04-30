# Bab 6: Workflow — Membuat Sistem Bekerja Otomatis

Pada bab sebelumnya kita telah menambahkan izin pada sistem, role yang berbeda melihat konten yang berbeda. Tetapi semua operasi masih dikerjakan secara manual — ada tiket baru harus dilihat sendiri, status berubah tidak ada yang tahu.

Pada bab ini, kita gunakan [Workflow](/workflow) NocoBase untuk membuat sistem **bekerja secara otomatis** — mengonfigurasi node [kondisi](/workflow/nodes/condition) dan [auto update](/workflow/nodes/update), merealisasikan alur status tiket otomatis dan pencatatan waktu pembuatan otomatis.

## 6.1 Apa itu [Workflow](/workflow)

Workflow adalah aturan otomasi "jika... maka...".

Sebagai analogi: di handphone Anda mengatur alarm, setiap pagi pukul 8 berbunyi. Alarm adalah Workflow paling sederhana — **kondisi terpenuhi (sampai pukul 8), maka secara otomatis dieksekusi (berbunyi)**.

Workflow NocoBase juga memiliki konsep yang sama:

![06-workflows-2026-03-20-13-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-20-13-25-38.jpg)

- **[Trigger](/workflow/triggers/collection)**: Entry point Workflow. Misalnya "ada yang membuat tiket baru" atau "data tertentu diupdate"
- **Kondisi**: Langkah filter opsional. Misalnya "hanya saat penangani tidak kosong baru lanjut"
- **Action Eksekusi**: Langkah yang benar-benar bekerja. Misalnya "kirim notifikasi" atau "update field tertentu"

Action eksekusi Workflow dapat menghubungkan beberapa node, tipe node yang sering digunakan:

- **Kontrol Alur**: kondisi, parallel branch, loop, delay
- **Operasi Data**: tambah data, update data, query data, hapus data
- **Notifikasi dan Eksternal**: notifikasi, HTTP Request, kalkulasi

Tutorial ini hanya menggunakan beberapa yang paling umum, setelah belajar mengombinasikannya bisa menangani sebagian besar skenario.

### Daftar Tipe Trigger

NocoBase menyediakan beberapa tipe trigger, dipilih saat membuat Workflow:

| Trigger | Penjelasan | Skenario Umum |
|-------|------|---------|
| [**Event Tabel Data**](/workflow/triggers/collection) | Trigger saat data ditambah, diupdate, atau dihapus | Notifikasi tiket baru, mencatat perubahan status |
| [**Scheduled Task**](/workflow/triggers/schedule) | Trigger berdasarkan ekspresi Cron atau waktu tetap | Membuat laporan harian setiap hari, membersihkan data kedaluwarsa secara berkala |
| [**Event Setelah Action**](/workflow/triggers/action) | Trigger setelah pengguna mengeksekusi action di antarmuka | Kirim notifikasi setelah submit form, mencatat log operasi |
| **Approval** | Memulai alur approval, mendukung approval multi-level | Approval cuti, approval pembelian |
| **Action Kustom** | Terhubung ke tombol kustom, klik untuk trigger | Arsip satu klik, operasi batch |
| **Event Sebelum Action** | Mencegat operasi pengguna, eksekusi sinkron lalu izinkan | Validasi sebelum submit, auto-fill field |
| **AI Employee** | Menyediakan Workflow sebagai tool untuk AI Employee dipanggil | AI mengeksekusi operasi bisnis secara otomatis |

Tutorial ini akan menggunakan dua trigger: **Event Tabel Data** dan **Event Action Kustom**, penggunaan tipe lain serupa, setelah belajar bisa diaplikasikan ke kasus lain.

Workflow NocoBase adalah Plugin bawaan, tidak perlu instalasi tambahan, langsung bisa digunakan.

## 6.2 Skenario Pertama: Notifikasi Penangani Tiket Baru Otomatis

**Kebutuhan**: Ketika seseorang membuat tiket baru, dan menentukan penangani, sistem secara otomatis mengirim pesan internal kepada penangani, agar dia tahu "ada tugas datang".

### Langkah Pertama: Membuat Workflow

Buka menu konfigurasi Plugin di pojok kanan atas, masuk ke **Manajemen Workflow**.

![06-workflows-2026-03-14-23-50-45](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-50-45.png)


Klik **Tambah Baru**, di dialog yang muncul:

- **Nama**: isi "Notifikasi Penangani Tiket Baru"
- **Tipe Trigger**: pilih **Event Tabel Data**

![06-workflows-2026-03-14-23-53-37](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-53-37.png)


Setelah submit, klik link **Konfigurasi** di list, masuk ke antarmuka edit Workflow.

### Langkah Kedua: Mengonfigurasi Trigger

Klik kartu trigger di bagian atas, buka drawer konfigurasi:

- **[Tabel Data](/data-sources/data-modeling/collection)**: pilih Data Source Utama / "Tiket"
- **Waktu Trigger**: pilih "Setelah tambah atau update data"
- **[Field](/data-sources/data-modeling/collection-fields) yang berubah**: centang "Penangani (Assignee)" — hanya saat field penangani berubah baru trigger, menghindari notifikasi yang tidak perlu dari modifikasi field lain (saat tambah data baru, semua field dianggap berubah, jadi membuat tiket baru juga akan trigger)
- **Trigger jika memenuhi kondisi berikut**: mode pilih "Memenuhi **kondisi mana saja** dalam grup", tambahkan dua kondisi:
  - `assignee_id` tidak kosong
  - `Assignee / ID` tidak kosong

  > Mengapa harus konfigurasi dua kondisi? Karena saat trigger di form mungkin hanya ada foreign key (assignee_id) tanpa query objek asosiasi, atau ada objek asosiasi tetapi field foreign key kosong. Dua kondisi dengan relasi OR, memastikan selama penangani ditentukan pasti trigger.

- **Pre-load Data Asosiasi**: centang "Assignee" — node notifikasi selanjutnya membutuhkan informasi penangani, harus di-load terlebih dahulu di trigger

![06-workflows-2026-03-14-23-58-31](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-58-31.png)

Klik simpan. Dengan demikian, trigger sendiri sudah menyelesaikan kondisi — hanya saat penangani tidak kosong baru trigger, tidak perlu menambahkan node kondisi tambahan.

### Langkah Ketiga: Menambahkan Node Notifikasi

Klik **+** di bawah trigger, pilih node **Notifikasi**.

![06-workflows-2026-03-15-00-00-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-00-55.png)

Buka konfigurasi node notifikasi, item pertama adalah memilih **Channel Notifikasi** — tetapi kita belum membuat channel apa pun, dropdown kosong. Mari buat satu terlebih dahulu.

![06-workflows-2026-03-15-00-10-12](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-10-12.png)


### Langkah Keempat: Membuat Channel Notifikasi

NocoBase mendukung beberapa tipe channel notifikasi:

| Tipe Channel | Penjelasan |
|---------|------|
| **Pesan Internal** | Notifikasi dalam browser, push real-time ke pusat notifikasi pengguna |
| **Email** | Mengirim email melalui SMTP, perlu konfigurasi email server |

Tutorial ini menggunakan channel paling sederhana yaitu **Pesan Internal**:

1. Buka pengaturan Plugin di pojok kanan atas, masuk ke **Manajemen Notifikasi**
2. Klik **Tambah Channel**

![06-workflows-2026-03-15-00-13-07](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-13-07.png)

3. Tipe channel pilih **Pesan Internal**, isi nama channel (seperti "Pesan Internal Sistem")
4. Simpan

![06-workflows-2026-03-15-00-17-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-17-55.png)

### Langkah Kelima: Mengonfigurasi Node Notifikasi

Kembali ke halaman edit Workflow, buka konfigurasi node notifikasi.

Node notifikasi memiliki opsi konfigurasi berikut:

- **Channel Notifikasi**: pilih "Pesan Internal Sistem" yang baru saja dibuat
- **Penerima**: klik pilih Query Pengguna → "id = Variabel Trigger / Data Trigger / Penanggung Jawab / ID"
- **Judul**: isi judul notifikasi, seperti "Anda memiliki tiket baru yang perlu ditangani". Mendukung penyisipan variabel, misalnya menambahkan judul tiket: `Tiket baru: {{Data Trigger / Judul}}`
- **Konten**: isi isi notifikasi, juga dapat menyisipkan variabel untuk merefer prioritas tiket, deskripsi, dan field lainnya

![06-workflows-2026-03-15-20-10-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-10-11.png)

(Langkah selanjutnya kita akan mencari URL tiket, sebelum keluar dari popup, ingat untuk menyimpan terlebih dahulu!)

- **Halaman Detail Desktop**: isi path URL halaman detail tiket. Cara mendapatkan: di frontend buka popup detail tiket apa pun, salin path di kolom alamat browser, format mirip `/admin/camcwbox2uc/view/d8f8e122d37/filterbytk/353072988225540`. Tempel path ke kolom konfigurasi, di mana angka setelah `filterbytk/` adalah ID tiket — ganti bagian ini dengan variabel ID data trigger (klik selektor variabel → Data Trigger → ID). Setelah dikonfigurasi, pengguna mengklik notifikasi tersebut di list notifikasi akan langsung melompat ke halaman detail tiket yang sesuai, sekaligus otomatis ditandai sudah dibaca

![06-workflows-2026-03-15-00-28-32](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-28-32.png)

![06-workflows-2026-03-15-20-15-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-15-19.png)

- **Lanjut Saat Pengiriman Gagal**: opsional, setelah dicentang meskipun pengiriman notifikasi gagal, Workflow tidak akan terhenti

> Setelah notifikasi dikirim, penangani dapat melihat pesan ini di **Pusat Notifikasi** di pojok kanan atas halaman, yang belum dibaca akan ada penanda dot merah. Klik notifikasi akan melompat ke halaman detail tiket untuk melihat informasi lengkap.

### Langkah Keenam: Menguji dan Mengaktifkan

> Alur lengkap skenario pertama hanya dua node: trigger (termasuk filter kondisi) → notifikasi. Sederhana dan langsung.

Jangan terburu-buru aktifkan — Workflow menyediakan fitur **Eksekusi Manual** yang dapat menggunakan data tertentu untuk menguji apakah alur benar:

1. Klik tombol **Eksekusi** di pojok kanan atas (bukan switch aktivasi)
2. Pilih satu data tiket yang sudah ada sebagai data trigger
  > Jika di kolom pemilihan tiket yang ditampilkan adalah id, di Data Source > Tabel Data > Tiket, atur kolom "Judul" sebagai field judul
![06-workflows-2026-03-15-19-47-57](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-47-57.png)

3. Klik eksekusi, Workflow akan dieksekusi dan otomatis beralih ke versi baru yang disalin
![06-workflows-2026-03-15-19-57-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-57-19.png)

4. Klik tiga titik di pojok kanan atas, pilih Riwayat Eksekusi. Saat ini seharusnya bisa melihat catatan eksekusi yang baru saja kita lakukan, setelah klik untuk melihat, bisa melihat detail eksekusi termasuk situasi trigger, detail eksekusi setiap node, parameter.
![06-workflows-2026-03-15-19-58-34](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-58-34.png)

![06-workflows-2026-03-15-20-01-02](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-01-02.png)


5. Tiket tadi sepertinya untuk Alice, mari kita beralih ke akun Alice untuk melihatnya, berhasil diterima!

![06-workflows-2026-03-15-20-16-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-22.png)

Klik akan melompat ke halaman tiket target, sekaligus notifikasi akan otomatis ditandai sudah dibaca.

![06-workflows-2026-03-15-20-16-54](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-54.png)


Setelah memastikan alur tidak ada masalah, klik switch **Aktif/Nonaktif** di pojok kanan atas, ubah Workflow ke status aktif.

![06-workflows-2026-03-15-20-18-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-18-16.png)

> **Perhatian**: Workflow setelah pernah dieksekusi (termasuk eksekusi manual), akan menjadi status **read-only** (abu-abu), tidak dapat diedit lagi. Jika perlu modifikasi, klik **"Salin ke Versi Baru"** di pojok kanan atas, lanjutkan edit di versi baru. Versi lama akan otomatis dinonaktifkan.

![06-workflows-2026-03-15-20-19-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-19-11.png)

Kembali ke halaman tiket, buat tiket baru, ingat pilih satu penangani. Kemudian beralih ke akun penangani untuk login, periksa pusat notifikasi — seharusnya bisa melihat notifikasi baru.

![06-workflows-2026-03-15-20-22-00](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-22-00.gif)

Selamat, alur otomatis pertama sudah berjalan!

## 6.3 Skenario Kedua: Mencatat Waktu Selesai Otomatis Saat Status Berubah

**Kebutuhan**: Ketika status tiket berubah menjadi "Selesai", sistem secara otomatis mengisi waktu saat ini di field "Waktu Selesai". Dengan demikian tidak perlu mencatat secara manual, dan tidak akan lupa.

> Jika Anda belum membuat field "Waktu Selesai" di tabel tiket, tambahkan terlebih dahulu satu field tipe **Tanggal** di **Manajemen Tabel Data → Tiket**, beri nama "Waktu Selesai". Untuk langkah detail lihat metode pembuatan field di Bab 2, tidak akan diulang di sini.
> ![06-workflows-2026-03-15-20-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-25-38.png)

### Langkah Pertama: Buat Workflow Baru

Kembali ke halaman manajemen Workflow, klik tambah baru:

- **Nama**: isi "Tiket Selesai Otomatis Catat Waktu"
- **Tipe Trigger**: pilih **Event Action Kustom** (trigger saat pengguna mengklik tombol yang terhubung ke Workflow ini)
- **Mode Eksekusi**: Sinkron
> Tentang sinkron dan asinkron:
> - Asinkron: setelah operasi, kita dapat melanjutkan melakukan hal lain, Workflow setelah eksekusi otomatis memberi tahu kita hasilnya
> - Sinkron: setelah operasi, antarmuka akan dalam mode menunggu, kita harus menunggu Workflow selesai dieksekusi sebelum bisa melakukan hal lain

![06-workflows-2026-03-19-22-56-34](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-56-34.png)

### Langkah Kedua: Mengonfigurasi Trigger

Buka konfigurasi trigger:

- **Tabel Data**: pilih "Tiket"
- **Mode Eksekusi**: pilih **Mode Single Row** (setiap kali hanya memproses satu tiket yang diklik saat ini)

![06-workflows-2026-03-19-22-58-21](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-58-21.png)

<!-- TODO: Tambahkan screenshot konfigurasi trigger -->


### Langkah Ketiga: Menambahkan Kondisi

Berbeda dengan trigger event tabel data yang sendirinya sudah berisi kondisi, kita perlu menambahkan node kondisi sendiri:

![06-workflows-2026-03-15-20-39-14](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-39-14.png)

Kami merekomendasikan memilih "'Ya' dan 'Tidak' lanjut secara terpisah", untuk memudahkan ekstensi selanjutnya.

- Kondisi: **Data Trigger → Status** tidak sama dengan **Selesai** (yaitu hanya tiket yang belum selesai akan lewat, yang sudah selesai tidak akan diproses berulang)

![06-workflows-2026-03-19-22-37-59](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-37-59.png)

### Langkah Keempat: Menambahkan Node Update Data

Pada cabang "Ya" dari kondisi, klik **+**, pilih node **Update Data**:

![06-workflows-2026-03-15-20-46-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-46-22.png)

- **Tabel Data**: pilih "Tiket"
- **Kondisi Filter**: ID sama dengan Data Trigger → ID (memastikan hanya update tiket saat ini)
- **Nilai Field**:
  - Status = **Selesai**
  - Waktu Selesai = **Variabel Sistem / Waktu Sistem**

![06-workflows-2026-03-19-22-39-27](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-39-27.png)

> Dengan satu node ini sekaligus menyelesaikan dua hal "ubah status" dan "catat waktu", tidak perlu mengonfigurasi nilai field secara terpisah pada tombol.

### Langkah Kelima: Membuat Tombol Action "Selesai"

Workflow sudah dikonfigurasi, tetapi "Event Action Kustom" perlu dihubungkan ke tombol action konkret untuk dapat trigger. Kita buat tombol "Selesai" khusus di kolom action daftar tiket:

1. Masuk ke mode UI Editor, di kolom action tabel tiket, klik **"+"**, pilih tombol action **"Trigger Workflow"**

![06-workflows-2026-03-19-22-41-31](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-41-31.png)

2. Klik konfigurasi tombol, ubah judul menjadi **"Selesai"**, dan pilih ikon kecil terkait selesai (seperti ikon checkmark)

![06-workflows-2026-03-19-22-43-39](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-43-39.png)

3. Konfigurasi **Aturan Linkage** untuk tombol: ketika status tiket sudah "Selesai", sembunyikan tombol ini (tiket yang sudah selesai tidak perlu diklik "Selesai" lagi)
   - Kondisi: Data Saat Ini → Status sama dengan Selesai
   - Action: Sembunyikan

![06-workflows-2026-03-15-21-15-29](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-15-29.png)

4. Buka **"Hubungkan Workflow"** di konfigurasi tombol, pilih Workflow "Tiket Selesai Otomatis Catat Waktu" yang baru saja kita buat

![06-workflows-2026-03-19-23-00-53](https://static-docs.nocobase.com/06-workflows-2026-03-19-23-00-53.png)

### Langkah Keenam: Mengonfigurasi Refresh Event Stream

Tombol sudah dibuat, tetapi setelah klik tabel tidak akan refresh otomatis — pengguna tidak melihat perubahan status. Kita perlu mengonfigurasi **Event Stream** tombol agar otomatis refresh tabel setelah Workflow selesai dieksekusi.

1. Klik simbol petir kedua (⚡) di konfigurasi tombol, buka konfigurasi **Event Stream**
2. Konfigurasi event trigger:
   - **Event Trigger**: pilih **Klik**
   - **Waktu Eksekusi**: pilih **Setelah Semua Stream**
3. Klik **"Tambah Langkah"**, pilih **"Refresh Block Target"**

![06-workflows-2026-03-20-16-46-59](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-46-59.png)

4. Temukan tabel tiket di halaman saat ini, buka menu konfigurasinya, pilih **"Salin UID"** di paling bawah, tempel UID ke Block target di langkah refresh

![06-workflows-2026-03-20-16-48-39](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-48-39.png)

Dengan demikian, setelah klik tombol "Selesai", Workflow selesai dieksekusi, tabel akan otomatis refresh, pengguna langsung dapat melihat perubahan status dan waktu selesai.

### Langkah Ketujuh: Aktifkan dan Uji

Kembali ke halaman manajemen Workflow, aktifkan Workflow "Tiket Selesai Otomatis Catat Waktu".

Kemudian buka tiket dengan status "Sedang Diproses", klik tombol **"Selesai"** di kolom Action. Dapat dilihat:

- Field "Waktu Selesai" tiket otomatis terisi waktu saat ini
- Tabel otomatis refresh, tombol "Selesai" pada tiket ini sudah hilang (aturan linkage berlaku)

![06-workflows-2026-03-15-21-25-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-11.gif)

Bukankah sangat praktis? Inilah penggunaan kedua dari Workflow yang umum — **Update Data Otomatis**. Dan melalui cara "Event Action Kustom + Hubungkan Tombol", kita merealisasikan mekanisme trigger yang akurat: hanya klik tombol tertentu yang akan mengeksekusi Workflow.

## 6.4 Melihat Riwayat Eksekusi

Workflow sudah berjalan berapa kali? Apakah ada error? NocoBase akan menyimpan semuanya untuk Anda.

Di list manajemen Workflow, di belakang setiap Workflow ada link angka **Jumlah Eksekusi**. Klik, dapat melihat catatan detail setiap eksekusi:

- **Status Eksekusi**: berhasil (hijau) atau gagal (merah), terlihat sekilas
- **Waktu Trigger**: kapan di-trigger
- **Detail Node**: klik bisa melihat hasil eksekusi setiap node

![06-workflows-2026-03-15-21-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-38.png)

Jika eksekusi tertentu gagal, klik detail untuk melihat node mana yang bermasalah, beserta informasi error spesifik. Ini adalah tool terpenting untuk debug Workflow.

![06-workflows-2026-03-15-21-36-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-36-16.png)

## Ringkasan

Pada bab ini kita telah membuat dua Workflow yang sederhana tetapi praktis:

- **Notifikasi Tiket Baru** (trigger event tabel data): otomatis memberi tahu setelah dibuat atau penangani diubah, tidak perlu lagi memberi tahu secara manual
- **Auto Catat Waktu Selesai** (trigger event action kustom): otomatis mengisi waktu setelah klik tombol "Selesai", mencegah human error

Dua Workflow secara terpisah mendemonstrasikan dua cara trigger yang berbeda, total kurang dari 10 menit konfigurasi, sistem sudah dapat bekerja secara otomatis. NocoBase juga mendukung lebih banyak tipe node (HTTP Request, kalkulasi, loop, dll.), tetapi untuk pemula, menguasai kombinasi ini sudah cukup untuk sebagian besar skenario.

## Pratinjau Bab Berikutnya

Sistem sudah dapat bekerja otomatis, tetapi kita masih kekurangan "perspektif global" — total ada berapa tiket? Kategori mana paling banyak? Berapa baru ditambah setiap hari? Bab berikutnya kita gunakan [Block](/interface-builder/blocks) chart untuk membangun **Dashboard Data**, melihat keseluruhan dengan sekilas.

## Sumber Daya Terkait

- [Ikhtisar Workflow](/workflow) — Konsep inti Workflow dan skenario penggunaan
- [Trigger Event Tabel Data](/workflow/triggers/collection) — Konfigurasi trigger perubahan data
- [Node Update Data](/workflow/nodes/update) — Konfigurasi update data otomatis
