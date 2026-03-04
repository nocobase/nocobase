:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/solution/ticket-system/design).
:::

# Desain Detail Solusi Tiket

> **Versi**: v2.0-beta

> **Tanggal Pembaruan**: 2026-01-05

> **Status**: Pratinjau

## 1. Ringkasan Sistem dan Filosofi Desain

### 1.1 Penempatan Sistem

Sistem ini adalah sebuah **platform manajemen tiket cerdas berbasis AI** yang dibangun di atas platform low-code NocoBase. Tujuan utamanya adalah:

```
Biarkan layanan pelanggan lebih fokus pada penyelesaian masalah, bukan pada operasi alur kerja yang rumit
```

### 1.2 Filosofi Desain

#### Filosofi Satu: Arsitektur Data Berbentuk T (T-Shaped)

**Apa itu Arsitektur Berbentuk T?**

Mengambil inspirasi dari konsep "talenta berbentuk T" — keluasan horizontal + kedalaman vertikal:

- **Horizontal (Tabel Utama)**: Mencakup kemampuan umum untuk semua tipe bisnis — nomor tiket, status, petugas, SLA, dan bidang inti lainnya.
- **Vertikal (Tabel Ekstensi)**: Bidang khusus yang mendalami bisnis tertentu — perbaikan peralatan memiliki nomor seri, keluhan memiliki rencana kompensasi.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Mengapa didesain seperti ini?**

| Solusi Tradisional | Arsitektur Berbentuk T |
|--------------------|------------------------|
| Satu tabel untuk setiap tipe bisnis, bidang berulang | Bidang umum dikelola secara terpadu, bidang bisnis diperluas sesuai kebutuhan |
| Laporan statistik perlu menggabungkan banyak tabel | Satu tabel utama langsung menghitung statistik semua tiket |
| Perubahan alur kerja harus mengubah banyak tempat | Alur kerja inti hanya diubah di satu tempat |
| Tipe bisnis baru memerlukan tabel baru | Hanya perlu menambah tabel ekstensi, alur utama tetap sama |

#### Filosofi Dua: Tim Karyawan AI

Bukan sekadar "fitur AI", melainkan "karyawan AI". Setiap AI memiliki peran, kepribadian, dan tanggung jawab yang jelas:

| Karyawan AI | Jabatan | Tanggung Jawab Inti | Skenario Pemicu |
|-------------|---------|---------------------|-----------------|
| **Sam** | Supervisor Service Desk | Distribusi tiket, penilaian prioritas, keputusan eskalasi | Otomatis saat tiket dibuat |
| **Grace** | Pakar Kesuksesan Pelanggan | Pembuatan balasan, penyesuaian nada bicara, penanganan keluhan | Saat staf mengklik "Balasan AI" |
| **Max** | Asisten Pengetahuan | Kasus serupa, rekomendasi pengetahuan, sintesis solusi | Otomatis di halaman detail tiket |
| **Lexi** | Penerjemah | Terjemahan multi-bahasa, terjemahan komentar | Otomatis saat terdeteksi bahasa asing |

**Mengapa menggunakan mode "Karyawan AI"?**

- **Tanggung Jawab Jelas**: Sam mengelola distribusi, Grace mengelola balasan, tidak akan tertukar.
- **Mudah Dimengerti**: Mengatakan "Biarkan Sam menganalisisnya" lebih ramah bagi pengguna daripada "Memanggil API klasifikasi".
- **Dapat Diperluas**: Menambah kemampuan AI baru = merekrut karyawan baru.

#### Filosofi Tiga: Siklus Mandiri Pengetahuan

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

Ini membentuk lingkaran tertutup **Akumulasi Pengetahuan - Aplikasi Pengetahuan**.

---

## 2. Entitas Inti dan Model Data

### 2.1 Ikhtisar Hubungan Entitas

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 Detail Tabel Inti

#### 2.2.1 Tabel Utama Tiket (nb_tts_tickets)

Ini adalah inti dari sistem, menggunakan desain "tabel lebar" (wide table) yang memasukkan semua bidang yang sering digunakan ke dalam tabel utama.

