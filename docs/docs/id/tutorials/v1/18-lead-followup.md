# Follow-up Lead dan Manajemen Status

## 1. Pengantar

### 1.1 Tujuan Bab Ini

Dalam bab ini, kita akan bersama-sama mempelajari cara mengimplementasikan konversi Opportunity CRM di NocoBase. Melalui follow-up Lead dan manajemen status, Anda dapat meningkatkan efisiensi bisnis dan merealisasikan kontrol proses penjualan yang lebih detail.

### 1.2 Pratinjau Hasil Akhir

Pada bab sebelumnya, kami telah menjelaskan cara mengelola asosiasi data Lead dengan Perusahaan, Kontak, dan Opportunity. Sekarang, kita fokus pada modul Lead, terutama mengeksplorasi cara melakukan follow-up Lead dan manajemen status. Silakan tonton contoh efek berikut terlebih dahulu:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Penjelasan Struktur Collection Lead

### 2.1 Pengantar Collection Lead

Pada fitur follow-up Lead, Field "status" memainkan peran yang sangat penting. Tidak hanya merefleksikan progres Lead saat ini (seperti tidak memenuhi syarat, lead baru, sedang diproses, sedang di-follow-up, transaksi berlangsung, selesai), tetapi juga menggerakkan tampilan dan perubahan keseluruhan form. Block tabel di bawah ini menampilkan struktur Field dari collection Lead beserta deskripsi detailnya:


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

## 3. Membuat Block Tabel Leads (table block) dan Block Detail

### 3.1 Penjelasan Pembuatan

Pertama, kita perlu membuat sebuah table block "Leads" untuk menampilkan Field yang diperlukan. Pada saat yang sama, di sisi kanan halaman konfigurasi Block detail. Ketika Anda mengklik suatu record, sisi kanan akan secara otomatis menampilkan informasi detail yang sesuai. Silakan lihat efek konfigurasi pada gambar di bawah:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Mengkonfigurasi Tombol Action

### 4.1 Penjelasan Umum Tombol

