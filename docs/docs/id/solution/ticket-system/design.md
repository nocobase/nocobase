---
title: "Desain Detail Solusi Ticket"
description: "Desain Detail Solusi Ticket v2.0: Arsitektur Data Tipe T (tabel utama + tabel tambahan bisnis), tim AI Employee (Sam/Grace/Max/Lexi), self-loop pengetahuan, struktur tabel inti, Workflow."
keywords: "Desain Ticket,Arsitektur Tipe T,AI Ticket,Tabel Utama Ticket,Knowledge Base,SLA,NocoBase"
---

# Desain Detail Solusi Ticket

> **Versi**: v2.0-beta

> **Tanggal Pembaruan**: 2026-01-05

> **Status**: Versi Pratinjau

## 1. Ikhtisar Sistem dan Filosofi Desain

### 1.1 Posisi Sistem

Sistem ini adalah **platform manajemen Ticket cerdas yang didukung AI**, dibangun berdasarkan platform low-code NocoBase. Tujuan utamanya adalah:

```
Membiarkan customer service lebih fokus menyelesaikan masalah, bukan operasi alur yang rumit
```

### 1.2 Filosofi Desain

#### Filosofi Satu: Arsitektur Data Tipe T

**Apa itu arsitektur Tipe T?**

Mengambil ide dari konsep "talent Tipe T" — luas horizontal + dalam vertikal:

- **Horizontal (Tabel Utama)**: Mencakup kemampuan umum semua tipe bisnis — field inti seperti nomor, status, penanggung jawab, SLA, dll.
- **Vertikal (Tabel Ekstensi)**: Mendalam ke field profesional bisnis tertentu — perbaikan peralatan memiliki nomor seri, keluhan memiliki skema kompensasi

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**Mengapa dirancang seperti ini?**

| Solusi Tradisional | Arsitektur Tipe T |
|----------|---------|
| Setiap bisnis satu tabel, field berulang | Field umum dikelola terpadu, field bisnis diperluas sesuai kebutuhan |
| Laporan statistik perlu menggabungkan beberapa tabel | Satu tabel utama langsung statistik semua Ticket |
| Perubahan alur perlu mengubah beberapa tempat | Alur inti hanya perlu mengubah satu tempat |
| Menambah tipe bisnis baru perlu membangun tabel baru | Hanya perlu menambahkan tabel ekstensi, alur utama tidak berubah |

#### Filosofi Dua: Tim AI Employee

Bukan "fungsi AI", melainkan "AI Employee". Setiap AI memiliki Role, kepribadian, tanggung jawab yang jelas:

| AI Employee | Posisi | Tanggung Jawab Inti | Skenario Trigger |
|--------|------|----------|----------|
| **Sam** | Service Desk Lead | Distribusi Ticket, evaluasi prioritas, keputusan eskalasi | Otomatis saat Ticket dibuat |
| **Grace** | Customer Success Specialist | Generate balasan, penyesuaian nada, penanganan keluhan | Customer service klik "AI Reply" |
| **Max** | Asisten Pengetahuan | Kasus serupa, rekomendasi pengetahuan, sintesis solusi | Otomatis di halaman detail Ticket |
| **Lexi** | Penerjemah | Terjemahan multi-bahasa, terjemahan komentar | Otomatis saat mendeteksi bahasa asing |

**Mengapa menggunakan model "AI Employee"?**

- **Tanggung jawab jelas**: Sam mengelola distribusi, Grace mengelola balasan, tidak akan kacau
- **Mudah dipahami**: Mengatakan "biarkan Sam menganalisis" kepada pengguna lebih ramah daripada "panggil API klasifikasi"
- **Dapat diperluas**: Menambah kemampuan AI baru = merekrut karyawan baru

#### Filosofi Tiga: Self-loop Pengetahuan

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

Ini membentuk closed-loop **akumulasi pengetahuan-aplikasi pengetahuan**.

---

## 2. Entitas Inti dan Model Data

### 2.1 Ikhtisar Hubungan Entitas

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 Detail Tabel Inti