**Informasi Dasar**

| Bidang | Tipe | Penjelasan | Contoh |
|--------|------|------------|--------|
| id | BIGINT | Primary key | 1001 |
| ticket_no | VARCHAR | Nomor tiket | TKT-20251229-0001 |
| title | VARCHAR | Judul | Koneksi internet lambat |
| description | TEXT | Deskripsi masalah | Sejak pagi ini jaringan kantor... |
| biz_type | VARCHAR | Tipe bisnis | it_support |
| priority | VARCHAR | Prioritas | P1 |
| status | VARCHAR | Status | processing |

**Pelacakan Sumber**

| Bidang | Tipe | Penjelasan | Contoh |
|--------|------|------------|--------|
| source_system | VARCHAR | Sistem sumber | crm / email / iot |
| source_channel | VARCHAR | Saluran sumber | web / phone / wechat |
| external_ref_id | VARCHAR | ID referensi eksternal | CRM-2024-0001 |

**Informasi Kontak**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| customer_id | BIGINT | ID Pelanggan |
| contact_name | VARCHAR | Nama kontak |
| contact_phone | VARCHAR | Telepon kontak |
| contact_email | VARCHAR | Email kontak |
| contact_company | VARCHAR | Nama perusahaan |

**Informasi Petugas**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| assignee_id | BIGINT | ID Petugas |
| assignee_department_id | BIGINT | ID Departemen petugas |
| transfer_count | INT | Jumlah pengalihan |

**Node Waktu**

| Bidang | Tipe | Penjelasan | Waktu Pemicu |
|--------|------|------------|--------------|
| submitted_at | TIMESTAMP | Waktu pengajuan | Saat tiket dibuat |
| assigned_at | TIMESTAMP | Waktu penugasan | Saat petugas ditentukan |
| first_response_at | TIMESTAMP | Waktu respons pertama | Saat pertama kali membalas pelanggan |
| resolved_at | TIMESTAMP | Waktu penyelesaian | Saat status berubah menjadi resolved |
| closed_at | TIMESTAMP | Waktu penutupan | Saat status berubah menjadi closed |

**Terkait SLA**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| sla_config_id | BIGINT | ID Konfigurasi SLA |
| sla_response_due | TIMESTAMP | Batas waktu respons |
| sla_resolve_due | TIMESTAMP | Batas waktu penyelesaian |
| sla_paused_at | TIMESTAMP | Waktu mulai jeda SLA |
| sla_paused_duration | INT | Akumulasi durasi jeda (menit) |
| is_sla_response_breached | BOOLEAN | Apakah respons melanggar SLA |
| is_sla_resolve_breached | BOOLEAN | Apakah penyelesaian melanggar SLA |

**Hasil Analisis AI**

| Bidang | Tipe | Penjelasan | Diisi Oleh |
|--------|------|------------|------------|
| ai_category_code | VARCHAR | Klasifikasi identifikasi AI | Sam |
| ai_sentiment | VARCHAR | Analisis sentimen | Sam |
| ai_urgency | VARCHAR | Tingkat urgensi | Sam |
| ai_keywords | JSONB | Kata kunci | Sam |
| ai_reasoning | TEXT | Proses penalaran | Sam |
| ai_suggested_reply | TEXT | Saran balasan | Sam/Grace |
| ai_confidence_score | NUMERIC | Skor kepercayaan | Sam |
| ai_analysis | JSONB | Hasil analisis lengkap | Sam |

**Dukungan Multi-bahasa**

| Bidang | Tipe | Penjelasan | Diisi Oleh |
|--------|------|------------|------------|
| source_language_code | VARCHAR | Bahasa asli | Sam/Lexi |
| target_language_code | VARCHAR | Bahasa target | Default sistem EN |
| is_translated | BOOLEAN | Apakah sudah diterjemahkan | Lexi |
| description_translated | TEXT | Deskripsi terjemahan | Lexi |

#### 2.2.2 Tabel Ekstensi Bisnis

