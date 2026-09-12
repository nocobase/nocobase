# Ikhtisar Fitur CRM Sales Cloud

Dalam bab ini, kami akan membagi sistem berdasarkan fungsi bisnis menjadi beberapa modul, dan menjelaskan secara detail fitur inti dari setiap modul beserta struktur data yang sesuai. Solusi keseluruhan tidak hanya fokus pada kelancaran alur bisnis, tetapi juga mempertimbangkan kewajaran penyimpanan data dan skalabilitas sistem.

---

## 1. Manajemen Lead

### Ikhtisar Fitur

Modul manajemen Lead bertanggung jawab untuk mengumpulkan dan mengelola informasi calon Pelanggan. Sistem mendukung input Lead melalui berbagai channel seperti website, telepon, email, dan menyediakan fitur update status, catatan follow-up, dan komentar. Pada saat konversi Lead, sistem akan secara otomatis mendeteksi data duplikat untuk memastikan Lead yang sesuai dikonversi menjadi Pelanggan, Kontak, dan Opportunity.

### Tabel Data Terkait

- **Leads (Tabel Lead)**
  Menyimpan informasi dasar Lead, seperti nama, kontak, sumber, status saat ini, dan komentar. Mencatat waktu pembuatan dan log pembaruan setiap Lead, untuk memudahkan statistik dan analisis selanjutnya.

---

## 2. Manajemen Pelanggan dan Kontak

### Ikhtisar Fitur

Modul ini bertujuan membantu Pengguna membangun dan memelihara file Pelanggan. Perusahaan dapat mencatat nama perusahaan, industri, alamat, dan informasi penting lainnya dari Pelanggan, sekaligus mengelola informasi kontak yang terkait dengan Pelanggan (seperti nama, jabatan, telepon, dan email). Sistem mendukung asosiasi one-to-many atau many-to-many antara Pelanggan dan Kontak, untuk memastikan kelengkapan informasi dan sinkronisasi update.

### Tabel Data Terkait

- **Accounts (Tabel Pelanggan)**
  Mencatat file detail Pelanggan, termasuk informasi dasar perusahaan dan data terkait bisnis lainnya.
- **Contacts (Tabel Kontak)**
  Menyimpan informasi pribadi yang terkait dengan Pelanggan, dan terhubung dengan tabel Pelanggan melalui foreign key, untuk memastikan koherensi data.

### Diagram Alur Konversi Lead

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

- Input Lead → Follow-up Lead (Update Status) → Validasi Lead → Konversi menjadi Pelanggan, Kontak, dan Opportunity

---

## 3. Manajemen Opportunity

### Ikhtisar Fitur

Modul manajemen Opportunity fokus pada menghasilkan peluang penjualan dari Lead yang dikonversi atau informasi Pelanggan yang sudah ada. Pengguna dapat mencatat perkiraan tanggal penutupan Opportunity, tahap saat ini, perkiraan jumlah, dan probabilitas keberhasilan. Pada saat yang sama, sistem mendukung manajemen tahap penjualan secara dinamis, dan mencatat alasan detail saat Opportunity gagal, untuk optimasi strategi penjualan selanjutnya. Selain itu, modul memungkinkan asosiasi beberapa produk ke satu Opportunity, dan menghitung total jumlah secara otomatis.

### Tabel Data Terkait

- **Opportunities (Tabel Opportunity)**
  Mencatat informasi detail dari setiap peluang penjualan, seperti tanggal penutupan, tahap penjualan, dan perkiraan jumlah.
- **OpportunityLineItem (Tabel Detail Opportunity)**
  Menyimpan informasi produk spesifik yang terkait dengan Opportunity, termasuk ID produk, kuantitas, harga satuan, dan diskon, mendukung perhitungan jumlah otomatis.

### Langkah Konversi

- Pembuatan Opportunity → Manajemen Opportunity (Update Tahap) → Buat Quotation → Persetujuan Pelanggan → Buat Sales Order → Eksekusi Order dan Update Status

---

## 4. Manajemen Produk dan Price Book

### Ikhtisar Fitur