#### 2.2.1 Tabel Utama Ticket (nb_tts_tickets)

Ini adalah inti sistem, menggunakan desain "wide table", semua field umum dimasukkan ke tabel utama.

**Informasi Dasar**

| Field | Tipe | Deskripsi | Contoh |
|------|------|------|------|
| id | BIGINT | Primary key | 1001 |
| ticket_no | VARCHAR | Nomor Ticket | TKT-20251229-0001 |
| title | VARCHAR | Judul | Koneksi Jaringan Lambat |
| description | TEXT | Deskripsi Masalah | Pagi ini jaringan kantor mulai... |
| biz_type | VARCHAR | Tipe Bisnis | it_support |
| priority | VARCHAR | Prioritas | P1 |
| status | VARCHAR | Status | processing |

**Pelacakan Sumber**

| Field | Tipe | Deskripsi | Contoh |
|------|------|------|------|
| source_system | VARCHAR | Sistem Sumber | crm / email / iot |
| source_channel | VARCHAR | Channel Sumber | web / phone / wechat |
| external_ref_id | VARCHAR | ID Referensi Eksternal | CRM-2024-0001 |

**Informasi Kontak**

| Field | Tipe | Deskripsi |
|------|------|------|
| customer_id | BIGINT | ID Pelanggan |
| contact_name | VARCHAR | Nama Kontak |
| contact_phone | VARCHAR | Telepon Kontak |
| contact_email | VARCHAR | Email Kontak |
| contact_company | VARCHAR | Nama Perusahaan |

**Informasi Penanggung Jawab**

| Field | Tipe | Deskripsi |
|------|------|------|
| assignee_id | BIGINT | ID Penanggung Jawab |
| assignee_department_id | BIGINT | ID Departemen Penanggung Jawab |
| transfer_count | INT | Jumlah Transfer |

**Node Waktu**

| Field | Tipe | Deskripsi | Waktu Trigger |
|------|------|------|----------|
| submitted_at | TIMESTAMP | Waktu Submit | Saat Ticket dibuat |
| assigned_at | TIMESTAMP | Waktu Penugasan | Saat menentukan penanggung jawab |
| first_response_at | TIMESTAMP | Waktu Respons Pertama | Saat pertama kali membalas Pelanggan |
| resolved_at | TIMESTAMP | Waktu Penyelesaian | Saat status berubah ke resolved |
| closed_at | TIMESTAMP | Waktu Penutupan | Saat status berubah ke closed |

**Terkait SLA**

| Field | Tipe | Deskripsi |
|------|------|------|
| sla_config_id | BIGINT | ID Konfigurasi SLA |
| sla_response_due | TIMESTAMP | Batas waktu respons |
| sla_resolve_due | TIMESTAMP | Batas waktu penyelesaian |
| sla_paused_at | TIMESTAMP | Waktu mulai jeda SLA |
| sla_paused_duration | INT | Total durasi jeda (menit) |
| is_sla_response_breached | BOOLEAN | Apakah respons melanggar |
| is_sla_resolve_breached | BOOLEAN | Apakah penyelesaian melanggar |

**Hasil Analisis AI**

| Field | Tipe | Deskripsi | Diisi Oleh |
|------|------|------|----------|
| ai_category_code | VARCHAR | Klasifikasi yang diidentifikasi AI | Sam |
| ai_sentiment | VARCHAR | Analisis sentimen | Sam |
| ai_urgency | VARCHAR | Urgensi | Sam |
| ai_keywords | JSONB | Kata kunci | Sam |
| ai_reasoning | TEXT | Proses penalaran | Sam |
| ai_suggested_reply | TEXT | Saran balasan | Sam/Grace |
| ai_confidence_score | NUMERIC | Tingkat kepercayaan | Sam |
| ai_analysis | JSONB | Hasil analisis lengkap | Sam |

**Dukungan Multi-bahasa**

