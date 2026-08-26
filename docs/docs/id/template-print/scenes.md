---
title: "Contoh Generate \"Kontrak Pasokan dan Pembelian\" dengan Fitur \"Template Print\""
description: "NocoBase Template Print: Contoh generate \"Kontrak Pasokan dan Pembelian\" dengan fitur \"Template Print\""
keywords: "scenes,NocoBase"
---

# Contoh Generate "Kontrak Pasokan dan Pembelian" dengan Fitur "Template Print"

Dalam skenario supply chain atau perdagangan, sering kali perlu dengan cepat menghasilkan satu "Kontrak Pasokan dan Pembelian" yang terstandarisasi, dan secara dinamis mengisi konten berdasarkan informasi pembeli, penjual, detail Produk, dll. dari sumber data. Berikut ini akan mengambil contoh kasus penggunaan "kontrak" yang disederhanakan, untuk menunjukkan bagaimana mengonfigurasi dan menggunakan fitur "Template Print", memetakan informasi data ke placeholder pada Template kontrak, sehingga otomatis menghasilkan dokumen kontrak akhir.

---

## 1. Latar Belakang dan Ikhtisar Struktur Data

Dalam contoh kami, kira-kira ada beberapa tabel data utama berikut (mengabaikan field lain yang tidak terkait):