**Perbaikan Peralatan (nb_tts_biz_repair)**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| ticket_id | BIGINT | ID Tiket terkait |
| equipment_model | VARCHAR | Model peralatan |
| serial_number | VARCHAR | Nomor seri |
| fault_code | VARCHAR | Kode kerusakan |
| spare_parts | JSONB | Daftar suku cadang |
| maintenance_type | VARCHAR | Tipe pemeliharaan |

**Dukungan TI (nb_tts_biz_it_support)**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| ticket_id | BIGINT | ID Tiket terkait |
| asset_number | VARCHAR | Nomor aset |
| os_version | VARCHAR | Versi sistem operasi |
| software_name | VARCHAR | Perangkat lunak terkait |
| remote_address | VARCHAR | Alamat jarak jauh |
| error_code | VARCHAR | Kode kesalahan |

**Keluhan Pelanggan (nb_tts_biz_complaint)**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| ticket_id | BIGINT | ID Tiket terkait |
| related_order_no | VARCHAR | Nomor pesanan terkait |
| complaint_level | VARCHAR | Tingkat keluhan |
| compensation_amount | DECIMAL | Jumlah kompensasi |
| compensation_type | VARCHAR | Metode kompensasi |
| root_cause | TEXT | Akar masalah |

#### 2.2.3 Tabel Komentar (nb_tts_ticket_comments)

**Bidang Inti**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| id | BIGINT | Primary key |
| ticket_id | BIGINT | ID Tiket |
| parent_id | BIGINT | ID Komentar induk (mendukung struktur pohon) |
| content | TEXT | Isi komentar |
| direction | VARCHAR | Arah: inbound (pelanggan)/outbound (staf) |
| is_internal | BOOLEAN | Apakah catatan internal |
| is_first_response | BOOLEAN | Apakah respons pertama |

**Bidang Audit AI (untuk outbound)**

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| source_language_code | VARCHAR | Bahasa sumber |
| content_translated | TEXT | Isi terjemahan |
| is_translated | BOOLEAN | Apakah diterjemahkan |
| is_ai_blocked | BOOLEAN | Apakah diblokir oleh AI |
| ai_block_reason | VARCHAR | Alasan pemblokiran |
| ai_block_detail | TEXT | Penjelasan detail |
| ai_quality_score | NUMERIC | Skor kualitas |
| ai_suggestions | TEXT | Saran perbaikan |

#### 2.2.4 Tabel Penilaian (nb_tts_ratings)

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| ticket_id | BIGINT | ID Tiket (unik) |
| overall_rating | INT | Kepuasan keseluruhan (1-5) |
| response_rating | INT | Kecepatan respons (1-5) |
| professionalism_rating | INT | Tingkat profesionalisme (1-5) |
| resolution_rating | INT | Penyelesaian masalah (1-5) |
| nps_score | INT | Skor NPS (0-10) |
| tags | JSONB | Tag cepat |
| comment | TEXT | Evaluasi teks |

#### 2.2.5 Tabel Artikel Pengetahuan (nb_tts_qa_articles)

| Bidang | Tipe | Penjelasan |
|--------|------|------------|
| article_no | VARCHAR | Nomor artikel KB-T0001 |
| title | VARCHAR | Judul |
| content | TEXT | Konten (Markdown) |
| summary | TEXT | Ringkasan |
| category_code | VARCHAR | Kode kategori |
| keywords | JSONB | Kata kunci |
| source_type | VARCHAR | Sumber: ticket/faq/manual |
| source_ticket_id | BIGINT | ID Tiket sumber |
| ai_generated | BOOLEAN | Apakah dibuat oleh AI |
| ai_quality_score | NUMERIC | Skor kualitas |
| status | VARCHAR | Status: draft/published/archived |
| view_count | INT | Jumlah tayangan |
| helpful_count | INT | Jumlah terbantu |

### 2.3 Daftar Tabel Data