| Field | Tipe | Deskripsi | Diisi Oleh |
|------|------|------|----------|
| source_language_code | VARCHAR | Bahasa asli | Sam/Lexi |
| target_language_code | VARCHAR | Bahasa target | Default sistem EN |
| is_translated | BOOLEAN | Apakah sudah diterjemahkan | Lexi |
| description_translated | TEXT | Deskripsi setelah diterjemahkan | Lexi |

#### 2.2.2 Tabel Ekstensi Bisnis

**Perbaikan Peralatan (nb_tts_biz_repair)**

| Field | Tipe | Deskripsi |
|------|------|------|
| ticket_id | BIGINT | ID Ticket terkait |
| equipment_model | VARCHAR | Model peralatan |
| serial_number | VARCHAR | Nomor seri |
| fault_code | VARCHAR | Kode kerusakan |
| spare_parts | JSONB | Daftar suku cadang |
| maintenance_type | VARCHAR | Tipe maintenance |

**IT Support (nb_tts_biz_it_support)**

| Field | Tipe | Deskripsi |
|------|------|------|
| ticket_id | BIGINT | ID Ticket terkait |
| asset_number | VARCHAR | Nomor asset |
| os_version | VARCHAR | Versi sistem operasi |
| software_name | VARCHAR | Software yang terlibat |
| remote_address | VARCHAR | Alamat remote |
| error_code | VARCHAR | Kode error |

**Keluhan Pelanggan (nb_tts_biz_complaint)**

| Field | Tipe | Deskripsi |
|------|------|------|
| ticket_id | BIGINT | ID Ticket terkait |
| related_order_no | VARCHAR | Nomor Pesanan terkait |
| complaint_level | VARCHAR | Level keluhan |
| compensation_amount | DECIMAL | Jumlah kompensasi |
| compensation_type | VARCHAR | Tipe kompensasi |
| root_cause | TEXT | Akar masalah |

#### 2.2.3 Tabel Komentar (nb_tts_ticket_comments)

**Field Inti**

| Field | Tipe | Deskripsi |
|------|------|------|
| id | BIGINT | Primary key |
| ticket_id | BIGINT | ID Ticket |
| parent_id | BIGINT | ID komentar parent (mendukung tree) |
| content | TEXT | Konten komentar |
| direction | VARCHAR | Arah: inbound (Pelanggan)/outbound (customer service) |
| is_internal | BOOLEAN | Apakah catatan internal |
| is_first_response | BOOLEAN | Apakah respons pertama |

**Field Audit AI (untuk outbound)**

| Field | Tipe | Deskripsi |
|------|------|------|
| source_language_code | VARCHAR | Bahasa sumber |
| content_translated | TEXT | Konten terjemahan |
| is_translated | BOOLEAN | Apakah diterjemahkan |
| is_ai_blocked | BOOLEAN | Apakah dicegat AI |
| ai_block_reason | VARCHAR | Alasan pencegatan |
| ai_block_detail | TEXT | Penjelasan detail |
| ai_quality_score | NUMERIC | Skor kualitas |
| ai_suggestions | TEXT | Saran perbaikan |

#### 2.2.4 Tabel Evaluasi (nb_tts_ratings)

| Field | Tipe | Deskripsi |
|------|------|------|
| ticket_id | BIGINT | ID Ticket (unique) |
| overall_rating | INT | Kepuasan keseluruhan (1-5) |
| response_rating | INT | Kecepatan respons (1-5) |
| professionalism_rating | INT | Tingkat profesionalisme (1-5) |
| resolution_rating | INT | Penyelesaian masalah (1-5) |
| nps_score | INT | Skor NPS (0-10) |
| tags | JSONB | Tag cepat |
| comment | TEXT | Komentar teks |

#### 2.2.5 Tabel Artikel Pengetahuan (nb_tts_qa_articles)

