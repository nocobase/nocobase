# Bab 5: Tab dan Block Dinamis

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113544406238001&bvid=BV1RfzNYLES5&cid=27009811403&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Teman-teman, selamat datang di Bab 5! Bab ini sangat menarik, kita akan menambahkan lebih banyak fitur untuk halaman manajemen tugas, mendukung berbagai cara tampilan view yang berbeda. Saya yakin Anda sudah menantikannya, kan? Jangan terburu-buru, saya akan membawa Anda mengimplementasikannya langkah demi langkah, seperti biasa, mari kita selesaikan dengan mudah bersama-sama!

### 5.1 Container Tab, Menampung Berbagai Block

Kita telah membuat halaman manajemen tugas, tetapi untuk membuat sistem lebih intuitif, kita berharap tugas dapat beralih mode tampilan yang berbeda dalam halaman, seperti [**Tabel**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table), [**Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**Kalender**](https://docs-cn.nocobase.com/handbook/calendar), bahkan [**Gantt Chart**](https://docs-cn.nocobase.com/handbook/block-gantt). Fitur tab NocoBase memungkinkan kita untuk beralih antara susunan Block yang berbeda dalam halaman yang sama, jangan khawatir, kita akan beroperasi pelan-pelan.

- Membuat Tab
  Pertama, mari buat tab.

1. **Tambahkan Sub-tab**:

   - Buka halaman manajemen tugas Anda sebelumnya, buat sub-tab dalam halaman. Tab pertama dapat kita beri nama **"View Tabel"**, view ini menampilkan Block daftar tugas yang sudah kita atur.
2. **Buat Tab Baru Lagi**:

   - Selanjutnya, mari buat satu tab lagi, beri nama **"View Kanban"**. Kita akan membuat Block kanban tugas di sini.
     ![Buat Tab](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172155490.gif)

Siap? Mari masuk ke pembuatan berbagai Block!

> **Pengenalan Block:** Block adalah wadah data dan konten, menampilkan data dengan cara yang sesuai di website, dapat diletakkan di halaman (Page), dialog (Modal), atau drawer (Drawer), beberapa Block dapat di-drag dan diatur dengan bebas, dengan terus mengoperasikan data dalam Block dapat merealisasikan berbagai konfigurasi dan tampilan.
> Dengan menggunakan fitur Block di NocoBase, diaplikasikan dalam studi kasus pembelajaran ini, dapat lebih cepat merealisasikan dan mengelola pembangunan halaman dan fitur sistem, sekaligus Block dapat diatur sebagai template untuk kemudahan duplikasi dan referensi, sangat mengurangi pekerjaan pembuatan Block.

### 5.2 Block Kanban: Status Tugas Terlihat Sekilas

[**Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban) adalah salah satu fitur sangat penting di sistem manajemen tugas, dapat memungkinkan Anda mengelola status tugas secara intuitif dengan cara drag. Contohnya, Anda dapat group berdasarkan status tugas, langsung melihat tugas mana di tahap mana.

#### 5.2.1 Pembuatan Block Kanban

1. **Mulai Buat Block Kanban Baru**:

- Pada tab **View Kanban**, klik "Buat Block", pilih tabel tugas, selanjutnya akan muncul opsi, menanyakan field mana yang ingin Anda gunakan untuk grouping tugas.

2. **Pilih Field Grouping**:

- Kita pilih field **Status** yang sudah dibuat sebelumnya, group berdasarkan status tugas. (Perhatikan, field grouping hanya bisa tipe ["Dropdown (Pilihan Tunggal)"](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select) atau ["Radio Button"](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/radio-group))

3. **Tambahkan Field Sorting**:

- Card di kanban dapat menyesuaikan urutan melalui field sorting. Untuk merealisasikan fitur ini, kita perlu membuat field sorting baru. Klik "Tambah Field", buat satu field bernama **Sorting Status (status_sort)**.
- Field ini untuk menentukan urutan atas-bawah card saat drag kanban, seperti koordinat, kiri-kanan group adalah status berbeda, posisi atas-bawah adalah nilai sorting. Setelah kita drag card kemudian, dapat mengamati perubahan nilai sorting di form.
  ![Buat Block Kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156926.gif)

#### 5.2.2 Centang Field dan Action

- Akhirnya, ingat untuk centang field yang perlu ditampilkan di Block kanban, seperti nama tugas, status tugas, dll., memastikan informasi card kaya dan lengkap.

![Tampilan Field Kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156326.gif)

### 5.3 Menggunakan Template: Duplikasi dan Referensi

Setelah membuat Block kanban baru, kita perlu membuat **Form Tambah Baru**. Di sini, NocoBase menyediakan fitur yang sangat nyaman — Anda dapat [**duplikasi** atau **referensi**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) template form sebelumnya, dengan demikian kita tidak perlu konfigurasi ulang setiap kali.

#### 5.3.1 **Simpan Form sebagai Template**

- Pada form tambah baru sebelumnya, arahkan mouse ke konfigurasi form, klik "Simpan sebagai Template". Anda dapat memberi nama template, contohnya "Form Tabel Tugas Tambah Baru".

![Simpan Form sebagai Template](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156356.gif)

#### 5.3.2 **Duplikasi atau Referensi Template**

Saat membuat form baru di view kanban, Anda akan melihat dua opsi: "**Duplikasi Template**" dan "**Referensi Template**". Anda mungkin bertanya: apa perbedaannya?

- [**Duplikasi Template**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): Setara dengan menduplikasi salinan form baru, Anda dapat memodifikasinya secara independen, tidak akan mempengaruhi form asli.
- [**Referensi Template**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): "Meminjam" form asli secara langsung, modifikasi apa pun akan disinkronkan ke tempat lain yang merefer template ini. Misalnya Anda memodifikasi urutan field, semua form yang merefer template ini akan ikut berubah.

![Duplikasi dan Referensi Template](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157435.gif)

Anda dapat memilih duplikasi atau referensi template sesuai kebutuhan Anda. Umumnya, **referensi template** lebih nyaman, karena Anda hanya perlu memodifikasi sekali, semua tempat akan tersinkronisasi, sangat menghemat waktu dan tenaga.

### 5.4 Block Kalender: Progres Tugas Terlihat Sekilas

Selanjutnya, mari kita buat satu [**Block Kalender**](https://docs-cn.nocobase.com/handbook/calendar), membantu Anda mengelola jadwal waktu tugas dengan lebih baik.

#### 5.4.1 Membuat View Kalender

##### 5.4.1.1 **Membuat Field Tanggal Baru**:

View kalender perlu mengetahui **Tanggal Mulai** dan **Tanggal Selesai** tugas, oleh karena itu kita perlu menambahkan dua field di tabel tugas:

- **Tanggal Mulai (start_date)**: Menandai waktu mulai tugas.
- **Tanggal Selesai (end_date)**: Menandai waktu selesai tugas.

![Tambah Field Tanggal](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157585.png)

#### 5.4.2 Membuat Block Kalender:

Kembali ke view kalender, buat satu Block kalender, pilih tabel tugas, dan gunakan field **Tanggal Mulai** dan **Tanggal Selesai** yang baru saja dibuat. Dengan demikian, tugas akan ditampilkan sebagai rentang durasi waktu di kalender, secara intuitif menampilkan progres tugas.

![Membangun View Kalender](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157957.gif)

#### 5.4.3 Mengalami Operasi Kalender:

Pada kalender, Anda dapat dengan bebas drag tugas, klik dan edit informasi detail tugas (jangan lupa duplikasi atau referensi template).

![Operasi Kalender](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158379.gif)

### 5.5 Block Gantt Chart: Tool Hebat untuk Mengelola Progres Tugas

Block terakhir adalah [**Block Gantt Chart**](https://docs-cn.nocobase.com/handbook/block-gantt), yang merupakan tool yang sering digunakan dalam manajemen proyek, membantu Anda melacak progres tugas dan hubungan ketergantungan.

#### 5.5.1 Membuat Tab "View Gantt Chart"

#### 5.5.2 **Tambahkan Field "Persentase Selesai"**:

Untuk membuat Gantt Chart lebih baik menampilkan progres tugas, kita perlu menambahkan satu field bernama **Persentase Selesai (complete_percent)**. Field ini digunakan untuk mencatat progres penyelesaian tugas, nilai default 0%.

![Tambah Field Persentase Selesai](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158044.gif)

#### 5.5.3 **Buat Block Gantt Chart**:

Pada view Gantt Chart, buat satu Block Gantt Chart, pilih tabel tugas, dan konfigurasi field tanggal mulai, tanggal selesai, dan persentase selesai yang relevan.

![Membangun View Gantt Chart](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158860.gif)

#### 5.5.4 **Mengalami Fitur Drag Gantt Chart**:

Pada Gantt Chart, Anda dapat menyesuaikan progres dan waktu tugas dengan drag tugas, tanggal mulai, tanggal selesai, dan persentase selesai tugas akan ikut terupdate.

![Drag Gantt Chart](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172159140.gif)

### Ringkasan

Hebat! Anda sekarang telah menguasai cara menggunakan berbagai Block di NocoBase untuk menyajikan data tugas, termasuk [**Block Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**Block Kalender**](https://docs-cn.nocobase.com/handbook/calendar), dan [**Block Gantt Chart**](https://docs-cn.nocobase.com/handbook/block-gantt). Block-block ini tidak hanya membuat manajemen tugas lebih intuitif, tetapi juga memberikan fleksibilitas yang besar untuk kita.

Tetapi ini baru permulaan! Bayangkan, dalam sebuah tim, anggota yang berbeda mungkin memiliki tanggung jawab yang berbeda, bagaimana memastikan setiap orang dapat berkolaborasi tanpa gangguan? Bagaimana memastikan keamanan data sambil memungkinkan setiap orang hanya melihat dan mengoperasikan konten yang relevan dengan dirinya?

Siap? Mari kita masuk ke bab berikutnya: [Bab 6: Mitra — Kolaborasi Tanpa Gangguan, Kontrol Fleksibel](https://www.nocobase.com/cn/tutorials/task-tutorial-user-permissions).

Lihat bagaimana melalui operasi sederhana, membawa kolaborasi tim kita ke level yang lebih tinggi!

---

Lanjutkan menjelajah, salurkan kreativitas Anda! Jika menemui masalah, jangan lupa kapan saja Anda dapat mengakses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi.