- **parties**: Menyimpan informasi unit atau individu pihak A/B, termasuk nama, alamat, kontak, telepon, dll.
- **contracts**: Menyimpan record kontrak spesifik, termasuk nomor kontrak, foreign key pembeli/penjual, informasi penanda tangan, tanggal mulai dan selesai, rekening bank, dll.
- **contract_line_items**: Digunakan untuk menyimpan beberapa item di bawah kontrak ini (nama Produk, spesifikasi, jumlah, harga satuan, tanggal pengiriman, dll.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Karena sistem saat ini hanya mendukung print tunggal, kami akan klik "Print" pada halaman "Detail Kontrak", sistem otomatis mengambil record contracts yang sesuai, serta informasi parties terkait, mengisinya ke dokumen Word atau PDF.

---

## 2. Persiapan

### 2.1 Persiapan Plugin

Perhatikan, "Template Print" kami adalah plugin komersial, perlu dibeli dan diaktifkan sebelum dapat melakukan operasi print.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Konfirmasi Aktivasi Plugin:**

Pada halaman apa pun, buat Block Detail (misalnya users), lihat apakah ada opsi konfigurasi Template yang sesuai di konfigurasi Action:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Pembuatan Tabel Data

Buat tabel pihak utama, tabel kontrak, dan tabel item Produk yang dirancang di atas (pilih field inti saja).

#### Tabel Kontrak (Contracts)

| Kategori Field | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Buyer ID | buyer_id | Integer |
| | Seller ID | seller_id | Integer |
| **Association Fields** | | | |
| | Contract Items | contract_items | One to many |
| | Buyer (Party A) | buyer | Many to one |
| | Seller (Party B) | seller | Many to one |
| **General Fields** | | | |
| | Contract Number | contract_no | Single line text |
| | Delivery Start Date | start_date | Datetime (with time zone) |
| | Delivery End Date | end_date | Datetime (with time zone) |
| | Deposit Ratio (%) | deposit_ratio | Percent |
| | Payment Days After Delivery | payment_days_after | Integer |
| | Bank Account Name (Beneficiary) | bank_account_name | Single line text |
| | Bank Name | bank_name | Single line text |
| | Bank Account Number (Beneficiary) | bank_account_number | Single line text |
| | Total Amount | total_amount | Number |
| | Currency Codes | currency_codes | Single select |
| | Balance Ratio (%) | balance_ratio | Percent |
| | Balance Days After Delivery | balance_days_after | Integer |
| | Delivery Place | delivery_place | Long text |
| | Party A Signatory Name | party_a_signatory_name | Single line text |
| | Party A Signatory Title | party_a_signatory_title | Single line text |
| | Party B Signatory Name | party_b_signatory_name | Single line text |
| | Party B Signatory Title | party_b_signatory_title | Single line text |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

#### Tabel Pihak (Parties)

| Kategori Field | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| **General Fields** | | | |
| | Party Name | party_name | Single line text |
| | Address | address | Single line text |
| | Contact Person | contact_person | Single line text |
| | Contact Phone | contact_phone | Phone |
| | Position | position | Single line text |
| | Email | email | Email |
| | Website | website | URL |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

#### Tabel Item Produk (Contract Line Items)

| Kategori Field | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Contract ID | contract_id | Integer |
| **Association Fields** | | | |
| | Contract | contract | Many to one |
| **General Fields** | | | |
| | Product Name | product_name | Single line text |
| | Specification / Model | spec | Single line text |
| | Quantity | quantity | Integer |
| | Unit Price | unit_price | Number |
| | Total Amount | total_amount | Number |
| | Delivery Date | delivery_date | Datetime (with time zone) |
| | Remark | remark | Long text |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

### 2.3 Konfigurasi Antarmuka

**Input data contoh:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Konfigurasi reaction rules sebagai berikut, otomatis menghitung total dan pembayaran setelahnya:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Buat Block lihat, setelah konfirmasi data, aktifkan operasi "Template Print":**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Konfigurasi Plugin Template Print

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Tambahkan satu konfigurasi Template, contoh "Kontrak Pasokan dan Pembelian":

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Selanjutnya kita masuk ke Tab Field List, dapat melihat semua field objek saat ini. Setelah klik "Copy", kita dapat mulai mengisi Template.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Persiapan File Kontrak

**File Template Kontrak Word**

Persiapkan template kontrak terlebih dahulu (file .docx), contoh: `SUPPLY AND PURCHASE CONTRACT.docx`

Dalam contoh artikel ini, kami memberikan versi sederhana dari "Kontrak Pasokan dan Pembelian", yang berisi placeholder contoh:

- `{d.contract_no}`: Nomor kontrak
- `{d.buyer.party_name}`, `{d.seller.party_name}`: Nama pembeli, penjual
- `{d.total_amount}`: Total kontrak
- Serta placeholder lain seperti "kontak", "alamat", "telepon", dll.

Selanjutnya Anda dapat menyalin berdasarkan field tabel yang Anda buat dan menimpanya ke Word.

---

## 3. Tutorial Variabel Template

### 3.1 Pengisian Variabel Dasar, Properti Objek Relasi

**Pengisian Field Dasar:**

Misalnya nomor kontrak di paling atas, atau objek pihak penanda tangan kontrak. Klik copy, langsung paste ke posisi kosong yang sesuai di kontrak.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Format Data

#### Format Tanggal

Pada Template, kita sering perlu memformat field, terutama field tanggal. Format tanggal yang langsung disalin biasanya panjang (seperti Wed Jan 01 2025 00:00:00 GMT), perlu Format untuk menampilkan style yang kita inginkan.

Untuk field tanggal, dapat menggunakan fungsi `formatD()` untuk menentukan format output:

```
{nama_field:formatD(style format)}
```

**Contoh:**

Misalnya field asli yang kita salin adalah `{d.created_at}`, dan kita perlu memformat tanggal menjadi format `2025-01-01`, maka modifikasi field ini menjadi:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Output: 2025-01-01
```

**Style Format Tanggal Umum:**

- `YYYY` - Tahun (4 digit)
- `MM` - Bulan (2 digit)
- `DD` - Tanggal (2 digit)
- `HH` - Jam (24 jam)
- `mm` - Menit
- `ss` - Detik

**Contoh 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Output: 2025-01-01 14:30:00
```

#### Format Jumlah

Misalkan ada satu field jumlah, contoh `{d.total_amount}` di kontrak. Kita dapat menggunakan fungsi `formatN()` untuk memformat angka, menentukan jumlah desimal dan thousand separator.

**Sintaks:**

```
{nama_field:formatN(jumlah desimal, thousand separator)}
```

- **Jumlah Desimal**: Anda dapat menentukan berapa banyak desimal yang dipertahankan. Contoh, `2` berarti pertahankan 2 desimal
- **Thousand Separator**: Tentukan apakah akan menggunakan thousand separator, biasanya `true` atau `false`

**Contoh 1: Format jumlah dengan thousand separator dan dua desimal**

```
{d.amount:formatN(2, true)}  // Output: 1,234.56
```

Ini akan memformat `d.amount` menjadi dua desimal dan menambahkan thousand separator.

**Contoh 2: Format jumlah sebagai integer tanpa desimal**

```
{d.amount:formatN(0, true)}  // Output: 1,235
```

Ini akan memformat `d.amount` menjadi integer, dan menambahkan thousand separator.

**Contoh 3: Format jumlah dengan dua desimal tanpa thousand separator**

```
{d.amount:formatN(2, false)}  // Output: 1234.56
```

Di sini thousand separator dinonaktifkan, hanya mempertahankan dua desimal.

**Kebutuhan Format Jumlah Lainnya:**

- **Simbol Mata Uang**: Carbone sendiri tidak langsung menyediakan fungsi Format simbol mata uang, tetapi Anda dapat mengimplementasikannya melalui data langsung atau menambahkan simbol mata uang di Template. Contoh:
  ```
  {d.amount:formatN(2, true)} Yuan  // Output: 1,234.56 Yuan
  ```

#### Format String

Untuk field string, dapat menggunakan `:upperCase` untuk menentukan format teks, contoh konversi case.

**Sintaks:**

```
{nama_field:upperCase:perintah lain}
```

**Cara Konversi Umum:**

- `upperCase` - Konversi ke huruf besar semua
- `lowerCase` - Konversi ke huruf kecil semua
- `upperCase:ucFirst` - Huruf pertama besar

**Contoh:**

```
{d.party_a_signatory_name:upperCase}  // Output: JOHN DOE
```

### 3.3 Print Loop

#### Cara Print Daftar Sub-objek (seperti Detail Produk)

Saat kita perlu print tabel yang berisi beberapa sub-item (contoh detail Produk), biasanya perlu mengadopsi cara print loop. Dengan begitu, sistem akan menghasilkan satu baris konten berdasarkan setiap item dalam list, hingga semua item terlewati.

Misalkan kita memiliki daftar Produk (contoh `contract_items`), yang berisi beberapa objek Produk. Setiap objek Produk memiliki beberapa properti, seperti nama Produk, spesifikasi, jumlah, harga satuan, total, dan catatan.

**Langkah 1: Isi Field di Baris Pertama Tabel**

Pertama, di baris pertama tabel (bukan header), kita langsung salin dan isi variabel Template. Variabel ini akan diganti dengan data yang sesuai, ditampilkan di output.

Contoh, baris pertama tabel sebagai berikut:

| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Di sini, `d.contract_items[i]` mewakili item ke-i dalam daftar Produk, `i` adalah indeks, mewakili urutan Produk saat ini.

**Langkah 2: Modifikasi Indeks di Baris Kedua**

Selanjutnya, di tabel baris kedua, kita modifikasi indeks field menjadi `i+1`, dan isi properti pertama saja. Ini karena saat print loop, kita ingin mengambil item data berikutnya dari list, dan menampilkannya di baris berikutnya.

Contoh, baris kedua diisi sebagai berikut:
| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |


Dalam contoh ini, kita mengubah `[i]` menjadi `[i+1]`, dengan begitu dapat mendapatkan data Produk berikutnya dalam list.

**Langkah 3: Sistem Otomatis Loop Print Saat Render Template**

Saat sistem memproses Template ini, akan beroperasi sesuai logika berikut:

1. Baris pertama akan diisi sesuai field yang Anda atur di Template
2. Lalu, sistem akan otomatis menghapus baris kedua, dan mulai mengekstrak data dari `d.contract_items`, mengisi setiap baris berulang sesuai format tabel, hingga semua detail Produk diprint

`i` di setiap baris akan bertambah, memastikan setiap baris menampilkan informasi Produk yang berbeda.

---

## 4. Upload dan Konfigurasi Template Kontrak

### 4.1 Upload Template

1. Klik tombol "Add Template", input nama Template, contoh "Template Kontrak Pasokan dan Pembelian"
2. Upload [file kontrak Word (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) yang sudah disiapkan, yang sudah berisi semua placeholder


![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Setelah selesai, sistem akan menampilkan Template ini di daftar Template yang dapat dipilih, untuk penggunaan selanjutnya
4. Kita klik "Use" untuk mengaktifkan Template ini

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Saat ini keluar dari popup, klik download Template, dapat memperoleh Template lengkap yang dihasilkan.

**Tips:**

- Jika Template menggunakan format `.doc` atau lainnya, mungkin perlu dikonversi ke `.docx`, tergantung dukungan plugin
- Pada file Word, perhatikan jangan memisahkan placeholder ke beberapa paragraf atau text box, untuk menghindari render abnormal

---

Selamat menggunakan! Melalui fitur "Template Print", Anda dapat menghemat banyak pekerjaan berulang dalam manajemen kontrak, menghindari kesalahan copy paste manual, mengimplementasikan output kontrak yang terstandarisasi dan otomatis.
