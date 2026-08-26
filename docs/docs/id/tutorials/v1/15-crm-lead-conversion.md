# Mengimplementasikan Konversi Lead CRM

## 1. Pengantar

Tutorial ini akan memandu Anda langkah demi langkah cara mengimplementasikan fitur Konversi Opportunity dalam CRM di NocoBase. Kami akan memperkenalkan cara membuat collections (tabel data) yang diperlukan, mengkonfigurasi halaman manajemen data, mendesain alur konversi, dan mengatur manajemen relasi, untuk membantu Anda membangun keseluruhan alur bisnis dengan lancar.

🎉 [Solusi NocoBase CRM Resmi Tersedia! Selamat Mencoba](https://www.nocobase.com/cn/blog/crm-solution)

## 2. Persiapan: Membuat Collections yang Diperlukan

Sebelum memulai, kita perlu menyiapkan 4 collections berikut, dan mengkonfigurasi hubungan asosiasi antara mereka.

### 2.1 LEAD Collection (Lead)

Ini adalah collection untuk menyimpan informasi calon Pelanggan, dengan definisi Field sebagai berikut:


| Field name     | Nama tampilan Field| Field interface  | Description                                                                            |
| -------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | Primary key                                                                            |
| account_id     | **account_id**     | Integer          | Foreign key ACCOUNT                                                                    |
| contact_id     | **contact_id**     | Integer          | Foreign key CONTACT                                                                    |
| opportunity_id | **opportunity_id** | Integer          | Foreign key OPPORTUNITY                                                                |
| name           | **Nama Lead**      | Single line text | Nama calon Pelanggan                                                                   |
| company        | **Nama Perusahaan**| Single line text | Nama perusahaan tempat calon Pelanggan bekerja                                         |
| email          | **Email**          | Email            | Alamat email calon Pelanggan                                                           |
| phone          | **Nomor Telepon**  | Phone            | Nomor telepon                                                                          |
| status         | **Status**         | Single select    | Status Lead saat ini (Tidak Memenuhi Syarat, Lead Baru, Sedang Diproses, Sedang Di-follow-up, Transaksi Berlangsung, Selesai) |
| Account        | **Perusahaan**     | Many to one      | Terkait dengan Collection Perusahaan                                                   |
| Contact        | **Kontak**         | Many to one      | Terkait dengan Collection Kontak                                                       |
| Opportunity    | **Opportunity**    | Many to one      | Terkait dengan Collection Opportunity                                                  |

### 2.2 ACCOUNT Collection (Perusahaan)

Digunakan untuk menyimpan informasi detail perusahaan, dengan konfigurasi Field sebagai berikut:


| Field name | Nama tampilan Field | Field interface  | Description                                |
| ---------- | ------------------- | ---------------- | ------------------------------------------ |
| name       | **Nama**            | Single line text | Nama akun (nama perusahaan atau organisasi) |
| industry   | **Industri**        | Single select    | Industri tempat akun berada                |
| phone      | **Telepon**         | Phone            | Nomor telepon akun                         |
| website    | **Website**         | URL              | Alamat website resmi akun                  |

### 2.3 CONTACT Collection (Kontak)

Collection yang menyimpan informasi kontak, mengandung Field berikut:


| Field name | Nama tampilan Field | Field interface  | Description              |
| ---------- | ------------------- | ---------------- | ------------------------ |
| name       | **Nama**            | Single line text | Nama kontak              |
| email      | **Email**           | Email            | Alamat email kontak      |
| phone      | **Telepon**         | Phone            | Nomor telepon kontak     |

### 2.4 OPPORTUNITY Collection (Opportunity)

Digunakan untuk mencatat informasi Opportunity, dengan definisi Field sebagai berikut:


| Field name | Nama tampilan Field | Field interface  | Description                                                                  |
| ---------- | ------------------- | ---------------- | ---------------------------------------------------------------------------- |
| name       | **Nama**            | Single line text | Nama Opportunity                                                             |
| stage      | **Tahap**           | Single select    | Tahap Opportunity (Kualifikasi, Kebutuhan, Proposal, Negosiasi, Penutupan Transaksi, Sukses, Gagal) |
| amount     | **Jumlah**          | Number           | Jumlah Opportunity                                                           |
| close_date | **Tanggal Tutup**   | Datetime         | Perkiraan tanggal tutup Opportunity                                          |

## 3. Memahami Alur Konversi Opportunity

### 3.1 Ikhtisar Alur Konversi Normal

Sebuah Opportunity dari Lead dikonversi menjadi Opportunity formal umumnya akan melewati alur berikut:

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

### 3.2 Penjelasan Hubungan Asosiasi

Asumsikan Anda telah berhasil membuat 4 collections di atas, dan memetakan serta mengkonfigurasi hubungan bisnis di antara mereka:

![Hubungan Asosiasi](https://static-docs.nocobase.com/20250225090913.png)

## 4. Membuat Halaman Manajemen Data

Pada workspace NocoBase, buat halaman manajemen data untuk setiap collections, dan tambahkan beberapa data Lead secara acak untuk pengujian selanjutnya.

![Halaman Manajemen Data](https://static-docs.nocobase.com/20250224234721.png)

## 5. Mengimplementasikan Fitur Konversi Opportunity

Bab ini fokus pada cara mengkonversi Lead menjadi data Perusahaan, Kontak, dan Opportunity, serta memastikan operasi konversi tidak terpicu berulang kali.

### 5.1 Membuat Action Edit "Konversi"

Pada antarmuka detail Lead yang sesuai, buat action edit dengan nama "Konversi". Pada popup konversi, lakukan konfigurasi berikut:

#### 5.1.1 Menampilkan Informasi Dasar Lead

Tampilkan informasi dasar Lead saat ini secara read-only, untuk memastikan Pengguna tidak salah mengubah data asli.

#### 5.1.2 Menampilkan Field Hubungan Asosiasi

Pada popup tampilkan tiga Field asosiasi berikut, dan aktifkan fitur "Quick Create" untuk setiap Field, agar saat data yang cocok tidak ditemukan, dapat membuat data baru secara instan.

![Tampilkan Field Asosiasi](https://static-docs.nocobase.com/20250224234155.png)

#### 5.1.3 Mengkonfigurasi Mapping Default Quick Create

Pada pengaturan popup "Quick Create", konfigurasikan nilai default untuk setiap Field asosiasi, sehingga informasi Lead secara otomatis dipetakan ke collection target. Aturan mapping sebagai berikut:

- Lead/Nama Lead → Perusahaan/Nama
- Lead/Email → Perusahaan/Email
- Lead/Nomor Telepon → Perusahaan/Telepon
- Lead/Nama Lead → Kontak/Nama
- Lead/Email → Kontak/Email
- Lead/Nomor Telepon → Kontak/Telepon
- Lead/Nama Lead → Opportunity/Nama
- Lead/Status → Opportunity/Tahap

Screenshot konfigurasi:

![Mapping Default 1](https://static-docs.nocobase.com/20250225000218.png)

Selanjutnya, kita tambahkan feedback yang ramah pada operasi submit:
![20250226154935](https://static-docs.nocobase.com/20250226154935.png)
![20250226154952](https://static-docs.nocobase.com/20250226154952.png)

Efek submit:
![Mapping Default 2](https://static-docs.nocobase.com/20250225001256.png)

#### 5.1.4 Melihat Efek Konversi

Setelah konfigurasi selesai, ketika operasi konversi dijalankan, sistem akan membuat dan mengasosiasikan Perusahaan, Kontak, dan Opportunity baru sesuai hubungan mapping. Contoh efek sebagai berikut:

![](https://static-docs.nocobase.com/202502252130-transfer1.gif)
![](https://static-docs.nocobase.com/202502252130-transfer2.gif)

### 5.2 Mencegah Konversi Berulang

Untuk menghindari Lead yang sama dikonversi berulang kali, dapat dikontrol melalui cara berikut:

#### 5.2.1 Memperbarui Status Lead

Pada operasi submit form konversi, tambahkan langkah update data otomatis, ubah status Lead menjadi "Telah Dikonversi".

Screenshot konfigurasi:

![Update Status 1](https://static-docs.nocobase.com/20250225001758.png)
![Update Status 2](https://static-docs.nocobase.com/20250225001817.png)
Demonstrasi efek:
![202502252130-transfer](https://static-docs.nocobase.com/202502252130-transfer.gif)

#### 5.2.2 Mengatur Linkage Rule Tombol

Tambahkan linkage rule untuk tombol konversi: ketika status Lead adalah "Telah Dikonversi", sembunyikan tombol konversi secara otomatis, untuk menghindari operasi berulang.

Screenshot konfigurasi:

![Linkage Tombol 1](https://static-docs.nocobase.com/20250225001838.png)
![Linkage Tombol 2](https://static-docs.nocobase.com/20250225001939.png)
![Linkage Tombol 3](https://static-docs.nocobase.com/20250225002026.png)

## 6. Mengkonfigurasi Block Manajemen Asosiasi pada Halaman Detail

Untuk memungkinkan Pengguna melihat data terkait di halaman detail setiap Collection, Anda perlu mengkonfigurasi Block list atau Block detail yang sesuai.

### 6.1 Mengkonfigurasi Halaman Detail Collection Perusahaan

Pada halaman detail Perusahaan (misalnya, di popup edit/detail Kontak), tambahkan Block list berikut secara terpisah:

- list Kontak
- list Opportunity
- list Lead

Contoh screenshot:

![Halaman Detail Perusahaan](https://static-docs.nocobase.com/20250225085418.png)

### 6.2 Menambahkan Kondisi Filter

Tambahkan aturan filter untuk setiap Block list, untuk memastikan hanya menampilkan data yang terkait dengan ID Perusahaan saat ini.

Screenshot konfigurasi:

![Kondisi Filter 1](https://static-docs.nocobase.com/20250225085513.png)
![Kondisi Filter 2](https://static-docs.nocobase.com/20250225085638.png)

### 6.3 Mengkonfigurasi Halaman Detail Kontak dan Opportunity

Pada popup detail Collection Kontak, tambahkan Block berikut:

- list Opportunity
- detail Perusahaan
- list Lead (dan filter berdasarkan ID)

Screenshot:

![Detail Kontak](https://static-docs.nocobase.com/20250225090231.png)

Pada halaman detail Opportunity, demikian pula tambahkan:

- list Kontak
- detail Perusahaan
- list Lead (filter berdasarkan ID)

Screenshot:

![Detail Opportunity](https://static-docs.nocobase.com/20250225091208.png)

## 7. Ringkasan

Melalui langkah-langkah di atas, Anda telah berhasil mengimplementasikan fitur konversi Opportunity CRM yang sederhana, dan mengkonfigurasi manajemen asosiasi antara Kontak, Perusahaan, dan Lead. Kami berharap tutorial ini dapat membantu Anda menguasai pembangunan keseluruhan alur bisnis secara jelas dan bertahap, sehingga memberikan kemudahan dan pengalaman operasi yang efisien untuk proyek Anda.

---

Jika selama proses pengoperasian menemui masalah apa pun, silakan kunjungi [Komunitas NocoBase](https://forum.nocobase.com) untuk berdiskusi atau merujuk pada [Dokumentasi Resmi](https://docs-cn.nocobase.com). Kami berharap panduan ini dapat membantu Anda merealisasikan review registrasi Pengguna sesuai kebutuhan aktual, dan dapat diperluas secara fleksibel sesuai kebutuhan. Semoga sukses dalam penggunaan, dan proyek Anda berhasil!
