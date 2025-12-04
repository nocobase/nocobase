
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Menggunakan Fitur "Cetak Template" untuk Membuat Contoh Kontrak Pengadaan dan Pembelian

Dalam skenario rantai pasok atau perdagangan, seringkali diperlukan untuk dengan cepat membuat "Kontrak Pengadaan dan Pembelian" yang terstandardisasi dan mengisi konten secara dinamis berdasarkan informasi dari sumber data seperti pembeli, penjual, detail produk, dan lainnya. Berikut ini, kami akan menggunakan contoh kasus penggunaan "Kontrak" yang disederhanakan untuk menunjukkan kepada Anda cara mengonfigurasi dan menggunakan fitur "Cetak Template" untuk memetakan informasi data ke *placeholder* dalam template kontrak, sehingga dokumen kontrak akhir dapat dibuat secara otomatis.

---

## 1. Latar Belakang dan Gambaran Umum Struktur Data

Dalam contoh ini, secara garis besar terdapat koleksi-koleksi utama berikut (dengan mengabaikan kolom lain yang tidak relevan):

- **parties**: menyimpan informasi unit atau individu Pihak A/Pihak B, termasuk nama, alamat, kontak, telepon, dll.
- **contracts**: menyimpan catatan kontrak spesifik, termasuk nomor kontrak, *foreign key* pembeli/penjual, informasi penandatangan, tanggal mulai/akhir, rekening bank, dll.
- **contract_line_items**: digunakan untuk menyimpan beberapa item di bawah kontrak tersebut (nama produk, spesifikasi, kuantitas, harga satuan, tanggal pengiriman, dll.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Karena sistem saat ini hanya mendukung pencetakan satu catatan, kami akan mengeklik "Cetak" pada halaman "Detail Kontrak", dan sistem akan secara otomatis mengambil catatan `contracts` yang sesuai, serta informasi `parties` terkait dan lainnya, lalu mengisinya ke dalam dokumen Word atau PDF.

## 2. Persiapan

### 2.1 Persiapan Plugin

Perlu diketahui, `plugin` "Cetak Template" kami adalah `plugin` komersial yang perlu dibeli dan diaktifkan sebelum operasi pencetakan dapat dilakukan.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Konfirmasi Aktivasi Plugin:**

Pada halaman mana pun, buat blok detail (misalnya `users`), dan periksa apakah ada opsi konfigurasi template yang sesuai dalam konfigurasi aksi:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Pembuatan Koleksi

Buat koleksi entitas utama, koleksi kontrak, dan koleksi item produk yang dirancang di atas (cukup pilih kolom inti).

#### Koleksi Kontrak (`Contracts`)

| Kategori Kolom | Nama Tampilan Kolom | Nama Kolom | Antarmuka Kolom |
|---------|-------------------|------------|-----------------|
| **Kolom PK & FK** | | | |
| | ID | id | Bilangan Bulat |
| | ID Pembeli | buyer_id | Bilangan Bulat |
| | ID Penjual | seller_id | Bilangan Bulat |
| **Kolom Asosiasi** | | | |
| | Item Kontrak | contract_items | Satu ke Banyak |
| | Pembeli (Pihak A) | buyer | Banyak ke Satu |
| | Penjual (Pihak B) | seller | Banyak ke Satu |
| **Kolom Umum** | | | |
| | Nomor Kontrak | contract_no | Teks Satu Baris |
| | Tanggal Mulai Pengiriman | start_date | Tanggal Waktu (dengan zona waktu) |
| | Tanggal Akhir Pengiriman | end_date | Tanggal Waktu (dengan zona waktu) |
| | Rasio Deposit (%) | deposit_ratio | Persen |
| | Hari Pembayaran Setelah Pengiriman | payment_days_after | Bilangan Bulat |
| | Nama Rekening Bank (Penerima) | bank_account_name | Teks Satu Baris |
| | Nama Bank | bank_name | Teks Satu Baris |
| | Nomor Rekening Bank (Penerima) | bank_account_number | Teks Satu Baris |
| | Jumlah Total | total_amount | Angka |
| | Kode Mata Uang | currency_codes | Pilihan Tunggal |
| | Rasio Saldo (%) | balance_ratio | Persen |
| | Hari Saldo Setelah Pengiriman | balance_days_after | Bilangan Bulat |
| | Tempat Pengiriman | delivery_place | Teks Panjang |
| | Nama Penandatangan Pihak A | party_a_signatory_name | Teks Satu Baris |
| | Jabatan Penandatangan Pihak A | party_a_signatory_title | Teks Satu Baris |
| | Nama Penandatangan Pihak B | party_b_signatory_name | Teks Satu Baris |
| | Jabatan Penandatangan Pihak B | party_b_signatory_title | Teks Satu Baris |
| **Kolom Sistem** | | | |
| | Dibuat Pada | createdAt | Dibuat pada |
| | Dibuat Oleh | createdBy | Dibuat oleh |
| | Terakhir Diperbarui Pada | updatedAt | Terakhir diperbarui pada |
| | Terakhir Diperbarui Oleh | updatedBy | Terakhir diperbarui oleh |

#### Koleksi Pihak (`Parties`)

| Kategori Kolom | Nama Tampilan Kolom | Nama Kolom | Antarmuka Kolom |
|---------|-------------------|------------|-----------------|
| **Kolom PK & FK** | | | |
| | ID | id | Bilangan Bulat |
| **Kolom Umum** | | | |
| | Nama Pihak | party_name | Teks Satu Baris |
| | Alamat | address | Teks Satu Baris |
| | Kontak Person | contact_person | Teks Satu Baris |
| | Telepon Kontak | contact_phone | Telepon |
| | Jabatan | position | Teks Satu Baris |
| | Email | email | Email |
| | Situs Web | website | URL |
| **Kolom Sistem** | | | |
| | Dibuat Pada | createdAt | Dibuat pada |
| | Dibuat Oleh | createdBy | Dibuat oleh |
| | Terakhir Diperbarui Pada | updatedAt | Terakhir diperbarui pada |
| | Terakhir Diperbarui Oleh | updatedBy | Terakhir diperbarui oleh |

#### Koleksi Item Baris Kontrak (`Contract Line Items`)

| Kategori Kolom | Nama Tampilan Kolom | Nama Kolom | Antarmuka Kolom |
|---------|-------------------|------------|-----------------|
| **Kolom PK & FK** | | | |
| | ID | id | Bilangan Bulat |
| | ID Kontrak | contract_id | Bilangan Bulat |
| **Kolom Asosiasi** | | | |
| | Kontrak | contract | Banyak ke Satu |
| **Kolom Umum** | | | |
| | Nama Produk | product_name | Teks Satu Baris |
| | Spesifikasi / Model | spec | Teks Satu Baris |
| | Kuantitas | quantity | Bilangan Bulat |
| | Harga Satuan | unit_price | Angka |
| | Jumlah Total | total_amount | Angka |
| | Tanggal Pengiriman | delivery_date | Tanggal Waktu (dengan zona waktu) |
| | Catatan | remark | Teks Panjang |
| **Kolom Sistem** | | | |
| | Dibuat Pada | createdAt | Dibuat pada |
| | Dibuat Oleh | createdBy | Dibuat oleh |
| | Terakhir Diperbarui Pada | updatedAt | Terakhir diperbarui pada |
| | Terakhir Diperbarui Oleh | updatedBy | Terakhir diperbarui oleh |

### 2.3 Konfigurasi Antarmuka

**Masukkan Data Contoh:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Konfigurasikan aturan keterkaitan sebagai berikut, untuk secara otomatis menghitung total harga dan pembayaran sisa:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Buat blok tampilan, setelah mengonfirmasi data, aktifkan aksi "Cetak Template":**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Konfigurasi Plugin Cetak Template

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Tambahkan konfigurasi template baru, misalnya "Kontrak Pengadaan dan Pembelian":

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Selanjutnya, kita akan masuk ke tab daftar kolom, di mana kita dapat melihat semua kolom dari objek saat ini. Setelah mengeklik "Salin", kita dapat mulai mengisi template.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Persiapan Berkas Kontrak

**Berkas Template Kontrak Word**

Siapkan template kontrak (.docx) terlebih dahulu, contohnya: `SUPPLY AND PURCHASE CONTRACT.docx`

Dalam contoh ini, kami menyajikan versi sederhana dari "Kontrak Pengadaan dan Pembelian", yang berisi *placeholder* contoh:

- `{d.contract_no}`: Nomor kontrak
- `{d.buyer.party_name}`, `{d.seller.party_name}`: Nama pembeli, nama penjual
- `{d.total_amount}`: Jumlah total kontrak
- Serta *placeholder* lain seperti "kontak person", "alamat", "telepon", dll.

Selanjutnya, Anda dapat menyalin kolom dari koleksi yang telah Anda buat dan menempelkannya ke dalam Word.

---

## 3. Tutorial Variabel Template

### 3.1 Pengisian Variabel Dasar dan Properti Objek Terkait

**Pengisian Kolom Dasar:**

Misalnya, nomor kontrak di bagian atas, atau objek entitas penandatangan kontrak. Kita cukup mengeklik "Salin" dan menempelkannya langsung ke ruang kosong yang sesuai di kontrak.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Pemformatan Data

#### Pemformatan Tanggal

Dalam template, kita sering perlu memformat kolom, terutama kolom tanggal. Format tanggal yang disalin langsung biasanya panjang (misalnya Wed Jan 01 2025 00:00:00 GMT), dan perlu diformat untuk menampilkan gaya yang kita inginkan.

Untuk kolom tanggal, Anda dapat menggunakan fungsi `formatD()` untuk menentukan format keluaran:

```
{nama_kolom:formatD(gaya_format)}
```

**Contoh:**

Misalnya, jika kolom asli yang kita salin adalah `{d.created_at}`, dan kita perlu memformat tanggal menjadi format `2025-01-01`, maka ubah kolom ini menjadi:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Keluaran: 2025-01-01
```

**Gaya Pemformatan Tanggal Umum:**

- `YYYY` - Tahun (empat digit)
- `MM` - Bulan (dua digit)
- `DD` - Tanggal (dua digit)
- `HH` - Jam (format 24 jam)
- `mm` - Menit
- `ss` - Detik

**Contoh 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Keluaran: 2025-01-01 14:30:00
```

#### Pemformatan Nominal

Misalkan ada kolom nominal, seperti `{d.total_amount}` dalam kontrak. Kita dapat menggunakan fungsi `formatN()` untuk memformat angka, menentukan jumlah desimal dan pemisah ribuan.

**Sintaks:**

```
{nama_kolom:formatN(jumlah_desimal, pemisah_ribuan)}
```

- **Jumlah desimal**: Anda dapat menentukan berapa banyak angka desimal yang akan dipertahankan. Misalnya, `2` berarti mempertahankan dua angka desimal.
- **Pemisah ribuan**: Tentukan apakah akan menggunakan pemisah ribuan, biasanya `true` atau `false`.

**Contoh 1: Memformat nominal dengan pemisah ribuan dan dua angka desimal**

```
{d.amount:formatN(2, true)}  // Keluaran: 1,234.56
```

Ini akan memformat `d.amount` menjadi dua angka desimal dan menambahkan pemisah ribuan.

**Contoh 2: Memformat nominal menjadi bilangan bulat tanpa angka desimal**

```
{d.amount:formatN(0, true)}  // Keluaran: 1,235
```

Ini akan memformat `d.amount` menjadi bilangan bulat dan menambahkan pemisah ribuan.

**Contoh 3: Memformat nominal dengan dua angka desimal tetapi tanpa pemisah ribuan**

```
{d.amount:formatN(2, false)}  // Keluaran: 1234.56
```

Di sini, pemisah ribuan dinonaktifkan, dan hanya dua angka desimal yang dipertahankan.

**Kebutuhan Pemformatan Nominal Lainnya:**

- **Simbol Mata Uang**: Carbone sendiri tidak secara langsung menyediakan fungsi pemformatan simbol mata uang, tetapi Anda dapat menambahkannya melalui data langsung atau di template. Misalnya:
  ```
  {d.amount:formatN(2, true)} IDR  // Keluaran: 1,234.56 IDR
  ```

#### Pemformatan String

Untuk kolom string, Anda dapat menggunakan `:upperCase` untuk menentukan format teks, seperti konversi huruf besar/kecil.

**Sintaks:**

```
{nama_kolom:upperCase:perintah_lain}
```

**Metode Konversi Umum:**

- `upperCase` - Mengonversi ke huruf besar semua
- `lowerCase` - Mengonversi ke huruf kecil semua
- `upperCase:ucFirst` - Mengkapitalisasi huruf pertama

**Contoh:**

```
{d.party_a_signatory_name:upperCase}  // Keluaran: JOHN DOE
```

### 3.3 Pencetakan Berulang

#### Cara Mencetak Daftar Objek Anak (misalnya Detail Produk)

Ketika kita perlu mencetak tabel yang berisi beberapa sub-item (misalnya detail produk), biasanya diperlukan metode pencetakan berulang. Dengan cara ini, sistem akan menghasilkan satu baris konten untuk setiap item dalam daftar, hingga semua item selesai diproses.

Misalkan kita memiliki daftar produk (misalnya `contract_items`), yang berisi beberapa objek produk. Setiap objek produk memiliki beberapa atribut, seperti nama produk, spesifikasi, kuantitas, harga satuan, jumlah total, dan catatan.

**Langkah 1: Isi Kolom pada Baris Pertama Tabel**

Pertama, pada baris pertama tabel (bukan *header*), kita langsung menyalin dan mengisi variabel template. Variabel-variabel ini akan diganti dengan data yang sesuai dan ditampilkan dalam keluaran.

Misalnya, baris pertama tabel adalah sebagai berikut:

| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Di sini, `d.contract_items[i]` mewakili item ke-i dalam daftar produk, dan `i` adalah indeks yang mewakili urutan produk saat ini.

**Langkah 2: Ubah Indeks pada Baris Kedua**

Selanjutnya, pada baris kedua tabel, kita akan mengubah indeks kolom menjadi `i+1`, dan cukup mengisi atribut pertama. Ini karena saat pencetakan berulang, kita perlu mengambil data item berikutnya dari daftar dan menampilkannya di baris berikutnya.

Misalnya, baris kedua diisi sebagai berikut:
| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

Dalam contoh ini, kita mengubah `[i]` menjadi `[i+1]`, sehingga kita bisa mendapatkan data produk berikutnya dalam daftar.

**Langkah 3: Pencetakan Berulang Otomatis Saat *Rendering* Template**

Ketika sistem memproses template ini, ia akan beroperasi sesuai dengan logika berikut:

1. Baris pertama akan diisi sesuai dengan kolom yang Anda atur di template.
2. Kemudian, sistem akan secara otomatis menghapus baris kedua, dan mulai mengekstrak data dari `d.contract_items`, mengisi setiap baris secara berulang dalam format tabel hingga semua detail produk selesai dicetak.

Nilai `i` di setiap baris akan bertambah, memastikan bahwa setiap baris menampilkan informasi produk yang berbeda.

---

## 4. Mengunggah dan Mengonfigurasi Template Kontrak

### 4.1 Mengunggah Template

1. Klik tombol "Tambah template", dan masukkan nama template, misalnya "Template Kontrak Pengadaan dan Pembelian".
2. Unggah [berkas kontrak Word (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) yang telah disiapkan, yang sudah berisi semua *placeholder*.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Setelah selesai, sistem akan mencantumkan template tersebut dalam daftar template yang tersedia untuk penggunaan di masa mendatang.
4. Kita mengeklik "Gunakan" untuk mengaktifkan template ini.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Pada titik ini, keluar dari *popup* saat ini dan klik "Unduh template" untuk mendapatkan template lengkap yang telah dibuat.

**Tips:**

- Jika template menggunakan format `.doc` atau format lain, mungkin perlu dikonversi ke `.docx`, tergantung pada dukungan `plugin`.
- Dalam berkas Word, perhatikan agar tidak memisahkan *placeholder* ke dalam beberapa paragraf atau kotak teks, untuk menghindari anomali *rendering*.

---

Selamat menggunakan! Dengan fitur "Cetak Template", Anda dapat sangat menghemat pekerjaan berulang dalam manajemen kontrak, menghindari kesalahan penyalinan manual, dan mencapai standardisasi serta keluaran kontrak otomatis.