| No | Nama Tabel | Penjelasan | Tipe Rekaman |
|----|------------|------------|--------------|
| 1 | nb_tts_tickets | Tabel utama tiket | Data bisnis |
| 2 | nb_tts_biz_repair | Ekstensi perbaikan peralatan | Data bisnis |
| 3 | nb_tts_biz_it_support | Ekstensi dukungan TI | Data bisnis |
| 4 | nb_tts_biz_complaint | Ekstensi keluhan pelanggan | Data bisnis |
| 5 | nb_tts_customers | Tabel utama pelanggan | Data bisnis |
| 6 | nb_tts_customer_contacts | Kontak pelanggan | Data bisnis |
| 7 | nb_tts_ticket_comments | Komentar tiket | Data bisnis |
| 8 | nb_tts_ratings | Penilaian kepuasan | Data bisnis |
| 9 | nb_tts_qa_articles | Artikel pengetahuan | Data pengetahuan |
| 10 | nb_tts_qa_article_relations | Relasi artikel | Data pengetahuan |
| 11 | nb_tts_faqs | Pertanyaan umum (FAQ) | Data pengetahuan |
| 12 | nb_tts_tickets_categories | Kategori tiket | Data konfigurasi |
| 13 | nb_tts_sla_configs | Konfigurasi SLA | Data konfigurasi |
| 14 | nb_tts_skill_configs | Konfigurasi keahlian | Data konfigurasi |
| 15 | nb_tts_business_types | Tipe bisnis | Data konfigurasi |

---

## 3. Siklus Hidup Tiket

### 3.1 Definisi Status

| Status | Nama | Penjelasan | Penghitungan SLA | Warna |
|--------|------|------------|------------------|-------|
| new | Baru | Baru dibuat, menunggu penugasan | Mulai | 🔵 Biru |
| assigned | Ditugaskan | Petugas telah ditentukan, menunggu diterima | Lanjut | 🔷 Sian |
| processing | Diproses | Sedang ditangani | Lanjut | 🟠 Oranye |
| pending | Ditunda | Menunggu umpan balik pelanggan | **Jeda** | ⚫ Abu-abu |
| transferred | Dialihkan | Dialihkan ke orang lain | Lanjut | 🟣 Ungu |
| resolved | Diselesaikan | Menunggu konfirmasi pelanggan | Berhenti | 🟢 Hijau |
| closed | Ditutup | Tiket berakhir | Berhenti | ⚫ Abu-abu |
| cancelled | Dibatalkan | Tiket dibatalkan | Berhenti | ⚫ Abu-abu |

### 3.2 Diagram Alur Status

**Alur Utama (Dari Kiri ke Kanan)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Alur Cabang**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**State Machine Lengkap**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Aturan Transisi Status Utama

| Dari | Ke | Kondisi Pemicu | Tindakan Sistem |
|------|----|----------------|-----------------|
| new | assigned | Menentukan petugas | Mencatat assigned_at |
| assigned | processing | Petugas mengklik "Terima" | Tidak ada |
| processing | pending | Mengklik "Tunda" | Mencatat sla_paused_at |
| pending | processing | Balasan pelanggan / Pemulihan manual | Menghitung durasi jeda, mengosongkan paused_at |
| processing | resolved | Mengklik "Selesaikan" | Mencatat resolved_at |
| resolved | closed | Konfirmasi pelanggan / Batas waktu 3 hari | Mencatat closed_at |
| * | cancelled | Membatalkan tiket | Tidak ada |


---

## 4. Manajemen Tingkat Layanan SLA

### 4.1 Konfigurasi Prioritas dan SLA

| Prioritas | Nama | Waktu Respons | Waktu Penyelesaian | Ambang Peringatan | Skenario Tipikal |
|-----------|------|---------------|--------------------|-------------------|------------------|
| P0 | Darurat | 15 menit | 2 jam | 80% | Sistem mati, lini produksi berhenti |
| P1 | Tinggi | 1 jam | 8 jam | 80% | Kerusakan fungsi penting |
| P2 | Sedang | 4 jam | 24 jam | 80% | Masalah umum |
| P3 | Rendah | 8 jam | 72 jam | 80% | Konsultasi, saran |

### 4.2 Logika Perhitungan SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### Saat Membuat Tiket

```
Batas waktu respons = Waktu pengajuan + Batas waktu respons (menit)
Batas waktu penyelesaian = Waktu pengajuan + Batas waktu penyelesaian (menit)
```