| Field | Tipe | Deskripsi |
|------|------|------|
| article_no | VARCHAR | Nomor artikel KB-T0001 |
| title | VARCHAR | Judul |
| content | TEXT | Konten (Markdown) |
| summary | TEXT | Ringkasan |
| category_code | VARCHAR | Kode kategori |
| keywords | JSONB | Kata kunci |
| source_type | VARCHAR | Sumber: ticket/faq/manual |
| source_ticket_id | BIGINT | ID Ticket sumber |
| ai_generated | BOOLEAN | Apakah dihasilkan AI |
| ai_quality_score | NUMERIC | Skor kualitas |
| status | VARCHAR | Status: draft/published/archived |
| view_count | INT | Jumlah view |
| helpful_count | INT | Jumlah helpful |

### 2.3 Daftar Tabel Data

| No. | Nama Tabel | Deskripsi | Tipe Record |
|------|------|------|----------|
| 1 | nb_tts_tickets | Tabel utama Ticket | Data bisnis |
| 2 | nb_tts_biz_repair | Ekstensi perbaikan peralatan | Data bisnis |
| 3 | nb_tts_biz_it_support | Ekstensi IT support | Data bisnis |
| 4 | nb_tts_biz_complaint | Ekstensi keluhan Pelanggan | Data bisnis |
| 5 | nb_tts_customers | Tabel utama Pelanggan | Data bisnis |
| 6 | nb_tts_customer_contacts | Kontak Pelanggan | Data bisnis |
| 7 | nb_tts_ticket_comments | Komentar Ticket | Data bisnis |
| 8 | nb_tts_ratings | Evaluasi kepuasan | Data bisnis |
| 9 | nb_tts_qa_articles | Artikel pengetahuan | Data pengetahuan |
| 10 | nb_tts_qa_article_relations | Asosiasi artikel | Data pengetahuan |
| 11 | nb_tts_faqs | FAQ | Data pengetahuan |
| 12 | nb_tts_tickets_categories | Kategori Ticket | Data konfigurasi |
| 13 | nb_tts_sla_configs | Konfigurasi SLA | Data konfigurasi |
| 14 | nb_tts_skill_configs | Konfigurasi skill | Data konfigurasi |
| 15 | nb_tts_business_types | Tipe bisnis | Data konfigurasi |

---

## 3. Siklus Hidup Ticket

### 3.1 Definisi Status

| Status | Indonesian | Deskripsi | Penghitungan SLA | Warna |
|------|------|------|---------|------|
| new | Baru | Baru dibuat, menunggu penugasan | Mulai | Biru |
| assigned | Ditugaskan | Sudah ditentukan penanggung jawab, menunggu acceptance | Lanjut | Cyan |
| processing | Diproses | Sedang diproses | Lanjut | Oranye |
| pending | Pending | Menunggu feedback Pelanggan | **Jeda** | Abu-abu |
| transferred | Ditransfer | Dipindahkan ke orang lain | Lanjut | Ungu |
| resolved | Diselesaikan | Menunggu konfirmasi Pelanggan | Berhenti | Hijau |
| closed | Ditutup | Ticket selesai | Berhenti | Abu-abu |
| cancelled | Dibatalkan | Ticket dibatalkan | Berhenti | Abu-abu |

### 3.2 Diagram Alur Status

**Alur Utama (Kiri ke Kanan)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**Alur Cabang**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**State Machine Lengkap**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 Aturan Transisi Status Kunci

| Dari | Ke | Kondisi Trigger | Aksi Sistem |
|----|----|---------|---------|
| new | assigned | Tentukan penanggung jawab | Catat assigned_at |
| assigned | processing | Penanggung jawab klik "Accept" | Tidak ada |
| processing | pending | Klik "Pending" | Catat sla_paused_at |
| pending | processing | Pelanggan balas / restore manual | Hitung durasi jeda, kosongkan paused_at |
| processing | resolved | Klik "Selesai" | Catat resolved_at |
| resolved | closed | Konfirmasi Pelanggan / 3 hari timeout | Catat closed_at |
| * | cancelled | Batalkan Ticket | Tidak ada |


---

## 4. Manajemen Service Level SLA

### 4.1 Konfigurasi Prioritas dan SLA

