:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Karyawan AI · Viz: Analis Wawasan

> Hasilkan grafik dan wawasan dengan sekali klik, biarkan data berbicara sendiri.

## 1. Siapa Viz

**Viz** adalah **Analis Wawasan AI** bawaan.
Ia mampu membaca data di halaman Anda saat ini (seperti Leads, Opportunities, Accounts), secara otomatis menghasilkan grafik tren, grafik perbandingan, kartu KPI, dan kesimpulan ringkas, membuat analisis bisnis menjadi mudah dan intuitif.

Ia bukan sekadar alat pelaporan yang kaku, melainkan seorang analis yang dapat memahami pertanyaan dan menceritakan kisah.

> 💡 Ingin tahu "mengapa penjualan baru-baru ini menurun"?
> Cukup ucapkan satu kalimat kepada Viz, dan ia akan memberi tahu Anda di bagian mana penurunan terjadi, apa kemungkinan penyebabnya, dan langkah apa yang bisa Anda ambil selanjutnya.

## 2. Apa yang Bisa Anda Lakukan dengan Viz

| Kemampuan             | Deskripsi                                | Contoh                       |
| :------------------- | :--------------------------------------- | :--------------------------- |
| 📊 **Hasilkan Grafik Otomatis** | Visualisasikan data dengan sekali klik, tanpa perlu menulis SQL | "Hasilkan tren penjualan bulan ini" |
| 🔍 **Temukan Perubahan dan Anomali** | Analisis penyebab kenaikan atau penurunan      | "Apa yang membuat bulan ini lebih baik dari bulan lalu?" |
| 🧭 **Bantu Pengambilan Keputusan** | Berikan saran yang dapat ditindaklanjuti berdasarkan data | "Saluran mana yang paling layak untuk ditambah anggarannya?" |
| 🧩 **Agregasi Perspektif Data** | Bandingkan lintas berbagai dimensi seperti wilayah, produk, sumber | "Tampilkan perbandingan pendapatan per wilayah" |

Baik untuk tinjauan bisnis bulanan, ROI saluran, atau corong penjualan, Viz dapat menghasilkan grafik dan interpretasi dalam hitungan detik.

## 3. Cara Penggunaan

### 3.1 Titik Masuk Halaman

*   **Tombol Sudut Kanan Atas (Direkomendasikan)**
    Di sudut kanan atas halaman seperti Leads, Opportunities, dan Accounts, klik **ikon Viz** untuk memilih tugas prasetel, seperti:

    *   Konversi dan tren tahapan
    *   Perbandingan saluran sumber
    *   Analisis tinjauan bulanan

    ![Contoh di halaman Leads](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

*   **Panel Global Sudut Kanan Bawah**
    Di halaman mana pun Anda berada, Anda dapat memunculkan panel AI global dan berbicara langsung dengan Viz:

    ```
    Analisis perubahan penjualan dalam 90 hari terakhir
    ```

    Viz akan secara otomatis menggunakan konteks data dari halaman Anda saat ini.

### 3.2 Metode Interaksi

Viz mendukung pertanyaan bahasa alami dan dapat memahami pertanyaan lanjutan multi-giliran.
Contoh:

```
Hai Viz, hasilkan tren lead bulan ini.
```

```
Tampilkan hanya performa saluran pihak ketiga.
```

```
Lalu wilayah mana yang pertumbuhannya paling cepat?
```

Setiap pertanyaan lanjutan akan menggali lebih dalam berdasarkan hasil analisis sebelumnya, tanpa perlu memasukkan kembali kondisi data.

## 4. Skenario Analisis Umum

| Skenario             | Apa yang ingin Anda ketahui             | Output Viz                               |
| :------------------- | :-------------------------------------- | :--------------------------------------- |
| **Tinjauan Bulanan** | Apa yang membuat bulan ini lebih baik dari bulan lalu? | Kartu KPI + Grafik Tren + Tiga saran perbaikan |
| **Pembongkaran Pertumbuhan** | Apakah kenaikan pendapatan disebabkan oleh perubahan volume atau harga? | Grafik Pembongkaran Faktor + Tabel Perbandingan |
| **Analisis Saluran** | Saluran mana yang paling layak untuk terus diinvestasikan? | Grafik ROI + Kurva Retensi + Saran          |
| **Analisis Corong**  | Di mana lalu lintas macet?              | Grafik Corong + Penjelasan Hambatan      |
| **Retensi Pelanggan** | Pelanggan mana yang paling berharga?    | Grafik Segmentasi RFM + Kurva Retensi    |
| **Evaluasi Promosi** | Seberapa efektif promosi besar?         | Grafik Perbandingan + Analisis Elastisitas Harga |

> 📈 Semua grafik dihasilkan dalam format ECharts yang valid, dengan satu poin utama per grafik, dan disertai kesimpulan singkat.
> Jika data tidak mencukupi, Viz akan langsung menyatakannya, dan tidak akan mengarang hasil.

## 5. Tips Berinteraksi dengan Viz

| Praktik                      | Efek                                     |
| :--------------------------- | :--------------------------------------- |
| ✅ **Tentukan rentang waktu** | "30 hari terakhir", "bulan lalu vs. bulan ini" untuk lebih akurat |
| ✅ **Tentukan dimensi**      | "Berdasarkan wilayah/saluran/produk" membantu menyelaraskan perspektif |
| ✅ **Fokus pada tren, bukan detail** | Viz unggul dalam mengidentifikasi arah perubahan dan alasan utama |
| ✅ **Gunakan bahasa alami**  | Tidak perlu sintaks perintah, cukup bertanya seperti sedang mengobrol |

## 6. Siapa yang Paling Cocok Menggunakan Viz

| Peran                | Kasus Penggunaan                               |
| :------------------- | :--------------------------------------------- |
| **Manajer Penjualan** | Melihat tingkat konversi tahapan, performa saluran, hasil tim |
| **Pemasar**          | Menganalisis ROI pengeluaran iklan, efektivitas promosi, retensi pelanggan |
| **Analis Operasi**   | Menarik data dengan cepat, menemukan anomali, memvalidasi hipotesis |
| **Manajemen**        | Memahami status bisnis sekilas, mendapatkan sinyal untuk pengambilan keputusan |

## 7. Saran Penggunaan

1.  **Mulai dengan tugas prasetel**
    Demo resmi telah menyertakan tugas-tugas umum, sehingga Anda dapat langsung merasakan hasilnya tanpa perlu prompt.
    Contoh: Halaman Leads → Klik **Viz → Konversi dan tren tahapan**

2.  **Amati gaya output**
    Setiap poin analisis memiliki grafik terpisah dan deskripsi singkat.
    Grafik yang jelas dan teks yang ringkas adalah output standar Viz.

3.  **Ajukan pertanyaan lanjutan secara bertahap**
    Setelah membaca laporan analisis, terus tanyakan "mengapa" dan "bagaimana cara memperbaikinya", Viz akan secara otomatis menindaklanjuti.

## 8. Ringkasan

*   Viz = Asisten wawasan data Anda
*   Tidak perlu menulis SQL atau mengonfigurasi grafik
*   Dapatkan laporan analisis dengan satu kalimat bahasa alami
*   Semua kesimpulan didasarkan pada data nyata, jelas, dan kredibel

> Mulai dengan **Leads → Viz → Konversi dan tren tahapan**,
> melihat grafik pertama adalah titik awal terbaik untuk memahami Karyawan AI ini.