#### Saat Ditunda (pending)

```
Waktu mulai jeda SLA = Waktu sekarang
```

#### Saat Pulih (Kembali dari pending ke processing)

```
-- Hitung durasi jeda kali ini
Durasi jeda kali ini = Waktu sekarang - Waktu mulai jeda SLA

-- Akumulasikan ke total durasi jeda
Akumulasi durasi jeda = Akumulasi durasi jeda + Durasi jeda kali ini

-- Perpanjang batas waktu (masa jeda tidak dihitung dalam SLA)
Batas waktu respons = Batas waktu respons + Durasi jeda kali ini
Batas waktu penyelesaian = Batas waktu penyelesaian + Durasi jeda kali ini

-- Kosongkan waktu mulai jeda
Waktu mulai jeda SLA = Kosong
```

#### Penentuan Pelanggaran SLA

```
-- Penentuan pelanggaran respons
Apakah respons melanggar = (Waktu respons pertama kosong DAN Waktu sekarang > Batas waktu respons)
                         ATAU (Waktu respons pertama > Batas waktu respons)

-- Penentuan pelanggaran penyelesaian
Apakah penyelesaian melanggar = (Waktu penyelesaian kosong DAN Waktu sekarang > Batas waktu penyelesaian)
                             ATAU (Waktu penyelesaian > Batas waktu penyelesaian)
```

### 4.3 Mekanisme Peringatan SLA

| Tingkat Peringatan | Kondisi | Objek Notifikasi | Metode Notifikasi |
|--------------------|---------|------------------|-------------------|
| Peringatan Kuning | Sisa waktu < 20% | Petugas | Pesan dalam sistem |
| Peringatan Merah | Sudah lewat waktu | Petugas + Supervisor | Pesan dalam sistem + Email |
| Peringatan Eskalasi | Lewat waktu 1 jam | Manajer Departemen | Email + SMS |

### 4.4 Metrik Dasbor SLA

| Metrik | Rumus Perhitungan | Ambang Kesehatan |
|--------|-------------------|------------------|
| Tingkat Kepatuhan Respons | Jumlah tiket tidak melanggar / Total tiket | > 95% |
| Tingkat Kepatuhan Penyelesaian | Jumlah penyelesaian tidak melanggar / Total tiket selesai | > 90% |
| Rata-rata Waktu Respons | SUM(Waktu respons) / Jumlah tiket | < 50% dari SLA |
| Rata-rata Waktu Penyelesaian | SUM(Waktu penyelesaian) / Jumlah tiket | < 80% dari SLA |

---

## 5. Kemampuan AI dan Sistem Karyawan

### 5.1 Tim Karyawan AI

Sistem mengonfigurasi 8 karyawan AI, yang dibagi menjadi dua kategori:

**Karyawan Baru (Khusus Sistem Tiket)**

| ID | Nama | Jabatan | Kemampuan Inti |
|----|------|---------|----------------|
| sam | Sam | Supervisor Service Desk | Distribusi tiket, penilaian prioritas, keputusan eskalasi, identifikasi risiko SLA |
| grace | Grace | Pakar Kesuksesan Pelanggan | Pembuatan balasan profesional, penyesuaian nada, penanganan keluhan, pemulihan kepuasan |
| max | Max | Asisten Pengetahuan | Pencarian kasus serupa, rekomendasi pengetahuan, sintesis solusi |

**Karyawan Reused (Kemampuan Umum)**

| ID | Nama | Jabatan | Kemampuan Inti |
|----|------|---------|----------------|
| dex | Dex | Pengatur Data | Ekstraksi tiket dari email, konversi telepon ke tiket, pembersihan data massal |
| ellis | Ellis | Pakar Email | Analisis sentimen email, ringkasan utas, draf balasan |
| lexi | Lexi | Penerjemah | Terjemahan tiket, terjemahan balasan, terjemahan percakapan waktu nyata |
| cole | Cole | Pakar NocoBase | Panduan penggunaan sistem, bantuan konfigurasi alur kerja |
| vera | Vera | Analis Riset | Riset solusi teknis, verifikasi informasi produk |