Modul ini bertanggung jawab untuk mengelola informasi produk dan strategi pricing-nya. Sistem dapat menginput informasi dasar produk, seperti kode produk, nama, deskripsi, stok, dan harga, serta mendukung pembuatan beberapa model harga. Dengan menghubungkan produk dengan price book, Pengguna dapat secara fleksibel mengelola kebutuhan pricing untuk pasar dan grup Pelanggan yang berbeda.

### Tabel Data Terkait

- **Products (Tabel Produk)**
  Menyimpan informasi detail semua produk, menyediakan data dasar untuk pembuatan quotation dan order.
- **PriceBooks (Tabel Price Book)**
  Mengelola berbagai model harga dan produk yang terkait, mendukung penyesuaian strategi pricing secara dinamis sesuai kebutuhan bisnis.

---

## 5. Manajemen Quotation

### Ikhtisar Fitur

Modul manajemen Quotation menghasilkan quotation formal dari Opportunity yang ada, mencatat masa berlaku quotation, diskon, tarif pajak, dan total jumlah. Sistem memiliki alur persetujuan built-in, memungkinkan manajemen melakukan review dan penyesuaian quotation. Setiap quotation juga dapat mencakup beberapa detail produk, untuk memastikan keakuratan perhitungan data.

### Tabel Data Terkait

- **Quotes (Tabel Quotation)**
  Mencatat informasi dasar quotation, termasuk Opportunity terkait, masa berlaku, diskon, tarif pajak, dan status keseluruhan.
- **QuoteLineItems (Tabel Detail Quotation)**
  Menyimpan data detail setiap produk dalam quotation, secara otomatis menghitung jumlah setiap produk dan total quotation.

---

## 6. Manajemen Sales Order

### Ikhtisar Fitur

Modul manajemen Sales Order mengkonversi quotation yang telah disetujui menjadi sales order, dan melacak seluruh proses order dari pembuatan hingga selesai. Pengguna dapat melihat status order secara real-time, catatan persetujuan, serta status logistik dan pengiriman, sehingga lebih baik dalam mengontrol progres eksekusi order.

### Tabel Data Terkait

- **SalesOrders (Tabel Sales Order)**
  Mencatat informasi detail order, termasuk quotation terkait, status order, catatan persetujuan, status pengiriman, waktu pembuatan order, dan sebagainya.

---

## 7. Manajemen Activity

### Ikhtisar Fitur

Modul manajemen Activity membantu tim sales mengelola pengaturan kerja harian, termasuk task, meeting, dan komunikasi telepon. Sistem memungkinkan mencatat konten spesifik aktivitas, peserta, dan komentar terkait, serta menyediakan fitur pengaturan jadwal dan pengingat, untuk memastikan semua aktivitas berjalan lancar sesuai rencana.

### Tabel Data Terkait

- **Activities (Tabel Catatan Aktivitas)**
  Menyimpan task, meeting, dan catatan panggilan, termasuk tipe aktivitas, tanggal, peserta, dan informasi Pelanggan atau Opportunity yang terkait.

---

## 8. Laporan Data dan Analisis

### Ikhtisar Fitur

Modul ini melalui statistik data multi-dimensi dan tampilan chart, membantu perusahaan memahami secara real-time kinerja penjualan dan kondisi konversi bisnis. Sistem mendukung pembuatan sales funnel, analisis tingkat konversi, serta laporan kinerja, untuk memberikan dukungan keputusan bagi manajemen.

### Penjelasan

Meskipun laporan data dan analisis tidak memiliki tabel data khusus, mereka bergantung pada data yang disimpan di setiap modul yang disebutkan sebelumnya, dan melalui agregasi serta analisis data merealisasikan feedback real-time dan prediksi tren.

---

## 9. Manajemen Marketing Campaign (Modul Opsional)

### Ikhtisar Fitur

Sebagai fitur tambahan, modul manajemen marketing campaign terutama digunakan untuk merencanakan dan melacak aktivitas marketing. Sistem dapat mencatat perencanaan, anggaran, eksekusi, dan evaluasi efek aktivitas, menghitung tingkat konversi Lead dan ROI, untuk memberikan dukungan data bagi promosi pasar.

### Penjelasan

Struktur data modul ini dapat diperluas sesuai kebutuhan aktual. Saat ini terutama berfokus pada mencatat eksekusi aktivitas marketing, dan saling melengkapi dengan data dari modul manajemen Lead.
