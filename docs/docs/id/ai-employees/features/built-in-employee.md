:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/ai-employees/features/built-in-employee).
:::

# Karyawan AI Bawaan

NocoBase dilengkapi dengan beberapa karyawan AI bawaan yang dirancang untuk skenario tertentu.

Anda hanya perlu mengonfigurasi layanan LLM dan mengaktifkan karyawan yang sesuai untuk mulai bekerja; model dapat diganti sesuai kebutuhan di dalam percakapan.


## Pendahuluan

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Nama Karyawan | Posisi Peran | Kemampuan Inti |
| :--- | :--- | :--- |
| **Cole** | Asisten NocoBase | Tanya jawab produk, pengambilan dokumen |
| **Ellis** | Pakar Email | Penyusunan email, pembuatan ringkasan, saran balasan |
| **Dex** | Spesialis Pengatur Data | Terjemahan bidang (field), pemformatan, ekstraksi informasi |
| **Viz** | Analis Wawasan | Wawasan data, analisis tren, interpretasi metrik utama |
| **Lexi** | Asisten Penerjemah | Terjemahan multibahasa, bantuan komunikasi |
| **Vera** | Analis Riset | Pencarian web, agregasi informasi, riset mendalam |
| **Dara** | Pakar Visualisasi Data | Konfigurasi bagan, pembuatan laporan visual |
| **Orin** | Pakar Pemodelan Data | Membantu merancang struktur koleksi, saran bidang (field) |
| **Nathan** | Insinyur Frontend | Membantu menulis cuplikan kode frontend, penyesuaian gaya (style) |


Anda dapat mengklik **bola melayang AI** di sudut kanan bawah antarmuka aplikasi, lalu pilih karyawan yang Anda butuhkan untuk mulai berkolaborasi.


## Karyawan AI Skenario Khusus

Beberapa karyawan AI bawaan (tipe pembangun) tidak muncul dalam daftar karyawan AI di sudut kanan bawah; mereka memiliki skenario kerja khusus, misalnya:

* Orin hanya muncul di halaman konfigurasi sumber data;
* Dara hanya muncul di halaman konfigurasi bagan;
* Nathan hanya muncul di editor JS.



---

Berikut adalah beberapa skenario aplikasi tipikal untuk karyawan AI guna memberikan inspirasi bagi Anda. Potensi lebih lanjut menanti eksplorasi Anda dalam skenario bisnis yang sebenarnya.


## Viz: Analis Wawasan

### Pendahuluan

> Hasilkan bagan dan wawasan dengan satu klik, biarkan data berbicara sendiri.

**Viz** adalah **Analis Wawasan AI** bawaan.
Ia memahami cara membaca data pada halaman Anda saat ini (seperti Leads, Opportunities, Accounts), secara otomatis menghasilkan bagan tren, bagan perbandingan, kartu KPI, dan kesimpulan ringkas, membuat analisis bisnis menjadi mudah dan intuitif.

> Ingin tahu "Mengapa penjualan turun akhir-akhir ini"?
> Cukup katakan satu kalimat kepada Viz, dan ia dapat memberi tahu Anda di bagian mana penurunan terjadi, apa kemungkinan alasannya, dan apa langkah selanjutnya yang bisa diambil.

### Skenario Penggunaan

Baik itu tinjauan bisnis bulanan, ROI saluran, atau corong penjualan (sales funnel), Anda dapat membiarkan Viz menganalisis, menghasilkan bagan, dan menginterpretasikan hasilnya.

| Skenario | Apa yang ingin Anda ketahui | Output dari Viz |
| -------- | ------------ | ------------------- |
| **Tinjauan Bulanan** | Apa yang lebih baik di bulan ini dibanding bulan lalu? | Kartu KPI + Bagan Tren + Tiga saran perbaikan |
| **Rincian Pertumbuhan** | Apakah pertumbuhan pendapatan didorong oleh volume atau harga? | Bagan dekomposisi faktor + Tabel perbandingan |
| **Analisis Saluran** | Saluran mana yang paling layak untuk investasi berkelanjutan? | Bagan ROI + Kurva retensi + Saran |
| **Analisis Corong** | Di mana arus trafik terhambat? | Bagan corong + Penjelasan hambatan |
| **Retensi Pelanggan** | Pelanggan mana yang paling berharga? | Bagan segmentasi RFM + Kurva retensi |
| **Evaluasi Promosi** | Seberapa efektif promosi besar tersebut? | Bagan perbandingan + Analisis elastisitas harga |

### Cara Penggunaan

**Titik Masuk Halaman**

