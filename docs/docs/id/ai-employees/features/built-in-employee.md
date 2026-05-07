---
pkg: "@nocobase/plugin-ai"
title: "Karyawan AI Bawaan"
description: "Karyawan AI bawaan NocoBase: positioning role dan skenario penggunaan Atlas, Cole, Ellis, Dex, Viz, Lexi, Vera, Dara, Orin, Nathan, termasuk Atlas pemimpin tim, Viz analisis insight, Dex pengelolaan data, Orin pemodelan data, Nathan pengembangan frontend."
keywords: "Karyawan AI Bawaan,Atlas,Cole,Dex,Viz,Ellis,Lexi,Vera,Dara,Orin,Nathan,NocoBase"
---

# Karyawan AI Bawaan

NocoBase menyediakan beberapa Karyawan AI yang ditujukan untuk skenario tertentu.

Anda hanya perlu mengonfigurasi LLM Service dan mengaktifkan karyawan terkait, maka dapat mulai bekerja; model dapat diganti sesuai kebutuhan dalam sesi.


## Pengantar

![20260331165935](https://static-docs.nocobase.com/20260331165935.png)

| Nama Karyawan | Positioning Role | Kemampuan Inti |
| :------------ | :--------------- | :------------- |
| **Atlas** | Pemimpin Tim | Karyawan AI umum default, mengenali maksud Pengguna, secara otomatis menugaskan Karyawan AI yang sesuai untuk menangani masalah |
| **Cole** | Asisten NocoBase | Q&A penggunaan produk, retrieval dokumen |
| **Ellis** | Spesialis Email | Penulisan email, pembuatan ringkasan, saran balasan |
| **Dex** | Spesialis Pengelolaan Data | Terjemahan Field, format, ekstraksi informasi |
| **Viz** | Analis Insight | Insight data, analisis tren, interpretasi indikator kunci |
| **Lexi** | Asisten Terjemahan | Terjemahan multi-bahasa, bantuan komunikasi |
| **Vera** | Analis Riset | Pencarian web, ringkasan informasi, riset mendalam |
| **Dara** | Spesialis Visualisasi Data | Konfigurasi grafik, pembuatan laporan visualisasi |
| **Orin** | Spesialis Pemodelan Data | Membantu merancang struktur tabel data, saran Field |
| **Nathan** | Engineer Frontend | Membantu menulis snippet kode frontend, penyesuaian style |


Pada antarmuka aplikasi klik **AI floating ball** di pojok kanan bawah, untuk masuk ke sesi AI dan mulai berkolaborasi.

Jika perlu beralih ke Karyawan AI lain, dapat memilih melalui daftar dropdown Karyawan AI dalam sesi.

## Karyawan AI Default Atlas

### Pengantar

> Entry default Karyawan AI, memahami maksud Pengguna dan menugaskan Karyawan AI yang sesuai secara terpadu untuk membantu menangani

Atlas adalah Karyawan AI entry total default bawaan NocoBase. Sebagian besar kasus, langsung berdialog dengan Atlas saja; ia akan menggabungkan konteks untuk memahami maksud Pengguna, dan menugaskan Karyawan AI yang sesuai secara terpadu untuk membantu menangani masalah saat ini.

### Cara Penggunaan

Klik **AI floating ball** di pojok kanan bawah antarmuka aplikasi, untuk masuk ke sesi dengan Atlas.

Dalam sebagian besar skenario, langsung deskripsikan kebutuhan Anda saja, Atlas akan terus merespons atau mengoordinasikan Karyawan AI yang sesuai untuk berpartisipasi dalam penanganan.

![Atlas](https://static-docs.nocobase.com/20260331172734.png)

## Karyawan AI Skenario Eksklusif

Sebagian Karyawan AI bawaan (kategori build) tidak akan muncul di daftar Karyawan AI di pojok kanan bawah, mereka memiliki skenario kerja eksklusif, contohnya

* Orin hanya akan muncul di halaman konfigurasi data source;
* Dara hanya akan muncul di halaman konfigurasi grafik;
* Nathan hanya akan muncul di JS editor.



---

Berikut tercantum beberapa skenario aplikasi tipikal Karyawan AI, semoga dapat memberikan inspirasi untuk Anda. Lebih banyak potensi, dinanti untuk dieksplorasi lebih lanjut dalam bisnis aktual Anda.


## Viz: Analis Insight

### Pengantar

> Hasilkan grafik dan insight dengan satu klik, biarkan data berbicara sendiri.

**Viz** adalah **AI Analis Insight** bawaan.
Ia tahu cara membaca data halaman saat ini (seperti Leads, Opportunities, Accounts), secara otomatis menghasilkan grafik tren, grafik perbandingan, kartu KPI dan kesimpulan ringkas, membuat analisis bisnis menjadi mudah dan intuitif.

> Ingin tahu "mengapa penjualan akhir-akhir ini menurun"?
> Cukup katakan satu kalimat ke Viz, ia dapat memberi tahu Anda penurunan ada di tahap mana, kemungkinan alasannya apa, serta langkah selanjutnya bagaimana.

### Skenario Penggunaan

Baik review bisnis bulanan, ROI channel, atau funnel penjualan, semua dapat membiarkan Viz menganalisis, menghasilkan grafik, dan menafsirkan hasil.

| Skenario | Apa yang Anda Ingin Pahami | Output Viz |
| -------- | -------------------------- | ---------- |
| **Review Bulanan** | Bulan ini lebih baik dari bulan lalu di mana? | Kartu KPI + Grafik Tren + Tiga Saran Perbaikan |
| **Pemecahan Pertumbuhan** | Kenaikan revenue karena kuantitas atau harga? | Grafik Dekomposisi Faktor + Tabel Perbandingan |
| **Analisis Channel** | Channel mana yang paling layak terus diinvestasikan? | Grafik ROI + Kurva Retensi + Saran |
| **Analisis Funnel** | Traffic terjebak di langkah mana? | Grafik Funnel + Penjelasan Bottleneck |
| **Retensi Pelanggan** | Pelanggan mana yang paling berharga? | Grafik Pengelompokan RFM + Kurva Retensi |
| **Evaluasi Promosi** | Bagaimana efek promosi besar? | Grafik Perbandingan + Analisis Elastisitas Harga |

### Cara Penggunaan

**Entry Halaman**

* **Tombol Pojok Kanan Atas (Disarankan)**

  Pada halaman Leads, Opportunities, Accounts, dll, klik **ikon Viz** di pojok kanan atas, dapat memilih tugas preset, seperti:

  * Konversi tahap dan tren
  * Perbandingan channel sumber
  * Analisis review bulanan

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Panel Global Pojok Kanan Bawah**

  Tidak peduli di halaman mana, dapat memunculkan panel AI global, langsung berbicara ke Viz:

  ```
  Analisis perubahan penjualan dalam 90 hari terakhir
  ```

  Viz akan secara otomatis membawa konteks data halaman tempat Anda berada.

**Cara Interaksi**

Viz mendukung tanya bahasa natural, juga dapat memahami pertanyaan lanjutan multi-putaran.
Contoh:

```
Hi Viz, hasilkan tren leads bulan ini.
```

```
Hanya lihat performa channel pihak ketiga.
```

```
Lalu region mana yang pertumbuhannya paling cepat?
```

Setiap pertanyaan lanjutan akan terus mendalam berdasarkan hasil analisis sebelumnya, tanpa perlu memasukkan kondisi data berulang kali.

### Tips untuk Berdialog dengan Viz

| Praktik | Efek |
| ------- | ---- |
| Jelaskan rentang waktu | "30 hari terakhir" "bulan lalu vs bulan ini" lebih akurat |
| Tentukan dimensi | "Lihat berdasarkan region/channel/produk" membantu menyelaraskan perspektif |
| Fokus pada tren bukan detail | Viz ahli menemukan arah perubahan dan alasan kunci |
| Gunakan bahasa natural | Tidak perlu sintaks command, cukup tanya seperti chatting |


---



## Dex: Spesialis Pengelolaan Data

### Pengantar

> Cepat ekstrak dan isi formulir, ubah informasi acak menjadi terstruktur.

`Dex` adalah spesialis pengelolaan data, dari data atau file tidak terstruktur mengekstrak informasi yang dibutuhkan dan menatanya menjadi informasi terstruktur, dan dapat memanggil tools untuk mengisi informasi ke formulir.

### Cara Penggunaan

Pada halaman formulir munculkan `Dex`, buka jendela dialog.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Klik `Add work context` di kotak input pilih `Pick block`, halaman masuk ke status pemilihan Block.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Pilih Block formulir di halaman.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Pada kotak dialog masukkan data yang akan ditata oleh `Dex`.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Setelah dikirim `Dex` akan menstrukturkan data, dan menggunakan Skills untuk memperbarui data ke formulir yang dipilih.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Pemodel Data

### Pengantar

> Merancang tabel data secara cerdas, mengoptimalkan struktur database.

`Orin` adalah spesialis pemodelan data, pada halaman konfigurasi data source utama dapat membiarkan `Orin` membantu Anda membuat atau memodifikasi tabel data.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Cara Penggunaan

Masuk ke Plugin manajemen data source, pilih konfigurasi data source utama

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Klik avatar `Orin` di pojok kanan atas, buka kotak dialog Karyawan AI

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Deskripsikan kebutuhan pemodelan Anda kepada `Orin`, kirim dan tunggu balasan.

Saat `Orin` mengonfirmasi kebutuhan Anda, akan menggunakan Skills dan membalas Anda preview pemodelan data.

Setelah melihat preview, klik tombol `Finish review and apply` untuk membuat tabel data sesuai pemodelan `Orin`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Engineer Frontend

### Pengantar

> Membantu Anda menulis dan mengoptimalkan kode frontend, mengimplementasikan logika interaksi kompleks.

`Nathan` adalah pakar pengembangan frontend di NocoBase, di skenario seperti `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow`, `Linkage` yang perlu menulis JavaScript, di pojok kanan atas code editor akan ada avatar `Nathan`, dapat membiarkannya membantu Anda menulis atau memodifikasi kode dalam code editor.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Cara Penggunaan

Pada code editor, klik `Nathan` untuk membuka kotak dialog Karyawan AI, kode dalam code editor akan otomatis terlampir di kotak input, dikirim ke `Nathan` sebagai konteks aplikasi.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Masukkan kebutuhan coding Anda, kirim ke `Nathan` tunggu ia membalas.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Klik tombol `Apply to editor` pada blok kode balasan `Nathan`, untuk meng-overwrite kodenya ke code editor.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Klik tombol `Run` code editor, dapat melihat efek secara real-time.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Riwayat Kode

Klik ikon 'command line' di pojok kanan atas kotak dialog `Nathan`, dapat melihat snippet kode yang Anda kirim dan snippet kode yang `Nathan` balas dalam sesi saat ini.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)
