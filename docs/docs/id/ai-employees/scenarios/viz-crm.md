
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Agen AI · Viz: Panduan Konfigurasi Skenario CRM

> Menggunakan contoh CRM, pelajari cara membuat analis wawasan AI Anda benar-benar memahami bisnis dan mengeluarkan potensi penuhnya.

## 1. Pendahuluan: Membuat Viz Beralih dari "Melihat Data" menjadi "Memahami Bisnis"

Dalam sistem NocoBase, **Viz** adalah analis wawasan AI bawaan.
Ia dapat mengenali konteks halaman (seperti Prospek, Peluang, Akun), dan menghasilkan grafik tren, grafik corong, serta kartu KPI.
Namun secara _default_, ia hanya memiliki kemampuan kueri paling dasar:

| Alat                      | Deskripsi Fungsi | Keamanan |
| ----------------------- | ---------------- | -------- |
| Get Collection Names    | Dapatkan Daftar Koleksi | ✅ Aman |
| Get Collection Metadata | Dapatkan Struktur Bidang | ✅ Aman |

Alat-alat ini hanya memungkinkan Viz "mengenali struktur," tetapi belum benar-benar "memahami konten."
Untuk memungkinkannya menghasilkan wawasan, mendeteksi anomali, dan menganalisis tren, Anda perlu **memperluasnya dengan alat analisis yang lebih sesuai**.

Dalam Demo CRM resmi, kami menggunakan dua metode:

*   **Overall Analytics (mesin analisis serbaguna)**: Solusi bertemplate, aman, dan dapat digunakan kembali;
*   **SQL Execution (mesin analisis khusus)**: Menawarkan lebih banyak fleksibilitas tetapi dengan risiko yang lebih besar.

Keduanya bukanlah satu-satunya pilihan; mereka lebih seperti **paradigma desain**:

> Anda dapat mengikuti prinsip-prinsipnya untuk membuat implementasi yang lebih sesuai dengan bisnis Anda sendiri.

---

## 2. Struktur Viz: Kepribadian Stabil + Tugas Fleksibel

Untuk memahami cara memperluas Viz, Anda perlu memahami desain internalnya yang berlapis:

| Lapisan          | Deskripsi                                                               | Contoh       |
| ---------------- | ----------------------------------------------------------------------- | ------------ |
| **Definisi Peran** | Kepribadian dan metode analisis Viz: Memahami → Mengueri → Menganalisis → Memvisualisasikan | Tetap tidak berubah |
| **Definisi Tugas** | _Prompt_ yang disesuaikan dan kombinasi alat untuk skenario bisnis tertentu             | Dapat dimodifikasi |
| **Konfigurasi Alat** | Jembatan bagi Viz untuk memanggil sumber data eksternal atau alur kerja              | Dapat diganti secara bebas |

Desain berlapis ini memungkinkan Viz untuk mempertahankan kepribadian yang stabil (logika analisis yang konsisten),
sekaligus dapat dengan cepat beradaptasi dengan berbagai skenario bisnis (CRM, manajemen rumah sakit, analisis saluran, operasi produksi...).

## 3. Pola Satu: Mesin Analisis Bertemplate (Direkomendasikan)

### 3.1 Ikhtisar Prinsip

**Overall Analytics** adalah mesin analisis inti dalam Demo CRM.
Ia mengelola semua kueri SQL melalui **koleksi template analisis data (data_analysis)**.
Viz tidak menulis SQL secara langsung, melainkan **memanggil template yang telah ditentukan** untuk menghasilkan hasil.

Alur eksekusi adalah sebagai berikut:

```mermaid
flowchart TD
    A[Viz menerima tugas] --> B[Memanggil alur kerja Overall Analytics]
    B --> C[Mencocokkan template berdasarkan halaman/tugas saat ini]
    C --> D[Mengeksekusi SQL template (hanya-baca)]
    D --> E[Mengembalikan hasil data]
    E --> F[Viz menghasilkan grafik + interpretasi singkat]
```

Dengan cara ini, Viz dapat menghasilkan hasil analisis yang aman dan terstandarisasi dalam hitungan detik,
dan administrator dapat mengelola serta meninjau semua template SQL secara terpusat.

---

### 3.2 Struktur Koleksi Template (data_analysis)

