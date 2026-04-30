# Bab 11: Sub-task dan Perhitungan Jam Kerja

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Teman-teman, akhirnya kita masuk ke bab baru! Seiring dengan perluasan bisnis, task semakin banyak dan kompleks. Kita mulai menyadari bahwa pengelolaan task sederhana tidak lagi cukup. Sekarang, kita perlu mengelola task dengan lebih detail, membaginya menjadi beberapa tingkatan, untuk membantu semua orang menyelesaikan task secara lebih efisien!

### 11.1 Merencanakan Task: Dari Global ke Lokal

Kita akan memecah task yang kompleks menjadi beberapa task kecil yang dapat dikelola, melacak kemajuan secara jelas untuk memahami status penyelesaian task, serta memanfaatkan manajemen multi-level untuk mendukung organisasi sub-task multi-tingkat. Sekarang, mari kita mulai merencanakan!

---

### 11.2 Membuat Tabel Sub-task

#### 11.2.1 Mendesain Struktur Sub-task

Pertama, kita membuat "Tabel Sub-task" (Sub Tasks [**Tree Table**](https://docs-cn.nocobase.com/handbook/collection-tree)) dan mendesainnya menjadi struktur tree. Atribut sub-task mirip dengan task utama, seperti "Nama Task", "Status", "Penanggung Jawab", "Progres", dan sebagainya. Sesuai kebutuhan, Anda juga dapat menambahkan komentar, dokumen, dan konten terkait lainnya.

Untuk merealisasikan hubungan antara sub-task dan task utama, kita membuat hubungan many-to-one, sehingga setiap sub-task dimiliki oleh satu task utama. Pada saat yang sama, kita mengatur hubungan terbalik untuk memudahkan melihat atau mengelola konten sub-task langsung di task utama.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> Tips: Disarankan untuk membuat melalui Block relasi di halaman task utama, lebih nyaman dalam pengoperasian!

#### 11.2.2 Menampilkan Sub-task di Antarmuka Manajemen Task

Pada antarmuka manajemen task, kita mengatur cara melihat "Tabel Task" sebagai [Mode **Halaman**](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

Buat tab "Manajemen Sub-task" baru di halaman, lalu tambahkan tabel sub-task yang kita buat, dan pilih tampilan dengan struktur tree. Dengan demikian, kita dapat mengelola dan melihat sub-task di halaman yang sama.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3. Chart Perbandingan Jam Kerja: Memprediksi Total Jam Kerja dan Progres (Opsional)

Selanjutnya, mari kita buat detail jam kerja task dan chart perbandingan jam kerja, untuk memperkirakan total jam kerja dan progres task.

#### 11.3.1 Menambahkan Informasi Waktu dan Jam Kerja Sub-task

Tambahkan Field berikut di tabel sub-task:

- **Tanggal Mulai**
- **Tanggal Selesai**
- **Total Jam Kerja**
- **Jam Kerja Tersisa**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

Dengan Field ini, durasi hari dan jam kerja task dapat dihitung secara dinamis.

#### 11.3.2 Menghitung Durasi Hari Task

Kita membuat Field [formula](https://docs-cn.nocobase.com/handbook/field-formula) "Hari" baru di tabel sub-task untuk menghitung durasi hari task.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

Cara perhitungan formula dibagi menjadi:

- Math.js

  > Menggunakan library [math.js](https://mathjs.org/), dapat menghitung formula angka yang kompleks
  >
- Formula.js

  > Menggunakan library [Formula.js](https://formulajs.info/functions/), digunakan untuk menghitung formula umum. Jika Anda terbiasa dengan formula Excel, ini akan sangat mudah!
  >
- String Template

  > Sesuai namanya, ini adalah cara penggabungan karakter. Untuk deskripsi dinamis, nomor urut, dan sebagainya, kita dapat menggunakan penggabungan ini
  >

Di sini kita dapat menggunakan library `Formula.js`, mirip formula Excel, mudah untuk menghitung formula umum.

Formula Field hari adalah:

```html
DAYS(Tanggal Selesai, Tanggal Mulai)
```

Pastikan menggunakan format huruf kecil bahasa Inggris untuk menghindari kesalahan.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

Setelah selesai, mari kita coba di halaman. Jumlah hari sudah berubah secara dinamis berdasarkan tanggal mulai dan selesai!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 Pelaporan Jam Kerja Harian: Melacak Progres Aktual (Opsional)

#### 11.4.1 Membuat Tabel Pelaporan Jam Kerja Harian

Kita membuat tabel pelaporan jam kerja harian untuk mencatat status penyelesaian task harian. Tambahkan Field berikut:

- **Jam Kerja Hari Ini** (hours, integer direkomendasikan)
- **Tanggal**
- **Jam Kerja Ideal** (ideal_hours, integer direkomendasikan)
- **Sub-task Terkait**: Hubungan [many-to-one](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) dengan sub-task.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 Menampilkan Jam Kerja Harian di Halaman Sub-task

Kembali ke halaman edit sub-task, atur tabel jam kerja harian sebagai bentuk [sub-table](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table) untuk ditampilkan, dan drag layout beberapa Field lainnya. Dengan demikian, mudah untuk mengisi dan melihat data jam kerja harian di halaman sub-task.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 Perhitungan Kunci dan Linkage Rule (Opsional)

Untuk memperkirakan progres task dan jam kerja tersisa secara lebih akurat, mari kita lakukan beberapa konfigurasi penting.

#### 11.5.1 Atur [Required](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required) untuk Field Sub-task

Tandai **Tanggal Mulai**, **Tanggal Selesai**, dan **Estimasi Jam Kerja** sebagai [required](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required) untuk memastikan kelengkapan data demi perhitungan selanjutnya.

#### 11.5.2 Atur [Linkage Rule](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule) untuk Persentase Penyelesaian dan Jam Kerja Tersisa

Tambahkan aturan perhitungan berikut di tabel sub-task:

- **Persentase Penyelesaian**: Total jam kerja harian / Estimasi jam kerja

```html
SUM([Form Saat Ini / Jam Kerja Harian / Jam Kerja Hari Ini]) / [Form Saat Ini / Estimasi Jam Kerja]
```

- **Jam Kerja Tersisa**: Estimasi jam kerja - Total jam kerja harian

```html
[Form Saat Ini / Estimasi Jam Kerja] - SUM([Form Saat Ini / Jam Kerja Harian / Jam Kerja Hari Ini])
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- Demikian pula, kita juga akan mengkonfigurasi jam kerja ideal di linkage rule jam kerja harian

```html
  [Form Saat Ini / Estimasi Jam Kerja] / [Form Saat Ini / Durasi Hari Task]
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

Dengan demikian, kita dapat menghitung progres penyelesaian task dan jam kerja tersisa secara real-time.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 Membuat Chart Persentase Progres Task (Opsional)

#### 11.6.1 Membuat [Chart](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) Progres Task

Buat Block chart baru untuk menghitung perubahan **total jam kerja harian** dan **total jam kerja ideal**, serta menampilkan progres task berdasarkan dimensi tanggal.

Batasi [Task Terkait/Id] sama dengan [ID Record Popup Saat Ini], untuk memastikan chart progres dapat mencerminkan kondisi sebenarnya dari task saat ini.

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 Menampilkan Informasi Dasar dan Perubahan Progres

Akhirnya, masih ingat dengan [Block Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) kita? Kita dapat menggunakan Block `markdown` untuk menampilkan informasi dasar dan perubahan progres task.

Gunakan template [`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars) untuk merender persentase progres:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

Sintaks rendering dinamis menggunakan [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars), Anda dapat merujuk pada dokumentasi resmi untuk melihat dan mempelajari detail sintaks.

---

### 11.7 Ringkasan

Selamat! Sekarang kita telah menyelesaikan pembagian sub-task. Melalui manajemen multi-level, pelaporan jam kerja harian, dan tampilan chart, Anda dapat melihat progres penyelesaian task dengan lebih jelas, membantu tim bekerja lebih efisien. Terima kasih atas kesabaran Anda dalam membaca, terus semangat, mari kita nantikan [bab berikutnya](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking) yang menarik!

---

Lanjutkan eksplorasi, dan ekspresikan kreativitas Anda sepenuhnya! Jika menemui masalah, jangan lupa Anda dapat selalu merujuk pada [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi.