* **Tombol kanan atas (Direkomendasikan)**
  
  Pada halaman seperti Leads, Opportunities, dan Accounts, klik **ikon Viz** di sudut kanan atas untuk memilih tugas yang telah ditentukan, seperti:

  * Konversi tahap dan tren
  * Perbandingan saluran sumber
  * Analisis tinjauan bulanan

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Panel global kanan bawah**
  
  Di halaman mana pun, Anda dapat memanggil panel AI global dan berbicara langsung kepada Viz:

  ```
  Analisis perubahan penjualan selama 90 hari terakhir
  ```

  Viz akan secara otomatis menyertakan konteks data dari halaman Anda saat ini.

**Interaksi**

Viz mendukung pertanyaan bahasa alami dan memahami tindak lanjut multi-putaran.
Contoh:

```
Hai Viz, hasilkan tren prospek untuk bulan ini.
```

```
Hanya tampilkan performa dari saluran pihak ketiga.
```

```
Lalu, wilayah mana yang tumbuh paling cepat?
```

Setiap pertanyaan tindak lanjut akan terus mendalami berdasarkan hasil analisis sebelumnya, tanpa perlu memasukkan kembali kondisi data.

### Tips Berinteraksi dengan Viz

| Cara | Efek |
| ---------- | ------------------- |
| Tentukan rentang waktu | "30 hari terakhir" atau "Bulan lalu vs. Bulan ini" lebih akurat |
| Tentukan dimensi | "Lihat berdasarkan wilayah/saluran/produk" membantu menyelaraskan perspektif |
| Fokus pada tren daripada detail | Viz ahli dalam mengidentifikasi arah perubahan dan alasan utama |
| Gunakan bahasa alami | Tidak perlu sintaks perintah, cukup ajukan pertanyaan seperti sedang mengobrol |


---



## Dex: Spesialis Pengatur Data

### Pendahuluan

> Ekstrak dan isi formulir dengan cepat, mengubah informasi yang berantakan menjadi data terstruktur.

`Dex` adalah spesialis pengatur data yang mengekstrak informasi yang diperlukan dari data atau file yang tidak terstruktur dan mengaturnya menjadi informasi terstruktur. Ia juga dapat memanggil alat untuk mengisi informasi tersebut ke dalam formulir.

### Cara Penggunaan

Panggil `Dex` pada halaman formulir untuk membuka jendela percakapan.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Klik `Add work context` di kotak input dan pilih `Pick block`; halaman akan masuk ke mode pemilihan blok.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Pilih blok formulir pada halaman.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Masukkan data yang ingin Anda atur oleh `Dex` di kotak dialog.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Setelah dikirim, `Dex` akan menyusun data tersebut dan menggunakan kemampuannya untuk memperbarui data ke dalam formulir yang dipilih.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Pakar Pemodelan Data

### Pendahuluan

> Rancang koleksi secara cerdas dan optimalkan struktur database.

`Orin` adalah pakar pemodelan data. Pada halaman konfigurasi sumber data utama, Anda dapat membiarkan `Orin` membantu Anda membuat atau mengubah koleksi.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Cara Penggunaan

Masuk ke plugin Manajer Sumber Data dan pilih untuk mengonfigurasi sumber data utama.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Klik avatar `Orin` di sudut kanan atas untuk membuka kotak dialog karyawan AI.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Jelaskan kebutuhan pemodelan Anda kepada `Orin`, kirim, dan tunggu balasan. 

Setelah `Orin` mengonfirmasi kebutuhan Anda, ia akan menggunakan kemampuannya dan membalas dengan pratinjau pemodelan data.

Setelah meninjau pratinjau, klik tombol `Finish review and apply` untuk membuat koleksi sesuai dengan pemodelan dari `Orin`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Insinyur Frontend

### Pendahuluan

> Membantu Anda menulis dan mengoptimalkan kode frontend untuk mengimplementasikan logika interaksi yang kompleks.

`Nathan` adalah pakar pengembangan frontend di NocoBase. Dalam skenario yang memerlukan JavaScript, seperti `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow`, dan `Linkage`, avatar Nathan akan muncul di sudut kanan atas editor kode, memungkinkan Anda memintanya membantu menulis atau mengubah kode di dalam editor.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Cara Penggunaan

Di editor kode, klik `Nathan` untuk membuka kotak dialog karyawan AI; kode di editor akan secara otomatis dilampirkan ke kotak input dan dikirim ke `Nathan` sebagai konteks aplikasi.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Masukkan kebutuhan pengkodean Anda, kirimkan ke `Nathan`, dan tunggu balasannya.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Klik tombol `Apply to editor` pada blok kode yang dibalas oleh `Nathan` untuk menimpa kode di editor dengan kodenya.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Klik tombol `Run` di editor kode untuk melihat hasilnya secara real-time.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Riwayat Kode

Klik ikon 'Baris Perintah' di sudut kanan atas kotak dialog `Nathan` untuk melihat cuplikan kode yang telah Anda kirim dan cuplikan kode yang telah dibalas oleh `Nathan` dalam sesi saat ini.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)