| Nama Bidang                                       | Tipe     | Deskripsi                 | Contoh                                                 |
| ------------------------------------------------- | -------- | ------------------------- | ------------------------------------------------------ |
| **id**                                            | Integer  | Kunci Primer              | 1                                                      |
| **name**                                          | Text     | Nama template analisis    | Leads Data Analysis                                    |
| **collection**                                    | Text     | Koleksi terkait           | Lead                                                   |
| **sql**                                           | Code     | Pernyataan SQL analisis (hanya-baca) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage`     |
| **description**                                   | Markdown | Deskripsi atau definisi template | "Menghitung jumlah prospek berdasarkan tahapan" |
| **createdAt / createdBy / updatedAt / updatedBy** | Bidang Sistem | Informasi audit           | Dibuat secara otomatis                                 |

#### Contoh Template dalam Demo CRM

| Nama                             | Koleksi     | Deskripsi                       |
| -------------------------------- | ----------- | ------------------------------- |
| Account Data Analysis            | Account     | Analisis Data Akun              |
| Contact Data Analysis            | Contact     | Analisis Data Kontak            |
| Leads Data Analysis              | Lead        | Analisis Tren Prospek           |
| Opportunity Data Analysis        | Opportunity | Corong Tahapan Peluang          |
| Task Data Analysis               | Todo Tasks  | Statistik Status Tugas yang Harus Dilakukan |
| Users (Sales Reps) Data Analysis | Users       | Perbandingan Kinerja Perwakilan Penjualan |

---

### 3.3 Keunggulan Pola Ini

| Dimensi              | Keunggulan                                                              |
| -------------------- | ----------------------------------------------------------------------- |
| **Keamanan**         | Semua SQL disimpan dan ditinjau, menghindari pembuatan kueri langsung.  |
| **Kemudahan Pemeliharaan** | Template dikelola secara terpusat, diperbarui secara seragam.           |
| **Reusabilitas**     | Template yang sama dapat digunakan kembali oleh beberapa tugas.           |
| **Portabilitas**     | Dapat dengan mudah dimigrasikan ke sistem lain, hanya memerlukan struktur koleksi yang sama. |
| **Pengalaman Pengguna** | Pengguna bisnis tidak perlu khawatir tentang SQL; mereka hanya perlu memulai permintaan analisis. |

> 📘 Koleksi `data_analysis` ini tidak harus dinamai demikian.
> Kuncinya adalah: **menyimpan logika analisis dalam bentuk template** dan memanggilnya secara seragam oleh alur kerja.

---

### 3.4 Cara Membuat Viz Menggunakannya

Dalam definisi tugas, Anda dapat secara eksplisit memberi tahu Viz:

```markdown
Hai Viz,

Mohon analisis data modul saat ini.

**Prioritas:** Gunakan alat Overall Analytics untuk mendapatkan hasil analisis dari koleksi template.
**Jika template yang cocok tidak ditemukan:** Nyatakan bahwa template hilang dan sarankan administrator untuk menambahkannya.