| Prioritas | Nama | Waktu Respons | Waktu Penyelesaian | Threshold Peringatan | Skenario Tipikal |
|--------|------|----------|----------|----------|----------|
| P0 | Urgent | 15 menit | 2 jam | 80% | Sistem down, lini produksi berhenti |
| P1 | High | 1 jam | 8 jam | 80% | Gangguan fitur penting |
| P2 | Medium | 4 jam | 24 jam | 80% | Masalah umum |
| P3 | Low | 8 jam | 72 jam | 80% | Konsultasi, saran |

### 4.2 Logika Perhitungan SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### Saat Membuat Ticket

```
Batas waktu respons = Waktu submit + Batas waktu respons (menit)
Batas waktu penyelesaian = Waktu submit + Batas waktu penyelesaian (menit)
```

#### Saat Pending

```
Waktu mulai jeda SLA = Waktu saat ini
```

#### Saat Restore (dari pending kembali ke processing)

```
-- Hitung durasi jeda kali ini
Durasi jeda kali ini = Waktu saat ini - Waktu mulai jeda SLA

-- Akumulasi ke total durasi jeda
Total durasi jeda = Total durasi jeda + Durasi jeda kali ini

-- Perpanjang batas waktu (periode jeda tidak dihitung dalam SLA)
Batas waktu respons = Batas waktu respons + Durasi jeda kali ini
Batas waktu penyelesaian = Batas waktu penyelesaian + Durasi jeda kali ini

-- Kosongkan waktu mulai jeda
Waktu mulai jeda SLA = Kosong
```

#### Penilaian Pelanggaran SLA

```
-- Penilaian pelanggaran respons
Apakah respons melanggar = (waktu respons pertama kosong DAN waktu saat ini > batas waktu respons)
                  ATAU (waktu respons pertama > batas waktu respons)

-- Penilaian pelanggaran penyelesaian
Apakah penyelesaian melanggar = (waktu penyelesaian kosong DAN waktu saat ini > batas waktu penyelesaian)
                  ATAU (waktu penyelesaian > batas waktu penyelesaian)
```

### 4.3 Mekanisme Peringatan SLA

| Level Peringatan | Kondisi | Penerima Notifikasi | Cara Notifikasi |
|----------|------|----------|----------|
| Peringatan Kuning | Sisa waktu < 20% | Penanggung jawab | Pesan in-app |
| Peringatan Merah | Sudah timeout | Penanggung jawab + supervisor | Pesan in-app + email |
| Peringatan Eskalasi | Timeout 1 jam | Manajer departemen | Email + SMS |

### 4.4 Indikator Dashboard SLA

| Indikator | Formula | Threshold Sehat |
|------|----------|----------|
| Tingkat Kepatuhan Respons | Jumlah Ticket tidak melanggar / Total Ticket | > 95% |
| Tingkat Kepatuhan Penyelesaian | Jumlah penyelesaian tidak melanggar / Jumlah Ticket diselesaikan | > 90% |
| Rata-rata Waktu Respons | SUM(waktu respons) / Jumlah Ticket | < 50% SLA |
| Rata-rata Waktu Penyelesaian | SUM(waktu penyelesaian) / Jumlah Ticket | < 80% SLA |

---

## 5. Kemampuan AI dan Sistem Employee

### 5.1 Tim AI Employee

Sistem dikonfigurasi dengan 8 AI Employee, dibagi menjadi dua kategori:

**Employee Baru (Khusus Sistem Ticket)**

| ID | Nama | Posisi | Kemampuan Inti |
|----|------|------|----------|
| sam | Sam | Service Desk Lead | Distribusi Ticket, evaluasi prioritas, keputusan eskalasi, identifikasi risiko SLA |
| grace | Grace | Customer Success Specialist | Generate balasan profesional, penyesuaian nada, penanganan keluhan, pemulihan kepuasan |
| max | Max | Asisten Pengetahuan | Pencarian kasus serupa, rekomendasi pengetahuan, sintesis solusi |

**Employee yang Digunakan Ulang (Kemampuan Umum)**