Untuk memenuhi berbagai kebutuhan operasi, kita perlu membuat total 11 tombol. Setiap tombol akan menggunakan cara tampilan yang berbeda (sembunyi, aktif, atau dinonaktifkan) berdasarkan status (status) record, sehingga membimbing Pengguna mengoperasikan sesuai alur bisnis yang benar.
![20250226173632](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 Konfigurasi Detail Setiap Tombol Fungsi

#### 4.2.1 Tombol Edit

- Linkage rule: Ketika status record adalah "Completed" (Selesai), nonaktifkan tombol secara otomatis untuk mencegah edit yang tidak perlu.

#### 4.2.2 Tombol Tidak Memenuhi Syarat 1 (Tidak Aktif)

- Style dan tampilan: Judul ditampilkan sebagai "Unqualified >".
- Operasi dan perilaku: Setelah diklik, jalankan operasi update, ubah status record menjadi "Unqualified". Setelah update berhasil, kembali ke halaman sebelumnya, dan tampilkan prompt sukses "Unqualified".
- Linkage rule: Hanya ditampilkan ketika status record kosong; sekali status memiliki nilai, tombol ini akan otomatis disembunyikan.

#### 4.2.3 Tombol Tidak Memenuhi Syarat 2 (Status Aktif)

- Style dan tampilan: Juga ditampilkan sebagai "Unqualified >".
- Operasi dan perilaku: Digunakan untuk mengubah status record menjadi "Unqualified".
- Linkage rule: Ketika status kosong, tombol ini disembunyikan; jika status adalah "Completed", tombol akan dinonaktifkan.

#### 4.2.4 Tombol Lead Baru 1 (Tidak Aktif)

- Style dan tampilan: Judul ditampilkan sebagai "New >".
- Operasi dan perilaku: Setelah diklik, update record, atur status menjadi "New". Setelah update berhasil, tampilkan prompt "New".
- Linkage rule: Jika status record sudah dalam "New", "Working", "Nurturing", atau "Completed", tombol ini akan disembunyikan.

#### 4.2.5 Tombol Lead Baru 2 (Status Aktif)

- Style dan tampilan: Judul tetap "New >".
- Operasi dan perilaku: Juga digunakan untuk update record, atur status menjadi "New".
- Linkage rule: Ketika status adalah "Unqualified" atau kosong, disembunyikan; jika status adalah "Completed", tombol dinonaktifkan.

#### 4.2.6 Tombol Sedang Diproses (Tidak Aktif)

- Style dan tampilan: Judul ditampilkan sebagai "Working >".
- Operasi dan perilaku: Setelah tombol diklik, status record diupdate menjadi "Working", dan tampilkan prompt sukses "Working".
- Linkage rule: Jika status record sudah "Working", "Nurturing", atau "Completed", tombol ini disembunyikan.

#### 4.2.7 Tombol Sedang Diproses (Status Aktif)

- Style dan tampilan: Judul tetap "Working >".
- Operasi dan perilaku: Digunakan untuk mengubah status record menjadi "Working".
- Linkage rule: Ketika status adalah "Unqualified", "New", atau kosong, tombol ini disembunyikan; jika status adalah "Completed", tombol dinonaktifkan.

#### 4.2.8 Tombol Sedang Di-follow-up (Tidak Aktif)

- Style dan tampilan: Judul ditampilkan sebagai "Nurturing >".
- Operasi dan perilaku: Setelah tombol diklik, ubah status record menjadi "Nurturing", dan tampilkan prompt sukses "Nurturing".
- Linkage rule: Jika status record sudah "Nurturing" atau "Completed", tombol disembunyikan.

#### 4.2.9 Tombol Sedang Di-follow-up (Status Aktif)

- Style dan tampilan: Judul juga "Nurturing >".
- Operasi dan perilaku: Juga digunakan untuk mengubah status record menjadi "Nurturing".
- Linkage rule: Ketika status adalah "Unqualified", "New", "Working", atau kosong, disembunyikan; jika status adalah "Completed", tombol dinonaktifkan.

#### 4.2.10 Tombol Konversi

- Style dan tampilan: Judul ditampilkan sebagai "transfer", dan dibuka dalam bentuk modal popup.
- Operasi dan perilaku: Terutama digunakan untuk mengeksekusi operasi transfer record. Setelah operasi update, sistem akan menampilkan antarmuka yang berisi drawer, Tabs, dan form, untuk memudahkan Anda melakukan transfer record.
- Linkage rule: Ketika status record adalah "Completed", tombol ini disembunyikan, untuk mencegah transfer berulang.
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 Tombol Konversi Selesai (Status Aktif)

- Style dan tampilan: Judul ditampilkan sebagai "transfered", juga dibuka dalam bentuk modal popup.
- Operasi dan perilaku: Tombol ini hanya digunakan untuk menampilkan informasi setelah konversi selesai, tidak memiliki fungsi edit.
- Linkage rule: Hanya ditampilkan ketika status record adalah "Completed", disembunyikan pada status lain (seperti "Unqualified", "New", "Working", "Nurturing", atau kosong).
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 Ringkasan Konfigurasi Tombol

- Setiap fitur menyediakan style tombol yang berbeda di status tidak aktif dan aktif.
- Memanfaatkan linkage rule, mengontrol tampilan tombol secara dinamis (sembunyi atau dinonaktifkan) berdasarkan status record, sehingga membimbing tenaga sales mengoperasikan sesuai alur kerja yang benar.

## 5. Pengaturan Linkage Rule Form

### 5.1 Aturan 1: Hanya Menampilkan Nama

- Ketika record belum dikonfirmasi atau status kosong, hanya tampilkan nama.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Aturan 2: Optimasi Tampilan pada Status "Lead Baru"

- Ketika status adalah "Lead Baru", halaman akan menyembunyikan nama perusahaan, dan menampilkan kontak.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Aturan Markdown Halaman dan Sintaks Handlebars

### 6.1 Tampilan Teks Dinamis

Pada halaman, kita menggunakan sintaks Handlebars untuk menampilkan informasi prompt yang berbeda secara dinamis berdasarkan status record. Berikut adalah contoh kode untuk setiap status:

Ketika status adalah "Tidak Memenuhi Syarat":

```markdown
{{#if (eq $nRecord.status "Tidak Memenuhi Syarat")}}
**Lacak informasi terkait dari Lead Anda yang tidak memenuhi syarat.**  
Jika Lead Anda tidak tertarik pada produk atau telah meninggalkan perusahaan terkait, mereka mungkin tidak memenuhi syarat.  
- Catat pelajaran yang didapat untuk referensi di masa depan  
- Simpan detail outreach dan informasi kontak  
{{/if}}
```

Ketika status adalah "Lead Baru":

```markdown
{{#if (eq $nRecord.status "Lead Baru")}}
**Identifikasi produk atau layanan yang dibutuhkan untuk peluang ini.**  
- Kumpulkan studi kasus Pelanggan, referensi, atau analisis kompetitif  
- Konfirmasikan stakeholder utama Anda  
- Tentukan resource yang tersedia  
{{/if}}
```

Ketika status adalah "Sedang Diproses":

```markdown
{{#if (eq $nRecord.status "Sedang Diproses")}}
**Sampaikan solusi Anda kepada stakeholder.**  
- Komunikasikan nilai dari solusi  
- Klarifikasikan timeline dan anggaran  
- Buat rencana dengan Pelanggan kapan dan bagaimana penutupan transaksi  
{{/if}}
```

Ketika status adalah "Sedang Di-follow-up":

```markdown
{{#if (eq $nRecord.status "Sedang Di-follow-up")}}
**Tentukan rencana implementasi proyek Pelanggan.**  
- Capai kesepakatan sesuai kebutuhan  
- Ikuti proses diskon internal  
- Dapatkan kontrak yang ditandatangani  
{{/if}}
```

Ketika status adalah "Konversi Selesai":

```markdown
{{#if (eq $nRecord.status "Konversi Selesai")}}
**Konfirmasikan rencana implementasi proyek dan langkah akhir.**  
- Pastikan semua kesepakatan sisa dan formalitas tanda tangan sudah ada  
- Ikuti kebijakan diskon internal  
- Pastikan kontrak telah ditandatangani dan implementasi proyek berjalan sesuai rencana  
{{/if}}
```

## 7. Menampilkan Object Asosiasi dan Link Redirect Setelah Konversi Selesai

### 7.1 Penjelasan Object Asosiasi

Setelah konversi selesai, kita ingin menampilkan object asosiasi terkait (Perusahaan, Kontak, Opportunity), dan menambahkan link untuk redirect ke halaman detail. Perhatian: pada popup atau halaman lain, bagian akhir format link detail (angka setelah filterbytk) mewakili id object saat ini, contoh:

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 Menggunakan Handlebars untuk Menghasilkan Link Asosiasi

Untuk Perusahaan:

```markdown
{{#if (eq $nRecord.status "Selesai")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Untuk Kontak:

```markdown
{{#if (eq $nRecord.status "Selesai")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Untuk Opportunity:

```markdown
{{#if (eq $nRecord.status "Selesai")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Menyembunyikan Object Asosiasi tetapi Menyimpan Nilai

Untuk memastikan informasi asosiasi dapat ditampilkan dengan normal setelah konversi selesai, perlu mengatur status "Perusahaan", "Kontak", dan "Opportunity" sebagai "Hidden (Pertahankan Nilai)". Dengan demikian, meskipun Field-Field ini tidak ditampilkan di form, nilainya tetap akan dicatat dan diteruskan.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Mencegah Modifikasi Status Setelah Konversi Selesai

Untuk mencegah perubahan status secara tidak sengaja setelah konversi selesai, kita menambahkan kondisi penilaian untuk semua tombol: ketika status adalah "Selesai", semua tombol akan dinonaktifkan.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Penutup

Setelah menyelesaikan semua langkah di atas, fitur follow-up dan konversi Lead Anda telah selesai! Melalui penjelasan langkah demi langkah dalam bab ini, semoga Anda dapat memahami dengan lebih jelas cara implementasi linkage perubahan status form di NocoBase. Semoga sukses dalam pengoperasian, dan selamat menggunakan!