Persyaratan keluaran:
- Hasilkan grafik terpisah untuk setiap hasil;
- Sertakan deskripsi singkat 2–3 kalimat di bawah grafik;
- Jangan mengarang data atau membuat asumsi.
```

Dengan cara ini, Viz akan secara otomatis memanggil alur kerja, mencocokkan SQL yang paling sesuai dari koleksi template, dan menghasilkan grafik.

---

## 4. Pola Dua: Eksekutor SQL Khusus (Gunakan dengan hati-hati)

### 4.1 Skenario yang Berlaku

Ketika Anda memerlukan analisis eksplorasi, kueri _ad-hoc_, atau agregasi JOIN multi-koleksi, Anda dapat meminta Viz memanggil alat **SQL Execution**.

Fitur alat ini adalah:

*   Viz dapat langsung menghasilkan kueri `SELECT`;
*   Sistem mengeksekusinya dan mengembalikan hasilnya;
*   Viz bertanggung jawab untuk analisis dan visualisasi.

Contoh tugas:

> "Mohon analisis tren tingkat konversi prospek berdasarkan wilayah selama 90 hari terakhir."

Dalam kasus ini, Viz mungkin menghasilkan:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Risiko dan Rekomendasi Perlindungan

| Titik Risiko            | Strategi Perlindungan                                   |
| ----------------------- | ------------------------------------------------------- |
| Menghasilkan operasi tulis | Batasi secara paksa ke `SELECT`                         |
| Mengakses koleksi yang tidak terkait | Validasi apakah nama koleksi ada                        |
| Risiko kinerja dengan koleksi besar | Batasi rentang waktu, gunakan LIMIT untuk jumlah baris |
| Ketertelusuran operasi  | Aktifkan pencatatan kueri dan audit                     |
| Kontrol izin pengguna   | Hanya administrator yang dapat menggunakan alat ini     |

> Rekomendasi umum:
>
> *   Pengguna biasa hanya boleh mengaktifkan analisis bertemplate (Overall Analytics);
> *   Hanya administrator atau analis senior yang boleh menggunakan SQL Execution.

---

## 5. Jika Anda Ingin Membangun "Overall Analytics" Anda Sendiri

Berikut adalah pendekatan umum yang sederhana, yang dapat Anda replikasi di sistem apa pun (tidak bergantung pada NocoBase):

### Langkah 1: Rancang Koleksi Template

Nama koleksi bisa apa saja (misalnya, `analysis_templates`).
Cukup perlu menyertakan bidang: `name`, `sql`, `collection`, dan `description`.

### Langkah 2: Tulis Layanan atau Alur Kerja "Ambil Template → Eksekusi"

Logika:

1.  Menerima tugas atau konteks halaman (misalnya, koleksi saat ini);
2.  Mencocokkan template;
3.  Mengeksekusi SQL template (hanya-baca);
4.  Mengembalikan struktur data standar (baris + bidang).

### Langkah 3: Minta AI Memanggil Antarmuka Ini

_Prompt_ tugas dapat ditulis seperti ini:

```
Pertama, coba panggil alat analisis template. Jika tidak ada analisis yang cocok ditemukan di template, maka gunakan eksekutor SQL.
Pastikan semua kueri hanya-baca dan hasilkan grafik untuk menampilkan hasilnya.
```

> Dengan cara ini, sistem agen AI Anda akan memiliki kemampuan analisis yang mirip dengan Demo CRM, tetapi akan sepenuhnya independen dan dapat disesuaikan.

---

## 6. Praktik Terbaik dan Rekomendasi Desain

| Rekomendasi                   | Deskripsi                                                               |
| ----------------------------- | ----------------------------------------------------------------------- |
| **Prioritaskan analisis bertemplate** | Aman, stabil, dan dapat digunakan kembali                               |
| **SQL Execution hanya sebagai pelengkap** | Terbatas untuk _debugging_ internal atau kueri _ad-hoc_                 |
| **Satu grafik, satu poin utama** | Keluaran yang jelas, hindari kekacauan berlebihan                       |
| **Penamaan template yang jelas** | Beri nama sesuai halaman/domain bisnis, misalnya `Leads-Stage-Conversion` |
| **Penjelasan ringkas dan jelas** | Sertai setiap grafik dengan ringkasan 2–3 kalimat                        |
| **Indikasikan jika template hilang** | Informasikan kepada pengguna "Template yang sesuai tidak ditemukan" daripada keluaran kosong |

---

## 7. Dari Demo CRM ke Skenario Anda

Baik Anda bekerja dengan CRM rumah sakit, manufaktur, logistik gudang, atau penerimaan pendidikan,
selama Anda dapat menjawab tiga pertanyaan berikut, Viz dapat memberikan nilai pada sistem Anda:

| Pertanyaan                  | Contoh                                  |
| --------------------------- | --------------------------------------- |
| **1. Apa yang ingin Anda analisis?** | Tren prospek / Tahapan kesepakatan / Tingkat operasi peralatan |
| **2. Di mana datanya?**     | Koleksi mana, bidang mana               |
| **3. Bagaimana Anda ingin menyajikannya?** | Grafik garis, corong, pie, tabel perbandingan |

Setelah Anda mendefinisikan hal-hal ini, Anda hanya perlu:

*   Menulis logika analisis ke dalam koleksi template;
*   Melampirkan _prompt_ tugas ke halaman;
*   Viz kemudian dapat "mengambil alih" analisis laporan Anda.

---

## 8. Kesimpulan: Bawa Paradigma Ini Bersama Anda

"Overall Analytics" dan "SQL Execution" hanyalah dua contoh implementasi.
Yang lebih penting adalah ide di baliknya:

> **Buat agen AI memahami logika bisnis Anda, bukan hanya mengeksekusi _prompt_.**

Baik Anda menggunakan NocoBase, sistem pribadi, atau alur kerja kustom Anda sendiri,
Anda dapat mereplikasi struktur ini:

*   Template terpusat;
*   Panggilan alur kerja;
*   Eksekusi hanya-baca;
*   Penyajian AI.

Dengan cara ini, Viz tidak lagi hanya "AI yang dapat menghasilkan grafik,"
tetapi seorang analis sejati yang memahami data Anda, definisi Anda, dan bisnis Anda.