| ID | Nama | Posisi | Kemampuan Inti |
|----|------|------|----------|
| dex | Dex | Data Curator | Ekstraksi Ticket dari email, telepon ke Ticket, batch data cleaning |
| ellis | Ellis | Ahli Email | Analisis sentimen email, ringkasan thread, draft balasan |
| lexi | Lexi | Penerjemah | Terjemahan Ticket, terjemahan balasan, terjemahan dialog real-time |
| cole | Cole | Ahli NocoBase | Panduan penggunaan sistem, bantuan konfigurasi Workflow |
| vera | Vera | Research Analyst | Riset solusi teknis, verifikasi informasi Produk |

### 5.2 Daftar Tugas AI

Setiap AI Employee dikonfigurasi dengan 4 tugas spesifik:

#### Tugas Sam

| ID Tugas | Nama | Cara Trigger | Deskripsi |
|--------|------|----------|------|
| SAM-01 | Analisis Distribusi Ticket | Otomatis Workflow | Otomatis analisis saat Ticket baru dibuat |
| SAM-02 | Re-evaluasi Prioritas | Interaksi Frontend | Sesuaikan prioritas berdasarkan informasi baru |
| SAM-03 | Keputusan Eskalasi | Frontend/Workflow | Tentukan apakah perlu eskalasi |
| SAM-04 | Penilaian Risiko SLA | Otomatis Workflow | Identifikasi risiko timeout |

#### Tugas Grace

| ID Tugas | Nama | Cara Trigger | Deskripsi |
|--------|------|----------|------|
| GRACE-01 | Generate Balasan Profesional | Interaksi Frontend | Generate balasan berdasarkan konteks |
| GRACE-02 | Penyesuaian Nada Balasan | Interaksi Frontend | Optimasi nada balasan yang sudah ada |
| GRACE-03 | Penanganan De-escalation Keluhan | Frontend/Workflow | Meredakan keluhan Pelanggan |
| GRACE-04 | Pemulihan Kepuasan | Frontend/Workflow | Follow-up setelah pengalaman negatif |

#### Tugas Max

| ID Tugas | Nama | Cara Trigger | Deskripsi |
|--------|------|----------|------|
| MAX-01 | Pencarian Kasus Serupa | Frontend/Workflow | Cari Ticket historis yang serupa |
| MAX-02 | Rekomendasi Artikel Pengetahuan | Frontend/Workflow | Rekomendasi artikel pengetahuan terkait |
| MAX-03 | Sintesis Solusi | Interaksi Frontend | Sintesis solusi dari berbagai sumber |
| MAX-04 | Panduan Troubleshooting | Interaksi Frontend | Buat alur pemeriksaan sistematis |

#### Tugas Lexi

| ID Tugas | Nama | Cara Trigger | Deskripsi |
|--------|------|----------|------|
| LEXI-01 | Terjemahan Ticket | Otomatis Workflow | Menerjemahkan konten Ticket |
| LEXI-02 | Terjemahan Balasan | Interaksi Frontend | Menerjemahkan balasan customer service |
| LEXI-03 | Terjemahan Batch | Otomatis Workflow | Pemrosesan terjemahan batch |
| LEXI-04 | Terjemahan Dialog Real-time | Interaksi Frontend | Terjemahan dialog real-time |

### 5.3 AI Employee dan Siklus Hidup Ticket

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 Contoh Respons AI

#### Respons Analisis Ticket SAM-01

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "Login Gagal", "Timeout", "Closing Akhir Bulan"],
  "confidence": 0.92,
  "reasoning": "Ticket ini mendeskripsikan masalah login sistem ERP, memengaruhi closing akhir bulan departemen keuangan, urgensinya tinggi",
  "suggested_reply": "Pelanggan yang terhormat, terima kasih atas laporan masalah ini...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Hello, our ERP system cannot login..."
}
```

#### Respons Generate Balasan GRACE-01

```
Bapak Zhang yang terhormat,

Terima kasih telah menghubungi kami untuk melaporkan masalah login ERP. Saya sepenuhnya
memahami masalah ini sedang memengaruhi pekerjaan closing akhir bulan perusahaan Anda,
kami telah memprioritaskan masalah ini sebagai prioritas tinggi.