### 5.2 Daftar Tugas AI

Setiap karyawan AI dikonfigurasi dengan 4 tugas spesifik:

#### Tugas Sam

| ID Tugas | Nama | Metode Pemicu | Penjelasan |
|----------|------|---------------|------------|
| SAM-01 | Analisis & Distribusi Tiket | Alur kerja otomatis | Otomatis saat tiket baru dibuat |
| SAM-02 | Penilaian Ulang Prioritas | Interaksi frontend | Menyesuaikan prioritas berdasarkan informasi baru |
| SAM-03 | Keputusan Eskalasi | Frontend/Alur kerja | Menentukan apakah eskalasi diperlukan |
| SAM-04 | Penilaian Risiko SLA | Alur kerja otomatis | Mengidentifikasi risiko keterlambatan |

#### Tugas Grace

| ID Tugas | Nama | Metode Pemicu | Penjelasan |
|----------|------|---------------|------------|
| GRACE-01 | Pembuatan Balasan Profesional | Interaksi frontend | Membuat balasan berdasarkan konteks |
| GRACE-02 | Penyesuaian Nada Balasan | Interaksi frontend | Mengoptimalkan nada balasan yang ada |
| GRACE-03 | Penanganan Penurunan Keluhan | Frontend/Alur kerja | Meredakan keluhan pelanggan |
| GRACE-04 | Pemulihan Kepuasan | Frontend/Alur kerja | Tindak lanjut setelah pengalaman negatif |

#### Tugas Max

| ID Tugas | Nama | Metode Pemicu | Penjelasan |
|----------|------|---------------|------------|
| MAX-01 | Pencarian Kasus Serupa | Frontend/Alur kerja | Mencari tiket serupa di masa lalu |
| MAX-02 | Rekomendasi Artikel Pengetahuan | Frontend/Alur kerja | Merekomendasikan artikel pengetahuan terkait |
| MAX-03 | Sintesis Solusi | Interaksi frontend | Menyintesis solusi dari berbagai sumber |
| MAX-04 | Panduan Pemecahan Masalah | Interaksi frontend | Membuat alur pemeriksaan sistematis |

#### Tugas Lexi

| ID Tugas | Nama | Metode Pemicu | Penjelasan |
|----------|------|---------------|------------|
| LEXI-01 | Terjemahan Tiket | Alur kerja otomatis | Menerjemahkan isi tiket |
| LEXI-02 | Terjemahan Balasan | Interaksi frontend | Menerjemahkan balasan staf |
| LEXI-03 | Terjemahan Massal | Alur kerja otomatis | Pemrosesan terjemahan massal |
| LEXI-04 | Terjemahan Percakapan Waktu Nyata | Interaksi frontend | Menerjemahkan percakapan secara langsung |

### 5.3 Karyawan AI dan Siklus Hidup Tiket

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 Contoh Respons AI

#### SAM-01 Respons Analisis Tiket

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "gagal login", "timeout", "penutupan akhir bulan"],
  "confidence": 0.92,
  "reasoning": "Tiket ini mendeskripsikan masalah login sistem ERP yang memengaruhi penutupan akhir bulan departemen keuangan, tingkat urgensi tinggi",
  "suggested_reply": "Pelanggan yang terhormat, terima kasih telah melaporkan masalah ini...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Halo, sistem ERP kami tidak bisa login..."
}
```

#### GRACE-01 Respons Pembuatan Balasan

```
Yth. Bapak Zhang,

Terima kasih telah menghubungi kami mengenai masalah login ERP. Saya sangat memahami bahwa 
masalah ini memengaruhi pekerjaan penutupan akhir bulan di perusahaan Anda, 
dan kami telah menetapkan masalah ini sebagai prioritas tinggi.

Status saat ini:
- Tim teknis sedang memeriksa masalah koneksi server
- Diperkirakan akan memberikan pembaruan dalam 30 menit

Sementara itu, Anda dapat mencoba:
1. Mengakses melalui alamat cadangan: https://erp-backup.company.com
2. Jika ada kebutuhan laporan mendesak, hubungi kami untuk bantuan ekspor

