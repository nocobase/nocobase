# Bab 10: Filter Dashboard dan Kondisi

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Dalam bab ini, kami akan memandu Anda langkah demi langkah untuk menyelesaikan bagian berikutnya dari Dashboard Task. Jika ada pertanyaan, jangan ragu untuk bertanya di forum kapan saja.

Mari kita mulai dengan meninjau ulang materi dari bab sebelumnya, dan memulai perjalanan eksplorasi ini bersama!

### 10.1 Mengungkap Jawaban Bab Sebelumnya

#### 10.1.1 Status dan Tautan

Pertama, kita perlu menambahkan tautan untuk data dengan status berbeda agar memudahkan navigasi cepat. Berikut adalah struktur tautan untuk setiap status:

(Asumsikan tautan kita adalah `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x`)

##### Jawaban Tantangan


| Status<br/>       | Tautan<br/>                                          |
| ----------------- | ---------------------------------------------------- |
| Belum dimulai<br/>| hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>  |
| Sedang berjalan<br/>| hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>|
| Menunggu review<br/>| hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br>|
| Selesai<br/>      | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>    |
| Dibatalkan<br/>   | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>    |
| Diarsipkan<br/>   | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>     |

#### 10.1.2 Menambahkan Fungsi Multi-pilih Penanggung Jawab

1. **Buat [Field Kustom](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)**: Kita perlu membuat Field "Penanggung Jawab" dengan tipe multi-pilih, dan mengisi nickname (atau username) anggota agar dapat dengan cepat memilih orang yang sesuai saat menugaskan task.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **Pada konfigurasi laporan**: Atur "Penanggung Jawab/Nickname termasuk Filter saat ini/Penanggung Jawab" sebagai kondisi filter. Dengan ini, Anda dapat dengan cepat menemukan task yang terkait dengan Penanggung Jawab saat ini.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

Filter beberapa kali secara acak untuk memastikan fungsi ini bekerja dengan benar.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 Mengaitkan Dashboard dengan Pengguna

Kita dapat menampilkan konten yang berbeda berdasarkan pengguna yang berbeda, dengan cara berikut:

1. **Atur nilai default Field "Penanggung Jawab" menjadi "Pengguna saat ini/Nickname"**: Hal ini memungkinkan sistem secara otomatis menampilkan task yang terkait dengan pengguna saat ini, sehingga meningkatkan efisiensi operasi.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **Setelah halaman di-refresh**: Dashboard akan secara otomatis memuat data yang terkait dengan pengguna yang sedang login. (Ingat untuk menambahkan kondisi filter pengguna pada chart yang diperlukan)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 Refactor Filter Task

Beberapa teman mungkin menemukan desain yang kurang masuk akal:

Setelah pindah dari "Atur Rentang Data" pada Block tabel secara langsung, task kita akan dibatasi terlebih dahulu pada rentang status yang sesuai. Pada saat ini, jika kita memfilter status lain, ternyata datanya kosong!

Bagaimana solusinya? Mari kita hapus filter data dan beralih ke metode filter lain!

1. **Hapus metode filter data**: Hindari data status terkunci dalam rentang saat ini, dan sesuaikan kebutuhan filter secara fleksibel.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **Konfigurasikan nilai default pada Block filter form.**

Masih ingat dengan [Block Filter](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) kita?

Buat Block form baru untuk memfilter tabel task, konfigurasikan **Status** dan Field lain yang Anda butuhkan, yang akan kita gunakan untuk mengisi variabel yang dibawa URL. (Ingat untuk menghubungkan Block tabel task yang akan difilter)

- Atur nilai default Field status menjadi `URL search params/task_status`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **Uji fungsi filter baru**: Anda dapat mengganti kondisi filter status kapan saja dan beralih dengan bebas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **Opsional**: Jika Anda ingin setiap pengguna fokus pada task mereka sendiri, Anda juga dapat mengatur nilai default Field "Penanggung Jawab" menjadi "Pengguna saat ini".