Status saat ini:
- Tim teknis sedang menyelidiki masalah koneksi server
- Diperkirakan akan memberikan update progress dalam 30 menit

Sementara itu, Anda dapat mencoba:
1. Akses melalui alamat backup: https://erp-backup.company.com
2. Jika ada kebutuhan laporan urgent, dapat menghubungi kami untuk membantu ekspor

Jika ada pertanyaan lain, silakan hubungi saya kapan saja.

Hormat kami
Tim Technical Support
```

### 5.5 Firewall Emotional Intelligence AI

Audit kualitas balasan yang ditangani Grace akan mencegat masalah berikut:

| Tipe Masalah | Contoh Asli | Saran AI |
|----------|----------|--------|
| Nada Negatif | "Tidak bisa, ini di luar garansi" | "Kerusakan ini sementara tidak dapat dijamin gratis, kami dapat menyediakan paket perbaikan berbayar" |
| Menyalahkan Pelanggan | "Anda merusaknya sendiri" | "Setelah diverifikasi, kerusakan ini termasuk kerusakan tidak disengaja" |
| Mengelak Tanggung Jawab | "Bukan masalah kami" | "Izinkan saya membantu menyelidiki penyebab masalah lebih lanjut" |
| Ekspresi Dingin | "Tidak tahu" | "Saya akan membantu Anda mencari informasi terkait" |
| Informasi Sensitif | "Password Anda adalah abc123" | [Dicegat] Mengandung informasi sensitif, tidak diperbolehkan dikirim |

---

## 6. Sistem Knowledge Base

### 6.1 Sumber Pengetahuan

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 Alur Konversi Ticket ke Pengetahuan

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**Dimensi Evaluasi**:
- **Universalitas**: Apakah ini masalah umum?
- **Kelengkapan**: Apakah solusinya jelas dan lengkap?
- **Reproduktibilitas**: Apakah langkah-langkahnya dapat digunakan kembali?

### 6.3 Mekanisme Rekomendasi Pengetahuan

Saat customer service membuka detail Ticket, Max otomatis merekomendasikan pengetahuan terkait:

```
┌────────────────────────────────────────────────────────────┐
│ Pengetahuan yang Direkomendasikan         [Expand/Collapse] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Panduan Diagnosis Servo CNC      Match: 94%   │ │
│ │ Berisi: Interpretasi kode alarm, langkah pemeriksaan    │ │
│ │ [Lihat] [Terapkan ke Balasan] [Tandai Helpful]          │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Manual Maintenance XYZ-CNC3000   Match: 87%   │ │
│ │ Berisi: Kerusakan umum, rencana maintenance preventif  │ │
│ │ [Lihat] [Terapkan ke Balasan] [Tandai Helpful]          │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Engine Workflow

### 7.1 Klasifikasi Workflow

| Kode | Kategori | Deskripsi | Cara Trigger |
|------|------|------|----------|
| WF-T | Alur Ticket | Manajemen siklus hidup Ticket | Event form |
| WF-S | Alur SLA | Perhitungan dan peringatan SLA | Event form/scheduled |
| WF-C | Alur Komentar | Pemrosesan dan terjemahan komentar | Event form |
| WF-R | Alur Evaluasi | Undangan dan statistik evaluasi | Event form/scheduled |
| WF-N | Alur Notifikasi | Pengiriman notifikasi | Event-driven |
| WF-AI | Alur AI | Analisis dan generate AI | Event form |

### 7.2 Workflow Inti

#### WF-T01: Alur Pembuatan Ticket

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: Analisis AI Ticket

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: Terjemahan dan Audit Komentar

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: Generate Pengetahuan

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 Scheduled Task

| Tugas | Frekuensi Eksekusi | Deskripsi |
|------|----------|------|
| Pemeriksaan Peringatan SLA | Setiap 5 menit | Periksa Ticket yang akan timeout |
| Auto-close Ticket | Setiap hari | Status resolved otomatis ditutup setelah 3 hari |
| Pengiriman Undangan Evaluasi | Setiap hari | Setelah ditutup 24 jam, kirim undangan evaluasi |
| Update Data Statistik | Setiap jam | Update statistik Ticket Pelanggan |

