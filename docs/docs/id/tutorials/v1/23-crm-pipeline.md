# Visualisasi Sales Pipeline CRM

## 1. Pengantar

### 1.1 Pendahuluan

Bab ini adalah bagian kedua dari seri tutorial [Bagaimana Mengimplementasikan Konversi Lead CRM di NocoBase](https://www.nocobase.com/cn/tutorials/how-to-implement-lead-conversion-in-nocobase). Pada bab sebelumnya, kami telah memperkenalkan dasar-dasar konversi Lead, termasuk membuat Collections yang dibutuhkan, mengkonfigurasi halaman manajemen data, dan mengimplementasikan fitur konversi Lead menjadi Perusahaan, Kontak, dan Opportunity. Bab ini akan fokus pada implementasi alur follow-up Lead dan manajemen status.

🎉 [Solusi NocoBase CRM Resmi Tersedia! Selamat Mencoba](https://www.nocobase.com/cn/blog/crm-solution)

### 1.2 Tujuan Bab Ini

Dalam bab ini, kita akan bersama-sama mempelajari cara mengimplementasikan konversi Lead CRM di NocoBase. Melalui follow-up Lead dan manajemen status, Anda dapat meningkatkan efisiensi bisnis dan merealisasikan kontrol proses penjualan yang lebih detail.

### 1.3 Pratinjau Hasil Akhir

Pada bab sebelumnya, kami telah menjelaskan cara mengelola asosiasi data Lead dengan Perusahaan, Kontak, dan Opportunity. Sekarang, kita fokus pada modul Lead, terutama mengeksplorasi cara melakukan follow-up Lead dan manajemen status. Silakan tonton contoh efek berikut terlebih dahulu:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Penjelasan Struktur Collection Lead

### 2.1 Pengantar Collection Lead

Pada fitur follow-up Lead, Field "status" memainkan peran yang sangat penting. Tidak hanya merefleksikan progres Lead saat ini (seperti tidak memenuhi syarat, lead baru, sedang diproses, sedang di-follow-up, transaksi berlangsung, selesai), tetapi juga menggerakkan tampilan dan perubahan keseluruhan form. Block tabel di bawah ini menampilkan struktur Field dari collection Lead beserta deskripsi detailnya:


| Field name     | Nama tampilan Field| Field interface  | Description                                                                            |
| -------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | Primary key                                                                            |
| account_id     | **account_id**     | Integer          | Foreign key Tabel Perusahaan ACCOUNT                                                   |
| contact_id     | **contact_id**     | Integer          | Foreign key Tabel Kontak CONTACT                                                       |
| opportunity_id | **opportunity_id** | Integer          | Foreign key Tabel Opportunity OPPORTUNITY                                              |
| name           | **Nama Lead**      | Single line text | Nama calon Pelanggan                                                                   |
| company        | **Nama Perusahaan**| Single line text | Nama perusahaan tempat calon Pelanggan bekerja                                         |
| email          | **Email**          | Email            | Alamat email calon Pelanggan                                                           |
| phone          | **Nomor Telepon**  | Phone            | Nomor telepon                                                                          |
| status         | **Status**         | Single select    | Status Lead saat ini, default "Tidak Memenuhi Syarat" (Tidak Memenuhi Syarat, Lead Baru, Sedang Diproses, Sedang Di-follow-up, Transaksi Berlangsung, Selesai) |
| Account        | **Perusahaan**     | Many to one      | Terkait dengan Perusahaan                                                              |
| Contact        | **Kontak**         | Many to one      | Terkait dengan Kontak                                                                  |
| Opportunity    | **Opportunity**    | Many to one      | Terkait dengan Opportunity                                                             |

## 3. Membuat Block Tabel Leads (table block) dan Block Detail

### 3.1 Penjelasan Pembuatan

Pertama, kita perlu membuat sebuah table block "Leads" untuk menampilkan Field yang diperlukan. Pada saat yang sama, di sisi kanan halaman konfigurasi Block detail. Ketika Anda mengklik suatu record, sisi kanan akan secara otomatis menampilkan informasi detail yang sesuai. Silakan lihat efek konfigurasi pada gambar di bawah:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Mengkonfigurasi Tombol Action

### 4.1 Penjelasan Umum Tombol

Untuk memenuhi berbagai kebutuhan operasi, kita perlu membuat total 10 tombol. Setiap tombol akan menggunakan cara tampilan yang berbeda (sembunyi, aktif, atau dinonaktifkan) berdasarkan status (status) record, sehingga membimbing Pengguna mengoperasikan sesuai alur bisnis yang benar.
![20250311083825](https://static-docs.nocobase.com/20250311083825.png)

### 4.2 Konfigurasi Detail Setiap Tombol Fungsi


| Tombol                            | Style                                | Operasi                                                          | Linkage Rule                                                                                  |
| --------------------------------- | ------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Tombol Edit                       | Operasi edit                         | —                                                                | Ketika status record adalah "Completed" (Selesai), otomatis dinonaktifkan, mencegah edit yang tidak perlu. |
| Tombol Tidak Memenuhi Syarat (Status Aktif) | "Unqualified >"             | Ubah status record menjadi "Unqualified".                        | Ditampilkan secara default; jika status adalah "Completed", tombol dinonaktifkan.             |
| Tombol Lead Baru (Tidak Aktif)    | Operasi update data, "New >"         | Atur status menjadi "New", setelah update berhasil tampilkan prompt "New". | Jika status record bukan "Unqualified" maka disembunyikan. (Yaitu jika record sudah dalam status "New" atau setelahnya, maka harus status aktif) |
| Tombol Lead Baru (Status Aktif)   | Operasi update data, "New >"         | Ubah status record menjadi "New".                                | Ketika status adalah "Unqualified" disembunyikan; jika status adalah "Completed", tombol dinonaktifkan. |
| Tombol Sedang Diproses (Tidak Aktif) | Operasi update data, "Working >"  | Ubah status menjadi "Working", dan tampilkan prompt sukses "Working". | Ketika status record bukan "Unqualified", "New" disembunyikan.                                |
| Tombol Sedang Diproses (Status Aktif) | Operasi update data, "Working >" | Ubah status record menjadi "Working".                            | Ketika status adalah "Unqualified", "New" disembunyikan; jika status adalah "Completed", tombol dinonaktifkan. |
| Tombol Sedang Di-follow-up (Tidak Aktif) | Operasi update data, "Nurturing >" | Atur status menjadi "Nurturing", dan tampilkan prompt sukses "Nurturing". | Ketika status record bukan "Unqualified", "New", "Working" disembunyikan.                |
| Tombol Sedang Di-follow-up (Status Aktif) | Operasi update data, "Nurturing >" | Ubah status record menjadi "Nurturing".                       | Ketika status adalah "Unqualified", "New", "Working" disembunyikan; jika status adalah "Completed", tombol dinonaktifkan. |
| Tombol Konversi                   | Operasi edit, "transfer", icon "√"  | Tampilkan form konversi, saat form disubmit, ubah status record menjadi "Completed". | Ketika status record adalah "Completed" disembunyikan, untuk mencegah transfer berulang. |
| Tombol Konversi Selesai (Status Aktif) | Operasi view, "transfered", icon "√" | Hanya digunakan untuk menampilkan informasi setelah konversi selesai, tidak memiliki fungsi edit. | Hanya ditampilkan ketika status record adalah "Completed"; pada status lain disembunyikan. |

- Contoh Linkage Rule:
  Sedang Diproses (Tidak Aktif)
  ![20250311084104](https://static-docs.nocobase.com/20250311084104.png)
  Sedang Diproses (Aktif)
  ![20250311083953](https://static-docs.nocobase.com/20250311083953.png)
- Form Konversi:
  Tombol Konversi (Tidak Aktif)
  ![](https://static-docs.nocobase.com/20250226094223.png)
  Tombol Konversi (Aktif)
  ![](https://static-docs.nocobase.com/20250226094203.png)
- Prompt yang muncul saat submit konversi:
  ![20250311084638](https://static-docs.nocobase.com/20250311084638.png)

### 4.3 Ringkasan Konfigurasi Tombol

- Setiap fitur menyediakan style tombol yang berbeda di status tidak aktif dan aktif.
- Memanfaatkan linkage rule, mengontrol tampilan tombol secara dinamis (sembunyi atau dinonaktifkan) berdasarkan status record, sehingga membimbing tenaga sales mengoperasikan sesuai alur kerja yang benar.

## 5. Pengaturan Linkage Rule Form

### 5.1 Aturan 1: Hanya Menampilkan Nama

- Ketika record belum dikonfirmasi, hanya tampilkan nama.
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
**Kumpulkan informasi lebih lanjut tentang Lead ini.**  
- Pahami kebutuhan dan minat calon Pelanggan
- Kumpulkan data kontak dasar dan latar belakang perusahaan
- Tentukan prioritas dan cara follow-up selanjutnya
{{/if}}
```

Ketika status adalah "Sedang Diproses":

```markdown
{{#if (eq $nRecord.status "Sedang Diproses")}}
**Hubungi Lead secara aktif dan lakukan evaluasi kebutuhan awal.**  
- Bangun koneksi dengan calon Pelanggan melalui telepon/email
- Pahami masalah dan tantangan yang dihadapi Pelanggan
- Lakukan penilaian awal kecocokan kebutuhan Pelanggan dengan produk/layanan perusahaan
{{/if}}
```

Ketika status adalah "Sedang Di-follow-up":

```markdown
{{#if (eq $nRecord.status "Sedang Di-follow-up")}}
**Gali kebutuhan Pelanggan lebih dalam, lakukan nurturing Lead.**  
- Sediakan materi produk atau saran solusi yang relevan
- Jawab pertanyaan Pelanggan, hilangkan keraguan
- Evaluasi kemungkinan konversi Lead
{{/if}}
```

Ketika status adalah "Konversi Selesai":

```markdown
{{#if (eq $nRecord.status "Konversi Selesai")}}
**Lead telah berhasil dikonversi menjadi Pelanggan.**  
- Konfirmasikan bahwa record Perusahaan dan Kontak terkait telah dibuat
- Buat record Opportunity, atur rencana follow-up
- Serahkan materi terkait dan record komunikasi kepada tenaga sales yang bertanggung jawab
{{/if}}
```

## 7. Menampilkan Object Asosiasi dan Link Redirect Setelah Konversi Selesai

### 7.1 Penjelasan Object Asosiasi

Setelah konversi selesai, kita ingin menampilkan object asosiasi terkait (Perusahaan, Kontak, Opportunity), dan dapat langsung redirect ke halaman detail.
Pada saat ini cari salah satu popup detail, misalnya Perusahaan, lalu salin link.
![20250311085502](https://static-docs.nocobase.com/20250311085502.png)
Perhatian: pada popup atau halaman lain, bagian akhir format link detail (angka setelah filterbytk) mewakili id object saat ini, contoh:

```text
{Base URL}/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{id}
```

### 7.2 Menggunakan Handlebars untuk Menghasilkan Link Asosiasi

Perusahaan:

```markdown
{{#if (eq $nRecord.status "Selesai")}}
**Perusahaan:**
[{{$nRecord.account.name}}](w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Kontak:

```markdown
{{#if (eq $nRecord.status "Selesai")}}
**Kontak:**
[{{$nRecord.contact.name}}](1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Opportunity:

```markdown
{{#if (eq $nRecord.status "Selesai")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
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
