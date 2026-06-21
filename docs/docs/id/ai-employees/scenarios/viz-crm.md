---
pkg: "@nocobase/plugin-ai"
title: "Panduan Konfigurasi Skenario Viz CRM"
description: "Konfigurasi Viz Analis Insight dengan contoh CRM: engine analisis berbasis template Overall Analytics, analisis spesialisasi SQL Execution, tabel template data_analysis, keamanan dan praktik terbaik."
keywords: "Viz,CRM,Overall Analytics,SQL Execution,Analisis Data,NocoBase"
---

# Karyawan AI · Viz: Panduan Konfigurasi Skenario CRM

> Mengambil contoh CRM, pelajari cara membuat AI Analis Insight Anda benar-benar memahami bisnis dan menggunakan seluruh potensinya.

## 1. Pendahuluan: Membuat Viz Beralih dari "Melihat Data" ke "Memahami Bisnis"

Pada sistem NocoBase, **Viz** adalah AI Analis Insight preset.
Ia dapat mengenali konteks halaman (seperti Leads, Opportunities, Accounts), menghasilkan grafik tren, grafik funnel, dan kartu KPI.
Namun secara default, ia hanya memiliki kemampuan query paling dasar:

| Tool | Penjelasan Fungsi | Keamanan |
| ---- | ----------------- | -------- |
| Get Collection Names | Mendapatkan daftar tabel data | ✅ Aman |
| Get Collection Metadata | Mendapatkan struktur Field | ✅ Aman |

Tools ini hanya membuat Viz "mengenali struktur", masih tidak dapat benar-benar "memahami konten".
Untuk membuatnya menghasilkan insight, menemukan anomali, menganalisis tren, Anda perlu **memperluas tools analisis yang lebih sesuai** untuknya.

Pada CRM Demo resmi, kami menggunakan dua cara:

* **Overall Analytics (Engine Analisis Umum)**: Solusi yang dapat digunakan kembali, terstandar, dan aman;
* **SQL Execution (Engine Analisis Spesialisasi)**: Lebih fleksibel, namun risikonya lebih besar.

Keduanya bukan satu-satunya pilihan, mereka lebih seperti **paradigma desain**:

> Anda dapat menyalin prinsipnya, membuat implementasi yang lebih sesuai untuk bisnis Anda sendiri.

---

## 2. Struktur Viz: Persona Stabil + Tugas Fleksibel

Untuk memahami cara memperluas Viz, terlebih dahulu pahami bahwa internalnya dirancang berlapis:

| Tingkat | Penjelasan | Contoh |
| ------- | ---------- | ------ |
| **Definisi Role** | Persona dan metode analisis Viz: Pahami → Query → Analisis → Visualisasi | Tetap tidak berubah |
| **Definisi Tugas** | Kombinasi prompt dan tools yang dikustomisasi untuk skenario bisnis tertentu | Dapat dimodifikasi |
| **Konfigurasi Tool** | Jembatan Viz untuk memanggil data source eksternal atau Workflow | Dapat diganti dengan bebas |

Desain berlapis seperti ini, memungkinkan Viz mempertahankan kepribadian yang stabil (logika analisis konsisten),
sekaligus dapat dengan cepat beradaptasi dengan skenario bisnis yang berbeda (CRM, manajemen rumah sakit, analisis channel, operasional produksi…).

---

## 3. Mode Satu: Engine Analisis Berbasis Template (Disarankan)

### 3.1 Ikhtisar Prinsip

**Overall Analytics** adalah engine analisis inti pada CRM Demo.
Ia mengelola semua query SQL melalui **tabel template analisis data (data_analysis)**.
Viz tidak menulis SQL secara langsung, tetapi **memanggil template yang sudah didefinisikan** untuk menghasilkan hasil.

Alur eksekusi sebagai berikut:

```mermaid
flowchart TD
    A[Viz Menerima Tugas] --> B[Memanggil Workflow Overall Analytics]
    B --> C[Mencocokkan Template Berdasarkan Halaman/Tugas Saat Ini]
    C --> D[Menjalankan Template SQL (Read-only)]
    D --> E[Mengembalikan Hasil Data]
    E --> F[Viz Menghasilkan Grafik + Penafsiran Singkat]
```