---

## 8. Desain Menu dan Antarmuka

### 8.1 Backend Admin

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 Customer Portal

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 Desain Dashboard

#### Tampilan Eksekutif

| Komponen | Tipe | Deskripsi Data |
|------|------|----------|
| Tingkat Kepatuhan SLA | Dashboard | Tingkat kepatuhan respons/penyelesaian bulan ini |
| Tren Kepuasan | Line Chart | Perubahan kepuasan 30 hari terakhir |
| Tren Volume Ticket | Bar Chart | Volume Ticket 30 hari terakhir |
| Distribusi Tipe Bisnis | Pie Chart | Persentase setiap tipe bisnis |

#### Tampilan Supervisor

| Komponen | Tipe | Deskripsi Data |
|------|------|----------|
| Peringatan Timeout | Daftar | Ticket yang akan timeout/sudah timeout |
| Beban Kerja Personel | Bar Chart | Jumlah Ticket anggota tim |
| Distribusi Backlog | Stacked Chart | Jumlah Ticket setiap status |
| Efisiensi Pemrosesan | Heatmap | Distribusi rata-rata waktu pemrosesan |

#### Tampilan Customer Service

| Komponen | Tipe | Deskripsi Data |
|------|------|----------|
| To-do Saya | Number Card | Jumlah Ticket pending |
| Distribusi Prioritas | Pie Chart | Distribusi P0/P1/P2/P3 |
| Statistik Hari Ini | KPI Card | Jumlah diproses/diselesaikan hari ini |
| Countdown SLA | Daftar | 5 Ticket paling urgent |

---

## Lampiran

### A. Konfigurasi Tipe Bisnis

| Kode Tipe | Nama | Ikon | Tabel Ekstensi Terkait |
|----------|------|------|------------|
| repair | Perbaikan Peralatan | Wrench | nb_tts_biz_repair |
| it_support | IT Support | Computer | nb_tts_biz_it_support |
| complaint | Keluhan Pelanggan | Megaphone | nb_tts_biz_complaint |
| consultation | Konsultasi & Saran | Question | Tidak ada |
| other | Lainnya | Note | Tidak ada |

### B. Kode Klasifikasi

| Kode | Nama | Deskripsi |
|------|------|------|
| CONVEYOR | Sistem Konveyor | Masalah sistem konveyor |
| PACKAGING | Mesin Packaging | Masalah mesin packaging |
| WELDING | Peralatan Welding | Masalah peralatan welding |
| COMPRESSOR | Air Compressor | Masalah air compressor |
| COLD_STORE | Cold Storage | Masalah cold storage |
| CENTRAL_AC | Central AC | Masalah central AC |
| FORKLIFT | Forklift | Masalah forklift |
| COMPUTER | Komputer | Masalah hardware komputer |
| PRINTER | Printer | Masalah printer |
| PROJECTOR | Proyektor | Masalah proyektor |
| INTERNET | Jaringan | Masalah koneksi jaringan |
| EMAIL | Email | Masalah sistem email |
| ACCESS | Akses | Masalah izin akun |
| PROD_INQ | Konsultasi Produk | Konsultasi Produk |
| COMPLAINT | Keluhan Umum | Keluhan umum |
| DELAY | Keterlambatan Logistik | Keluhan keterlambatan logistik |
| DAMAGE | Kerusakan Packaging | Keluhan kerusakan packaging |
| QUANTITY | Kekurangan Jumlah | Keluhan kekurangan jumlah |
| SVC_ATTITUDE | Sikap Layanan | Keluhan sikap layanan |
| PROD_QUALITY | Kualitas Produk | Keluhan kualitas Produk |
| TRAINING | Pelatihan | Permintaan pelatihan |
| RETURN | Retur | Permintaan retur |

---

*Versi dokumen: 2.0 | Pembaruan terakhir: 2026-01-05*
