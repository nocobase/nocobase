# Mengimplementasikan Review Registrasi Pengguna

Dokumen ini menyediakan dua solusi untuk mengimplementasikan review registrasi Pengguna, yang dirancang untuk skenario bisnis yang berbeda:

- **Solusi Pertama**: Cocok untuk skenario yang membutuhkan implementasi alur review registrasi yang sederhana dan cepat. Solusi ini memanfaatkan fitur registrasi Pengguna baru bawaan sistem, memberikan role "Tamu" tanpa permission untuk semua Pengguna baru, dan administrator melakukan review serta memperbarui role secara manual di backend.
- **Solusi Kedua**: Cocok untuk skenario yang membutuhkan alur review registrasi yang lebih fleksibel dan custom. Melalui desain tabel informasi aplikasi khusus, konfigurasi workflow review, dan aktivasi [plugin Public Forms](https://docs-cn.nocobase.com/handbook/public-forms), tercapai pengelolaan alur lengkap dari pengajuan aplikasi registrasi hingga pembuatan Pengguna baru secara otomatis.

  ![](https://static-docs.nocobase.com/20250219144832.png)

---

## 1. Solusi Pertama: Menggunakan Role "Tamu" Tanpa Permission

### 1.0 Skenario yang Cocok

Cocok untuk skenario dengan persyaratan review registrasi yang lebih sederhana, ingin menggunakan fitur registrasi bawaan sistem, dan melakukan review Pengguna secara manual di backend.

### 1.1 Mengaktifkan Autentikasi Password, Mengizinkan Registrasi Pengguna

#### 1.1.1 Masuk ke Halaman Autentikasi Pengguna

Pertama kita perlu memastikan apakah fitur registrasi Pengguna sudah aktif. Pada pengaturan sistem, masuk ke halaman [Autentikasi Pengguna](https://docs-cn.nocobase.com/handbook/auth/user). Halaman ini mengelola semua channel autentikasi identitas, seperti "Login Akun Password", [Login Google](https://docs-cn.nocobase.com/handbook/auth-oidc/example/google), dan sebagainya (dapat diperluas melalui plugin).

![](https://static-docs.nocobase.com/20250208164554.png)

Switch fitur registrasi ada di sini:
![](https://static-docs.nocobase.com/20250219084856.png)

### 1.2 Atur Role Default (Inti)

#### 1.2.1 Buat Role "Tamu"

Sistem secara default mengaktifkan fitur registrasi, namun role default mungkin tidak sesuai dengan kebutuhan.

Jadi pertama-tama kita perlu membuat role "Tamu" di [Daftar Role] sebagai role default, dan tidak mengandung permission apa pun. Semua Pengguna yang baru terdaftar akan secara otomatis diberi role ini.

![](https://static-docs.nocobase.com/20250208163521.png)

### 1.3 Konfigurasi Antarmuka Review Pengguna Terdaftar (Inti)

Beralih ke mode edit, di backend konfigurasikan Block tabel sederhana, pilih tabel Pengguna, untuk menampilkan dan mengelola Pengguna terdaftar.

![](https://static-docs.nocobase.com/20250208165406.png)

### 1.4 Uji Alur Review Registrasi, Memperbarui Role Secara Manual

- Setelah Pengguna baru mendaftar, halaman secara default menampilkan kosong
  ![](https://static-docs.nocobase.com/20250219084449.png)
- Pada antarmuka manajemen, untuk Pengguna dengan informasi aplikasi yang benar, ubah role mereka secara manual menjadi role yang ditentukan untuk menyelesaikan review.
  ![](https://static-docs.nocobase.com/20250219084702.png)

### 1.5 Konfigurasi Halaman Prompt (Opsional)

#### 1.5.1 Buat halaman baru, misalnya "Registrasi Berhasil", isi konten dengan informasi prompt

> **Langkah Opsional**: Kita dapat menambahkan prompt yang ramah di halaman kosong tersebut, misalnya "Akun Anda sedang direview, mohon menunggu review selesai dengan sabar", untuk memberitahu Pengguna status saat ini.
> ![](https://static-docs.nocobase.com/Pasted%20image%2020250208231631.png)

#### 1.5.2 Berikan Permission Halaman Prompt

Selanjutnya kita masuk ke konfigurasi manajemen permission Pengguna, berikan halaman ini ke "Tamu". Setelah registrasi berhasil akan otomatis redirect.
![](https://static-docs.nocobase.com/20250211223123.png)

### 1.6 Memperluas Field Tabel Pengguna (Opsional)

> **Langkah Opsional**: Jika perlu mengumpulkan informasi tambahan saat registrasi untuk membantu review, dapat menambahkan Field terkait di tabel Pengguna (misalnya "Alasan Aplikasi" atau "Kode Undangan"). Jika hanya membutuhkan review registrasi dasar, langkah ini dapat dilewati.

#### 1.6.1 Tambahkan Field Aplikasi Baru

Masuk ke [Tabel Pengguna], tambahkan Field baru untuk Pengguna, untuk mencatat alasan aplikasi atau informasi kode undangan yang diisi Pengguna saat registrasi.
![](https://static-docs.nocobase.com/20250208164321.png)

#### 1.6.2 Aktifkan Field di "Autentikasi Pengguna"

![](https://static-docs.nocobase.com/Pasted%20image%2020250219090248.png)

Setelah konfigurasi selesai, kunjungi halaman login, klik [Daftar Akun], dan Anda akan melihat Field yang sesuai di form registrasi (jika dikonfigurasi sebagai opsional, akan ditampilkan; jika tidak akan menampilkan form dasar).
![](https://static-docs.nocobase.com/20250219090447.png)

#### 1.6.3 Tambahkan Field yang Sesuai di Halaman Review

Kita juga menambahkan kedua Field ini di halaman review, dapat melakukan review dan mengubah role Pengguna secara real-time.

![](https://static-docs.nocobase.com/20250208165622.png)

---

## 2. Solusi Kedua: Tidak Membuka Channel Registrasi, Menambah Tabel Perantara untuk Review

### 2.0 Skenario yang Cocok

Cocok untuk skenario yang membutuhkan alur review registrasi yang lebih fleksibel dan custom.

Solusi ini melalui tabel informasi aplikasi independen, pengaturan workflow, dan [plugin Public Forms](https://docs-cn.nocobase.com/handbook/public-forms), merealisasikan alur lengkap dari Pengguna mengirim aplikasi registrasi hingga membuat Pengguna secara otomatis. Langkah inti memastikan fitur dasar, dan dapat diperluas dengan lebih banyak fitur sesuai kebutuhan selanjutnya.

### 2.1 Persiapan Awal (Inti)

#### 2.1.1 Mendesain Tabel Informasi Aplikasi

##### 2.1.1.1 Buat Tabel "Informasi Aplikasi"

- **Buat Tabel**
  Buat tabel baru di backend NocoBase untuk menyimpan informasi aplikasi registrasi Pengguna.
- **Konfigurasi Field**
  Tambahkan Field berikut ke tabel, dan pastikan tipe Field dan deskripsi benar:


  | Field display name     | Field name         | Field interface  | Description                                                          |
  | ---------------------- | ------------------ | ---------------- | -------------------------------------------------------------------- |
  | **ID**                 | id                 | Integer          | Dibuat otomatis oleh sistem, mengidentifikasi ID unik record         |
  | **Username**           | username           | Single line text | Username pemohon                                                     |
  | **Email**              | email              | Email            | Alamat email pemohon                                                 |
  | **Phone**              | phone              | Phone            | Nomor telepon pemohon                                                |
  | **Full Name**          | full_name          | Single line text | Nama lengkap pemohon                                                 |
  | **Application Reason** | application_reason | Long text        | Alasan atau keterangan aplikasi yang diisi pemohon                   |
  | **User Type**          | user_type          | Single select    | Menentukan tipe Pengguna pemohon di masa depan (registrasi email, registrasi terbuka) |
  | **Status**             | status             | Single select    | Status aplikasi saat ini (misalnya: menunggu review, disetujui, ditolak) |
  | **Initial Password**   | initial_password   | Single line text | Password awal Pengguna baru (default nocobase)                       |
  | **Created at**         | createdAt          | Created at       | Waktu pembuatan record sistem                                        |
  | **Created by**         | createdBy          | Created by       | Pembuat record sistem                                                |
  | **Last updated at**    | updatedAt          | Last updated at  | Waktu update terakhir record sistem                                  |
  | **Last updated by**    | updatedBy          | Last updated by  | Pengupdate terakhir record sistem                                    |
- **Preview Struktur Tabel**
  Lihat gambar di bawah untuk memastikan konfigurasi struktur tabel benar:
  ![](https://static-docs.nocobase.com/20250208145543.png)

##### 2.1.1.2 Input dan Tampilan Data

- **Konfigurasi Antarmuka Review**
  Konfigurasikan antarmuka manajemen "Review Informasi Registrasi" di antarmuka utama, untuk menampilkan informasi aplikasi yang dikirim Pengguna.
- **Input Data Uji**
  Masuk ke antarmuka manajemen, input data uji, pastikan data dapat ditampilkan dengan benar.
  ![](https://static-docs.nocobase.com/20250208151429.png)

### 2.2 Pengaturan Workflow

Bagian ini menjelaskan cara mengkonfigurasi workflow untuk merealisasikan fitur pembuatan Pengguna baru secara otomatis setelah review disetujui.

#### 2.2.1 Membuat Workflow Review

##### 2.2.1.1 Buat Workflow Baru

- **Masuk ke Antarmuka Workflow**
  Pada backend NocoBase masuk ke halaman konfigurasi workflow, pilih "Buat Workflow Baru".
- **Pilih Event Trigger**
  Dapat memilih [post-action event](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action) atau [pre-action event](https://docs-cn.nocobase.com/handbook/workflow/triggers/pre-action), di sini kita gunakan pre-action event sebagai contoh.
- **Konfigurasi Node Workflow**
  Buat node "Tambah Pengguna" baru, konversi data form saat ini menjadi data Pengguna baru, dan atur mapping Field serta logika pemrosesan.
  Referensi gambar:
  ![](https://static-docs.nocobase.com/20250208153202.png)

#### 2.2.2 Mengatur Tombol Review Form

##### 2.2.2.1 Tambahkan Tombol "Setujui" dan "Tolak"

Tambahkan dua tombol "Review Setujui" dan "Review Tolak" secara terpisah di form informasi aplikasi.
![](https://static-docs.nocobase.com/20250208153302.png)

##### 2.2.2.2 Konfigurasi Fungsi Tombol

- **Konfigurasi Tombol "Review Setujui"**
  - Hubungkan dengan workflow yang baru dibuat;
  - Saat submit, atur nilai Field [Status] menjadi "Review Disetujui".
    Referensi gambar:
    ![](https://static-docs.nocobase.com/20250208153429.png)
    ![](https://static-docs.nocobase.com/20250208153409.png)
- **Konfigurasi Tombol "Review Tolak"**
  - Saat submit, atur nilai Field [Status] menjadi "Review Ditolak".

##### 2.2.2.3 Atur Linkage Rule Tombol

Untuk mencegah operasi berulang, atur linkage rule: ketika [Status] bukan [Menunggu Review] sembunyikan tombol.
Referensi gambar:
![](https://static-docs.nocobase.com/20250208153749.png)

### 2.3 Mengaktifkan dan Mengkonfigurasi Plugin Public Forms

Manfaatkan [plugin Public Forms](https://docs-cn.nocobase.com/handbook/public-forms), agar Pengguna dapat mengirim aplikasi registrasi melalui halaman.

#### 2.3.1 Aktifkan Plugin Public Forms

##### 2.3.1.1 Operasi Aktivasi Plugin

- **Masuk ke Manajemen Plugin**
  Pada antarmuka manajemen backend cari dan aktifkan plugin "Public Forms".
  Referensi gambar:
  ![](https://static-docs.nocobase.com/20250208154258.png)

#### 2.3.2 Buat dan Konfigurasi Public Form

##### 2.3.2.1 Buat Public Form

- **Buat Form Baru**
  Pada manajemen backend buat public form, untuk Pengguna mengirim aplikasi registrasi.
- **Konfigurasi Elemen Form**
  Tambahkan elemen form yang diperlukan (seperti username, email, nomor telepon, dll.), dan atur aturan validasi yang sesuai.
  Referensi gambar:
  ![](https://static-docs.nocobase.com/20250208155044.png)

#### 2.3.3 Mengaktifkan dan Mengkonfigurasi Plugin Public Forms (Inti)

##### 2.3.3.1 Uji Public Form

- **Buka Halaman**
  Akses halaman public form, isi dan submit data aplikasi.
- **Verifikasi Fungsi**
  Periksa apakah data masuk ke tabel informasi aplikasi dengan benar, dan setelah review workflow secara otomatis membuat Pengguna baru.
  Referensi efek pengujian:
  ![](https://static-docs.nocobase.com/202502191351-register2.gif)

### 2.4 Pengembangan Lanjutan (Langkah Opsional)

Setelah menyelesaikan alur registrasi dan review dasar, kita dapat memperluas fitur lain sesuai kebutuhan:

#### 2.4.1 Registrasi Kode Undangan

- **Deskripsi Fungsi**: Membatasi jangkauan dan jumlah Pengguna yang mendaftar melalui pengaturan kode undangan.
- **Pemikiran Konfigurasi**: Tambahkan Field kode undangan di tabel aplikasi, gunakan "pre-action event", lakukan validasi legalitas dan intersepsi terhadap Field tersebut sebelum submit.

#### 2.4.2 Notifikasi Email Otomatis

- **Deskripsi Fungsi**: Merealisasikan pengiriman email otomatis untuk notifikasi hasil review, registrasi berhasil, dan sebagainya.
- **Pemikiran Konfigurasi**: Gabungkan dengan node email NocoBase, tambahkan operasi pengiriman email di workflow.

---

Jika selama proses pengoperasian menemui masalah apa pun, silakan kunjungi [Komunitas NocoBase](https://forum.nocobase.com) untuk berdiskusi atau merujuk pada [Dokumentasi Resmi](https://docs-cn.nocobase.com). Kami berharap panduan ini dapat membantu Anda merealisasikan review registrasi Pengguna sesuai kebutuhan aktual, dan dapat diperluas secara fleksibel sesuai kebutuhan. Semoga sukses dalam penggunaan, dan proyek Anda berhasil!
