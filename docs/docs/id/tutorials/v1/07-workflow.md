# Bab 7: Workflow

<iframe  width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113600643469156&bvid=BV1qqidYQER8&cid=27196394345&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Selamat Anda telah sampai di bab terakhir ini! Kita akan dalam bab ini memperkenalkan dan secara sederhana menjelajahi fitur **Workflow** kuat dari **NocoBase**. Melalui fitur ini, Anda dapat mengotomatisasi operasi untuk tugas dalam sistem, menghemat waktu dan meningkatkan efisiensi.

### Jawaban Tantangan Bab Sebelumnya

Tetapi sebelum mulai, mari review tantangan dari bab sebelumnya! Kami berhasil mengonfigurasi **Izin Komentar** untuk role "Mitra", sebagai berikut:

1. **Izin Tambah**: Memungkinkan pengguna memposting komentar.
2. **Izin Lihat**: Memungkinkan pengguna melihat semua komentar.
3. **Izin Edit**: Pengguna hanya dapat mengedit komentar yang dibuatnya sendiri.
4. **Izin Hapus**: Pengguna hanya dapat menghapus komentar mereka sendiri.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172247599.gif)

Setelah konfigurasi seperti ini, Tom tidak hanya dapat dengan bebas memposting komentar, tetapi juga dapat melihat komentar anggota lain, sambil memastikan hanya dia sendiri yang dapat mengedit dan menghapus pernyataannya.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248463.gif)

---

Sekarang, mari kita implementasikan fitur otomasi: **Setiap kali penanggung jawab tugas diganti, sistem secara otomatis mengirim notifikasi ke penanggung jawab yang sesuai, mengingatkan penanggung jawab baru untuk mengambil alih tugas**.

> **Workflow:** Plugin Workflow adalah tool otomasi yang kuat, sering ditemui di bidang Business Process Management (BPM).
>
> Ini digunakan untuk mendesain dan mengorkestrasi proses bisnis berdasarkan model data, dengan bantuan kondisi trigger dan konfigurasi node alur, merealisasikan alur otomatis proses. Plugin jenis ini sangat cocok untuk secara otomatis menangani tugas yang berulang dan data driven.

### 7.1 Pembuatan Workflow

#### 7.1.1 Pembuatan Workflow di Halaman Backend

Pertama, beralih ke role **Root**, ini adalah role administrator sistem, memiliki semua izin. Selanjutnya, masuk ke modul [**Workflow**](https://docs-cn.nocobase.com/handbook/workflow).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248323.png)

Klik tombol **"Tambah"** di pojok kanan atas, buat satu Workflow baru, isi informasi dasar:

- **Nama**: Buat notifikasi sistem saat penanggung jawab diganti.
- **Cara Trigger**: Pilih "Event Tabel Data".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248425.png)

#### 7.1.2 Penjelasan Pemilihan Cara Trigger:

1. [**Event Tabel Data**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection): Trigger saat informasi dalam tabel data berubah (tambah, modifikasi, hapus). Cara ini sangat cocok untuk melacak perubahan field tugas, contohnya mengganti penanggung jawab.
2. [**Scheduled Task**](https://docs-cn.nocobase.com/handbook/workflow/triggers/schedule): Trigger otomatis pada waktu tertentu, lebih cocok untuk operasi otomasi yang terkait dengan jadwal.
3. [**Event Setelah Action**](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action): Terhubung ke tombol action, trigger setelah pengguna mengeksekusi action tertentu. Contohnya, klik tombol simpan untuk trigger tugas.

Pada penggunaan selanjutnya, kita juga akan menemukan cara trigger lain, seperti "Event Sebelum Action", "Event Action Kustom", "Approval"...... semua dapat dibuka melalui Plugin yang sesuai.

Pada skenario ini, kita menggunakan [**Event Tabel Data**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection) untuk melacak perubahan "Penanggung Jawab" di "Tabel Tugas". Setelah submit Workflow, klik **Konfigurasi**, masuk ke halaman pengaturan Workflow.

![demov3N-37.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248988.gif)

---

### 7.2 Konfigurasi Node Workflow

#### 7.2.1 Mengonfigurasi Kondisi Trigger

Tanpa basa-basi, mari mulai membangun alur notifikasi otomatis~

Mari konfigurasi node pertama, atur kondisi agar Workflow secara otomatis dimulai dalam situasi tertentu.

- **Tabel Data**: Pilih "Tabel Tugas". (Tabel data mana yang men-trigger Workflow ini, data yang sesuai juga akan terbaca secara sinkron ke Workflow. Kita tentu saja berharap saat "Tabel Tugas" berubah, baru memulai Workflow saat ini.)
- **Waktu Trigger**: Pilih "Setelah tambah atau update data".
- **Field Trigger**: Pilih "Penanggung Jawab".
- **Kondisi Trigger**: Pilih "ID Penanggung Jawab ada", memastikan hanya saat tugas dialokasikan penanggung jawab, baru mengirim notifikasi sistem.
- **Pre-load Data**: Pilih "Penanggung Jawab", agar dapat menggunakan informasinya pada alur selanjutnya.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172249330.gif)