---

### 10.4 Fokus pada Berita, Notifikasi, dan Informasi

Mari kita ubah library dokumen! Tampilkan informasi yang kita butuhkan ke Dashboard~

Dalam pengelolaan dokumen jangka panjang, kita akan menemui semakin banyak materi dan dokumen. Pada saat itu, kita akan secara bertahap memiliki berbagai kebutuhan:

- News: Fokus pada dinamika proyek, pencapaian, dan tonggak penting
- Pengumuman/pengingat sementara

#### 10.4.1 Informasi Hot (News)

1. **Tambahkan Field "Informasi Hot"**: Tambahkan Field checkbox "Informasi Hot" di tabel dokumen untuk menandai apakah dokumen tersebut merupakan berita penting.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **Tambah dan pilih informasi dokumen**: Pilih artikel secara acak, tambahkan Field "Informasi Hot" di form edit, dan centang.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **Buat Block "List" baru**: Kembali ke Dashboard, buat [Block "List"](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) baru > pilih tabel dokumen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

Drag ke kanan, tampilkan "Tanggal Dibuat" dan "Judul", sesuaikan lebar Field, dan tutup "Tampilkan Judul"

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **Tampilkan informasi hot**:

Untuk merefleksikan real-time, kita dapat menampilkan waktu sekaligus.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

Urutkan secara descending berdasarkan tanggal dibuat untuk menampilkan berita hot terbaru.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

Sebuah informasi hot sederhana telah selesai. Anggota dapat mengikuti perkembangan penting dari seluruh proyek kapan saja!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 Pengumuman dan Notifikasi

Selanjutnya adalah fungsi pengumuman publik sederhana. Anda mungkin sudah sering melihatnya di Demo online kami. Untuk pemberitahuan sementara seperti ini, kita tidak ingin menampilkannya dalam jangka panjang, dan tidak perlu mencatat kemajuan proyek. Hanya digunakan untuk pengingat/pemberitahuan hal-hal sementara.

1. **Buat [Block Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) baru**: Pilih area mana saja di Dashboard, gunakan sintaks Markdown untuk menambahkan konten pengumuman.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

Untuk penggunaan praktis Markdown, Anda dapat merujuk pada Demo resmi kami, dokumentasi resmi, atau [tutorial "Dokumen Ringan"](https://www.nocobase.com/cn/tutorials).

Sebagai contoh sederhana, "pengumuman yang indah" yang ditulis dalam HTML akan menunjukkan kekuatan luar biasa dari [Block Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown).

- Contoh kode:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Pengumuman Penting</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Rekan-rekan yang terhormat:</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Untuk meningkatkan efisiensi kerja, kami akan mengadakan pelatihan untuk seluruh karyawan pada <span style="color: red; font-weight: bold; font-size: 1.5em;">10 November</span>.</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Terima kasih atas kerjasama Anda!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Salam hangat,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Tim Manajemen</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 Ringkasan

Melalui langkah-langkah konfigurasi di atas, kita berhasil membuat Dashboard yang dipersonalisasi, memungkinkan anggota tim untuk mengelola task secara lebih efisien, mengikuti perkembangan proyek, dan menerima pengumuman serta notifikasi tepat waktu.

Dari filter status, pengaturan Penanggung Jawab hingga tampilan informasi hot, semuanya bertujuan untuk mengoptimalkan pengalaman pengguna dan meningkatkan kemudahan serta fleksibilitas sistem.

Sampai di sini, Dashboard yang dipersonalisasi sudah siap. Anda dipersilakan untuk mencoba sendiri, menggabungkan dengan kebutuhan aktual, dan melakukan modifikasi mendalam. Mari kita masuk ke [bab berikutnya](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation)!

---

Lanjutkan eksplorasi, dan ekspresikan kreativitas Anda sepenuhnya! Jika menemui masalah, jangan lupa Anda dapat selalu merujuk pada [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi.