Jika ada pertanyaan lain, jangan ragu untuk menghubungi saya.

Hormat kami,
Tim Dukungan Teknis
```

### 5.5 Firewall EQ AI

Audit kualitas balasan yang dikelola oleh Grace akan memblokir masalah berikut:

| Tipe Masalah | Contoh Teks Asli | Saran AI |
|--------------|------------------|----------|
| Nada Negatif | "Tidak bisa, ini tidak masuk garansi" | "Kerusakan ini saat ini tidak tercakup dalam garansi gratis, kami dapat menawarkan solusi perbaikan berbayar" |
| Menyalahkan Pelanggan | "Anda sendiri yang merusaknya" | "Setelah diverifikasi, kerusakan ini termasuk kerusakan yang tidak disengaja" |
| Lepas Tanggung Jawab | "Bukan masalah kami" | "Izinkan saya membantu Anda memeriksa lebih lanjut penyebab masalahnya" |
| Ekspresi Dingin | "Tidak tahu" | "Saya akan membantu Anda mencari informasi terkait" |
| Informasi Sensitif | "Kata sandi Anda adalah abc123" | [Diblokir] Mengandung informasi sensitif, tidak diizinkan untuk dikirim |

---

## 6. Sistem Basis Pengetahuan

### 6.1 Sumber Pengetahuan

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 Alur Konversi Tiket ke Pengetahuan

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Dimensi Evaluasi**:
- **Generalitas**: Apakah ini masalah umum?
- **Kelengkapan**: Apakah solusinya jelas dan lengkap?
- **Dapat Diulang**: Apakah langkah-langkahnya dapat digunakan kembali?

### 6.3 Mekanisme Rekomendasi Pengetahuan

Saat staf membuka detail tiket, Max secara otomatis merekomendasikan pengetahuan terkait:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Rekomendasi Pengetahuan                     [Buka/Tutup] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Panduan Diagnosis Kerusakan Sistem Servo CNC    │ │
│ │ Kecocokan: 94%                                         │ │
│ │ Berisi: Interpretasi kode alarm, langkah pemeriksaan    │ │
│ │ [Lihat] [Terapkan ke Balasan] [Tandai Terbantu]         │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Manual Pemeliharaan Seri XYZ-CNC3000          │ │
│ │ Kecocokan: 87%                                         │ │
│ │ Berisi: Kerusakan umum, rencana pemeliharaan preventif  │ │
│ │ [Lihat] [Terapkan ke Balasan] [Tandai Terbantu]         │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Mesin Alur Kerja

### 7.1 Kategori Alur Kerja

| Nomor | Kategori | Penjelasan | Metode Pemicu |
|-------|----------|------------|---------------|
| WF-T | Alur Tiket | Manajemen siklus hidup tiket | Peristiwa formulir |
| WF-S | Alur SLA | Perhitungan dan peringatan SLA | Peristiwa formulir/Terjadwal |
| WF-C | Alur Komentar | Pemrosesan dan terjemahan komentar | Peristiwa formulir |
| WF-R | Alur Penilaian | Undangan dan statistik penilaian | Peristiwa formulir/Terjadwal |
| WF-N | Alur Notifikasi | Pengiriman notifikasi | Berbasis peristiwa |
| WF-AI | Alur AI | Analisis dan pembuatan AI | Peristiwa formulir |

### 7.2 Alur Kerja Utama

#### WF-T01: Alur Pembuatan Tiket

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: Analisis AI Tiket

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: Terjemahan dan Audit Komentar

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: Pembuatan Pengetahuan

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Tugas Terjadwal

| Tugas | Frekuensi Eksekusi | Penjelasan |
|-------|--------------------|------------|
| Pemeriksaan Peringatan SLA | Setiap 5 menit | Memeriksa tiket yang akan segera terlambat |
| Penutupan Tiket Otomatis | Setiap hari | Menutup otomatis tiket berstatus resolved setelah 3 hari |
| Pengiriman Undangan Penilaian | Setiap hari | Mengirim undangan penilaian 24 jam setelah tiket ditutup |
| Pembaruan Data Statistik | Setiap jam | Memperbarui statistik tiket pelanggan |

---

## 8. Desain Menu dan Antarmuka

### 8.1 Admin Backend

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Portal Pelanggan

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Desain Dasbor

#### Tampilan Eksekutif

| Komponen | Tipe | Penjelasan Data |
|----------|------|-----------------|
| Tingkat Kepatuhan SLA | Dasbor | Tingkat kepatuhan respons/penyelesaian bulan ini |
| Tren Kepuasan | Grafik Garis | Perubahan kepuasan dalam 30 hari terakhir |
| Tren Volume Tiket | Grafik Batang | Volume tiket dalam 30 hari terakhir |
| Distribusi Tipe Bisnis | Grafik Lingkaran | Proporsi setiap tipe bisnis |

#### Tampilan Supervisor

| Komponen | Tipe | Penjelasan Data |
|----------|------|-----------------|
| Peringatan Terlambat | Daftar | Tiket yang akan/sudah terlambat |
| Beban Kerja Personel | Grafik Batang | Jumlah tiket anggota tim |
| Distribusi Tunggakan | Grafik Tumpuk | Jumlah tiket di setiap status |
| Efisiensi Pemrosesan | Heatmap | Distribusi rata-rata waktu pemrosesan |

#### Tampilan Staf Layanan

| Komponen | Tipe | Penjelasan Data |
|----------|------|-----------------|
| Tugas Saya | Kartu Angka | Jumlah tiket yang perlu diproses |
| Distribusi Prioritas | Grafik Lingkaran | Distribusi P0/P1/P2/P3 |
| Statistik Hari Ini | Kartu Metrik | Jumlah tiket yang diproses/diselesaikan hari ini |
| Hitung Mundur SLA | Daftar | 5 tiket paling mendesak |

---

## Lampiran

### A. Konfigurasi Tipe Bisnis

| Kode Tipe | Nama | Ikon | Tabel Ekstensi Terkait |
|-----------|------|------|------------------------|
| repair | Perbaikan Peralatan | 🔧 | nb_tts_biz_repair |
| it_support | Dukungan TI | 💻 | nb_tts_biz_it_support |
| complaint | Keluhan Pelanggan | 📢 | nb_tts_biz_complaint |
| consultation | Konsultasi/Saran | ❓ | Tidak ada |
| other | Lainnya | 📝 | Tidak ada |

### B. Kode Kategori

| Kode | Nama | Penjelasan |
|------|------|------------|
| CONVEYOR | Sistem Konveyor | Masalah sistem konveyor |
| PACKAGING | Mesin Pengemas | Masalah mesin pengemas |
| WELDING | Peralatan Las | Masalah peralatan las |
| COMPRESSOR | Kompresor Udara | Masalah kompresor udara |
| COLD_STORE | Gudang Dingin | Masalah gudang dingin |
| CENTRAL_AC | AC Sentral | Masalah AC sentral |
| FORKLIFT | Forklift | Masalah forklift |
| COMPUTER | Komputer | Masalah perangkat keras komputer |
| PRINTER | Printer | Masalah printer |
| PROJECTOR | Proyektor | Masalah proyektor |
| INTERNET | Jaringan | Masalah koneksi jaringan |
| EMAIL | Email | Masalah sistem email |
| ACCESS | Izin Akses | Masalah izin akun |
| PROD_INQ | Konsultasi Produk | Konsultasi produk |
| COMPLAINT | Keluhan Umum | Keluhan umum |
| DELAY | Keterlambatan Logistik | Keluhan keterlambatan logistik |
| DAMAGE | Kerusakan Kemasan | Keluhan kerusakan kemasan |
| QUANTITY | Kekurangan Jumlah | Keluhan kekurangan jumlah |
| SVC_ATTITUDE | Sikap Layanan | Keluhan sikap layanan |
| PROD_QUALITY | Kualitas Produk | Keluhan kualitas produk |
| TRAINING | Pelatihan | Permintaan pelatihan |
| RETURN | Pengembalian Barang | Permintaan pengembalian barang |

---

*Versi Dokumen: 2.0 | Pembaruan Terakhir: 2026-01-05*