---

#### 7.2.2 Mengaktifkan Channel "Pesan Internal"

Langkah selanjutnya, kita akan membuat satu node yang mengirim notifikasi.

Sebelum itu, kita perlu membuat satu [channel "Pesan Internal"](https://docs-cn.nocobase.com/handbook/notification-in-app-message) untuk mengirim notifikasi.

- Kembali ke antarmuka Plugin Manager, pilih "Manajemen Notifikasi", buat notifikasi tugas baru (task_message)
- Channel sudah dibuat, kita kembali ke Workflow, buat node "Notifikasi" baru
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250497.gif)
- Konfigurasi node
  **Channel:** Pilih "Notifikasi Tugas"
  **Penerima:** Pilih "Variabel Trigger/Data Trigger/Penanggung Jawab/ID", dengan demikian dapat menemukan penanggung jawab setelah perubahan.
  **Judul Pesan:** Kita isi "Pengingat Pergantian Penanggung Jawab"
  **Konten Pesan:** Isi "Anda telah ditunjuk sebagai penanggung jawab baru"

Setelah selesai, klik switch di pojok kanan atas, aktifkan Workflow ini.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250472.gif)

Sudah dikonfigurasi~

#### 7.2.3 Menguji Notifikasi

Saat menggembirakan tiba, kita kembali ke halaman, klik salah satu tugas untuk edit, ganti penanggung jawab, langsung klik submit, sistem sudah mengirim notifikasi!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250461.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250998.gif)

---

Demikianlah alur pengaturan Workflow, tetapi kita masih ada pekerjaan:

Notifikasi yang kita hasilkan perlu menyisipkan informasi tugas secara dinamis, jika tidak semua orang tidak jelas pekerjaan mana yang dialihkan kepada dirinya.

### 7.3 Penyempurnaan Workflow

#### 7.3.1 Manajemen Versi

Kembali ke konfigurasi Workflow, saat ini Anda akan menemukan antarmuka Workflow sudah menjadi abu-abu, tidak dapat diedit.

Jangan khawatir, klik tiga titik di pojok kanan atas > [**Salin ke Versi Baru**](https://docs-cn.nocobase.com/handbook/workflow/advanced/revisions), kita akan masuk ke halaman konfigurasi versi baru. Tentu saja, versi sebelumnya juga akan dipertahankan, klik tombol **Versi**, dapat beralih ke versi historis kapan saja (perhatian: versi Workflow yang sudah dieksekusi tidak dapat diubah lagi!).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251594.gif)

#### 7.3.2 Mengoptimalkan Konten Notifikasi

Sekarang, mari buat konten notifikasi lebih personal, tambahkan penjelasan detail informasi pengalihan.

- **Edit node notifikasi.**

Ubah konten pesan menjadi: "Tugas <【Nama Tugas】>, penanggung jawab telah diganti menjadi: 【Nickname Penanggung Jawab】"

- Kita klik variabel di sebelah kanan, isi nama tugas dan penanggung jawab.
- Kemudian klik di pojok kanan atas, aktifkan versi ini.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251780.gif)

Aktifkan versi Workflow yang telah diperbarui, saat diuji ulang, notifikasi sistem menampilkan nama tugas baru.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251734.gif)

---

### Ringkasan

Hebat! Anda telah berhasil membuat satu Workflow otomasi berdasarkan perubahan penanggung jawab tugas. Fitur ini tidak hanya menghemat waktu operasi manual, tetapi juga meningkatkan efisiensi kolaborasi tim. Sampai sini, sistem manajemen tugas kita sudah memiliki fitur yang kuat.

---

### Ringkasan dan Pandangan ke Depan

Sampai sini, Anda telah dari nol menyelesaikan satu sistem manajemen tugas yang lengkap — mencakup pembuatan tugas, fitur komentar, pengaturan izin role, serta Workflow dan notifikasi sistem.

Fleksibilitas dan ekstensibilitas NocoBase akan segera menyediakan kemungkinan tak terbatas untuk Anda, di masa depan, Anda dapat terus menjelajahi lebih banyak Plugin secara mendalam, kustomisasi fitur, atau membuat logika bisnis yang lebih kompleks. Saya yakin melalui pembelajaran ini, Anda telah menguasai cara penggunaan dasar dan konsep inti NocoBase.

Mari kita nantikan kreasi Anda berikutnya! Jika ada pertanyaan apa pun, silakan akses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi kapan saja.

Lanjutkan menjelajah, ciptakan kemungkinan tak terbatas!