Dengan demikian, Viz dapat menghasilkan hasil analisis yang aman dan terstandar dalam beberapa detik,
sementara administrator dapat secara terpadu mengelola dan meninjau semua template SQL.

---

### 3.2 Struktur Tabel Template (data_analysis)

| Nama Field | Tipe | Penjelasan | Contoh |
| ---------- | ---- | ---------- | ------ |
| **id** | Integer | Primary key | 1 |
| **name** | Text | Nama template analisis | Leads Data Analysis |
| **collection** | Text | Tabel data terkait | Lead |
| **sql** | Code | Statement SQL analisis (read-only) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description** | Markdown | Penjelasan atau definisi template | "Hitung jumlah leads berdasarkan tahap" |
| **createdAt / createdBy / updatedAt / updatedBy** | Field sistem | Informasi audit | Otomatis dihasilkan |

#### Contoh Template di CRM Demo

| Name | Collection | Description |
| ---- | ---------- | ----------- |
| Account Data Analysis | Account | Analisis data account |
| Contact Data Analysis | Contact | Analisis kontak |
| Leads Data Analysis | Lead | Analisis tren leads |
| Opportunity Data Analysis | Opportunity | Funnel tahap opportunity |
| Task Data Analysis | Todo Tasks | Statistik status to-do task |
| Users (Sales Reps) Data Analysis | Users | Perbandingan kinerja sales rep |

---

### 3.3 Keuntungan Mode Ini

| Dimensi | Keuntungan |
| ------- | ---------- |
| **Keamanan** | Semua SQL disimpan dan diaudit, menghindari pembuatan query langsung |
| **Maintainability** | Manajemen template terpusat, update terpadu |
| **Reusability** | Template yang sama dapat digunakan kembali oleh beberapa tugas |
| **Portability** | Mudah dimigrasikan ke sistem lain, hanya membutuhkan struktur tabel yang sama |
| **Pengalaman Pengguna** | Pengguna bisnis tidak perlu peduli SQL, hanya perlu mengirim request analisis |

> 📘 Tabel `data_analysis` ini tidak harus diberi nama seperti ini.
> Yang penting adalah: **menyimpan logika analisis dalam bentuk template**, dipanggil secara terpadu oleh Workflow.

---

### 3.4 Cara Membuat Viz Menggunakannya

Pada definisi tugas, dapat memberi tahu Viz dengan jelas:

```markdown
Hi Viz,

Tolong analisis data modul saat ini.

**Prioritaskan menggunakan:** Tool Overall Analytics, dapatkan hasil analisis dari tabel template.
**Jika tidak menemukan template yang cocok:** Jelaskan kekurangan template, dan sarankan administrator untuk melengkapi.

Persyaratan output:
- Setiap hasil menghasilkan grafik secara independen;
- Di bawah grafik dilampirkan 2-3 kalimat penjelasan singkat;
- Tidak mengarang data atau membuat asumsi.
```

Dengan demikian, Viz akan secara otomatis memanggil Workflow, mencocokkan SQL paling sesuai dari tabel template dan menghasilkan grafik.

---

## 4. Mode Dua: SQL Executor Spesialisasi (Hati-hati Digunakan)

### 4.1 Skenario Penggunaan

Saat Anda perlu analisis eksploratif, query sementara, atau agregasi JOIN multi-tabel, Anda dapat membiarkan Viz memanggil tool **SQL Execution**.

Karakteristik tool ini:

* Viz dapat langsung menghasilkan query `SELECT`;
* Sistem mengeksekusi dan mengembalikan hasil;
* Viz bertanggung jawab atas analisis dan visualisasi.

Contoh tugas:

> "Tolong analisis tren perubahan tingkat konversi leads di setiap region dalam 90 hari terakhir."

Dalam hal ini, Viz mungkin akan menghasilkan:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Risiko dan Saran Perlindungan

| Titik Risiko | Strategi Perlindungan |
| ------------ | --------------------- |
| Menghasilkan operasi tulis | Wajib dibatasi menjadi `SELECT` |
| Akses tabel yang tidak terkait | Validasi apakah nama tabel ada |
| Risiko performa tabel besar | Batasi rentang waktu, jumlah LIMIT |
| Operasi dapat dilacak | Aktifkan log query dan audit |
| Kontrol Permission Pengguna | Hanya administrator yang dapat menggunakan tool ini |

> Saran umum:
>
> * Pengguna umum hanya mengaktifkan analisis berbasis template (Overall Analytics);
> * Hanya administrator atau analis lanjutan yang dapat menggunakan SQL Execution.

---

## 5. Jika Anda Ingin Membuat Sendiri "Overall Analytics"

Berikut adalah pemikiran umum yang sederhana, Anda dapat menyalinnya ke sistem mana pun (tidak bergantung pada NocoBase):

### Langkah 1: Rancang Tabel Template

Nama tabel bebas (seperti `analysis_templates`).
Hanya perlu berisi Field: `name`, `sql`, `collection`, `description`.

### Langkah 2: Tulis Layanan atau Workflow "Ambil Template → Eksekusi"

Logika:

1. Menerima tugas atau konteks halaman (seperti collection saat ini);
2. Mencocokkan template;
3. Menjalankan template SQL (read-only);
4. Mengembalikan struktur data terstandar (rows + fields).

### Langkah 3: Biarkan AI Memanggil Antarmuka Ini

Prompt tugas dapat ditulis seperti ini:

```
Tolong panggil tool analisis template terlebih dahulu, jika tidak ada analisis yang cocok di template, baru gunakan SQL executor.
Pastikan semua query read-only, dan hasilkan grafik untuk menampilkan hasil.
```

> Dengan demikian, sistem Karyawan AI Anda memiliki kemampuan analisis yang mirip dengan CRM Demo, tetapi sepenuhnya independen, dapat dikustomisasi.

---

## 6. Praktik Terbaik dan Saran Desain

| Saran | Penjelasan |
| ----- | ---------- |
| **Prioritaskan Analisis Berbasis Template** | Aman, stabil, dapat digunakan kembali |
| **SQL Execution Hanya Sebagai Pelengkap** | Hanya untuk debugging internal atau query sementara |
| **Satu Grafik Satu Fokus** | Output jelas, hindari kompleksitas berlebihan |
| **Penamaan Template yang Jelas** | Sesuai halaman/domain bisnis, contohnya `Leads-Stage-Conversion` |
| **Penjelasan Ringkas dan Jelas** | Setiap grafik dilengkapi 2-3 kalimat ringkasan |
| **Jelaskan Jika Tidak Ada Template** | Beri tahu Pengguna "tidak ditemukan template terkait" daripada output kosong |

---

## 7. Dari CRM Demo ke Skenario Anda

Baik Anda membuat CRM rumah sakit, manufaktur, gudang logistik, atau penerimaan pendidikan,
selama Anda dapat menjawab tiga pertanyaan berikut, Viz dapat memberikan nilai dalam sistem Anda:

| Pertanyaan | Contoh |
| ---------- | ------ |
| **1. Apa yang ingin Anda analisis?** | Tren leads / Tahap deal / Tingkat utilisasi peralatan |
| **2. Di mana data?** | Tabel mana, Field apa saja |
| **3. Bagaimana ingin menampilkan?** | Line chart, funnel, pie chart, tabel perbandingan |

Setelah Anda mendefinisikan konten ini, hanya perlu:

* Menulis logika analisis ke tabel template;
* Mengaitkan prompt tugas pada halaman;
* Viz dapat "mengambil alih" analisis laporan Anda.

---

## 8. Penutup: Bawalah Paradigma

"Overall Analytics" dan "SQL Execution" hanyalah dua contoh implementasi.
Yang lebih penting adalah pemikiran di baliknya:

> **Biarkan Karyawan AI memahami logika bisnis Anda, bukan hanya menjalankan prompt.**

Apa pun yang Anda gunakan, NocoBase, sistem private, atau Workflow yang Anda tulis sendiri,
Anda dapat menyalin struktur ini:

* Template terpusat;
* Pemanggilan Workflow;
* Eksekusi read-only;
* Penampilan AI.

Dengan demikian, Viz tidak lagi hanya "AI yang dapat menghasilkan grafik",
tetapi seorang analis yang benar-benar memahami data Anda, memahami definisi Anda, dan memahami bisnis Anda.
