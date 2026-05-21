---
title: "Desain Detail Sistem CRM 2.0"
description: "Desain Detail Sistem CRM 2.0: arsitektur modular, entitas inti dan model data, struktur tabel Lead/Peluang/Pelanggan/Penawaran/Pesanan, konfigurasi sales pipeline, Workflow dan bantuan AI."
keywords: "Desain CRM,Model Data,Sales Funnel,Tahap Peluang,Arsitektur Modular,NocoBase"
---

# Desain Detail Sistem CRM 2.0


## 1. Ikhtisar Sistem dan Filosofi Desain

### 1.1 Posisi Sistem

Sistem ini adalah **platform manajemen penjualan CRM 2.0** yang dibangun berdasarkan platform no-code NocoBase. Tujuan utamanya adalah:

```
Membiarkan tenaga penjualan fokus membangun hubungan dengan Pelanggan, bukan input data dan analisis berulang
```

Sistem menangani tugas rutin secara otomatis melalui Workflow, dan dengan bantuan AI menyelesaikan pekerjaan seperti skoring Lead, analisis Peluang, untuk membantu tim penjualan meningkatkan efisiensi.

### 1.2 Filosofi Desain

#### Filosofi Satu: Sales Funnel Lengkap

**Alur penjualan end-to-end:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Mengapa dirancang seperti ini?**

| Cara Tradisional | CRM Terintegrasi |
|---------|-----------|
| Tahap berbeda menggunakan beberapa sistem | Sistem tunggal mencakup seluruh siklus hidup |
| Transfer data manual antar sistem | Aliran dan konversi data otomatis |
| Tampilan Pelanggan tidak konsisten | Tampilan 360 derajat Pelanggan yang terpadu |
| Analisis data terpisah-pisah | Analisis sales pipeline end-to-end |

#### Filosofi Dua: Sales Pipeline yang Dapat Dikonfigurasi
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)


Industri yang berbeda dapat menyesuaikan tahap sales pipeline tanpa perlu memodifikasi kode.

#### Filosofi Tiga: Desain Modular

- Modul inti (Pelanggan + Peluang) wajib, modul lain dapat diaktifkan sesuai kebutuhan
- Modul yang dinonaktifkan tidak perlu memodifikasi kode, cukup dikonfigurasi melalui antarmuka NocoBase
- Setiap modul dirancang independen, mengurangi kopling

---

## 2. Arsitektur Modul dan Kustomisasi

### 2.1 Ikhtisar Modul

Sistem CRM mengadopsi desain **arsitektur modular** — setiap modul dapat diaktifkan atau dinonaktifkan secara independen sesuai kebutuhan bisnis.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Hubungan Ketergantungan Modul

| Modul | Apakah Wajib | Dependensi | Kondisi Disable |
|-----|---------|--------|---------|
| **Manajemen Pelanggan** | Ya | - | Tidak dapat dinonaktifkan (inti) |
| **Manajemen Peluang** | Ya | Manajemen Pelanggan | Tidak dapat dinonaktifkan (inti) |
| **Manajemen Lead** | Opsional | - | Tidak butuh akuisisi Lead |
| **Manajemen Penawaran** | Opsional | Peluang, Produk | Transaksi sederhana tidak butuh Penawaran formal |
| **Manajemen Pesanan** | Opsional | Peluang (atau Penawaran) | Tidak butuh pelacakan Pesanan/pembayaran |
| **Manajemen Produk** | Opsional | - | Tidak butuh katalog Produk |
| **Integrasi Email** | Opsional | Pelanggan, Kontak | Menggunakan sistem email eksternal |

### 2.3 Versi Pre-Konfigurasi

| Versi | Modul yang Disertakan | Skenario Penggunaan | Jumlah Tabel Data |
|-----|---------|---------|-----------|
| **Versi Ringan** | Pelanggan + Peluang | Pelacakan transaksi sederhana | 6 |
| **Versi Standard** | Versi Ringan + Lead + Penawaran + Pesanan + Produk | Siklus penjualan lengkap | 15 |
| **Versi Enterprise** | Versi Standard + Integrasi Email | Fungsi lengkap dengan email | 17 |

### 2.4 Pemetaan Modul-Tabel Data

#### Tabel Data Modul Inti (Selalu Wajib)

| Tabel Data | Modul | Deskripsi |
|-------|------|------|
| nb_crm_customers | Manajemen Pelanggan | Record Pelanggan/Perusahaan |
| nb_crm_contacts | Manajemen Pelanggan | Kontak |
| nb_crm_customer_shares | Manajemen Pelanggan | Izin berbagi Pelanggan |
| nb_crm_opportunities | Manajemen Peluang | Peluang penjualan |
| nb_crm_opportunity_stages | Manajemen Peluang | Konfigurasi tahap |
| nb_crm_opportunity_users | Manajemen Peluang | Kolaborator Peluang |
| nb_crm_activities | Manajemen Aktivitas | Riwayat aktivitas |
| nb_crm_comments | Manajemen Aktivitas | Komentar/catatan |
| nb_crm_tags | Inti | Tag yang dibagikan |
| nb_cbo_currencies | Data Dasar | Kamus mata uang |
| nb_cbo_regions | Data Dasar | Kamus negara/wilayah |

### 2.5 Cara Menonaktifkan Modul

Cukup sembunyikan entry menu modul tersebut di backend admin NocoBase, tanpa perlu memodifikasi kode atau menghapus tabel data.

---

## 3. Entitas Inti dan Model Data

### 3.1 Ikhtisar Hubungan Entitas
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Detail Tabel Data Inti

#### 3.2.1 Tabel Lead (nb_crm_leads)

Manajemen Lead dengan Workflow 4-tahap yang disederhanakan.

**Alur tahap:**
```
Baru → Sedang Follow-up → Tervalidasi → Konversi ke Pelanggan/Peluang
         ↓          ↓
     Tidak Memenuhi Syarat
```

**Field Kunci:**

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| lead_no | VARCHAR | Nomor Lead (auto-generated) |
| name | VARCHAR | Nama Kontak |
| company | VARCHAR | Nama perusahaan |
| title | VARCHAR | Jabatan |
| email | VARCHAR | Email |
| phone | VARCHAR | Telepon |
| mobile_phone | VARCHAR | HP |
| website | TEXT | Website |
| address | TEXT | Alamat |
| source | VARCHAR | Sumber Lead: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Industri |
| annual_revenue | VARCHAR | Skala pendapatan tahunan |
| number_of_employees | VARCHAR | Skala jumlah karyawan |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Rating: hot/warm/cold |
| owner_id | BIGINT | Penanggung jawab (FK → users) |
| ai_score | INTEGER | Skor kualitas AI 0-100 |
| ai_convert_prob | DECIMAL | Probabilitas konversi AI |
| ai_best_contact_time | VARCHAR | Waktu kontak yang direkomendasikan AI |
| ai_tags | JSONB | Tag yang dihasilkan AI |
| ai_scored_at | TIMESTAMP | Waktu skoring AI |
| ai_next_best_action | TEXT | Rekomendasi langkah terbaik berikutnya dari AI |
| ai_nba_generated_at | TIMESTAMP | Waktu rekomendasi AI dihasilkan |
| is_converted | BOOLEAN | Penanda sudah dikonversi |
| converted_at | TIMESTAMP | Waktu konversi |
| converted_customer_id | BIGINT | ID Pelanggan hasil konversi |
| converted_contact_id | BIGINT | ID Kontak hasil konversi |
| converted_opportunity_id | BIGINT | ID Peluang hasil konversi |
| lost_reason | TEXT | Alasan kehilangan |
| disqualification_reason | TEXT | Alasan tidak memenuhi syarat |
| description | TEXT | Deskripsi |

#### 3.2.2 Tabel Pelanggan (nb_crm_customers)

Manajemen Pelanggan/Perusahaan yang mendukung bisnis ekspor.

**Field Kunci:**

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| name | VARCHAR | Nama Pelanggan (wajib) |
| account_number | VARCHAR | Nomor Pelanggan (auto-generated, unique) |
| phone | VARCHAR | Telepon |
| website | TEXT | Website |
| address | TEXT | Alamat |
| industry | VARCHAR | Industri |
| type | VARCHAR | Tipe: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Skala jumlah karyawan |
| annual_revenue | VARCHAR | Skala pendapatan tahunan |
| level | VARCHAR | Level: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | Negara |
| region_id | BIGINT | Wilayah (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Mata uang preferensi: CNY/USD/EUR |
| owner_id | BIGINT | Penanggung jawab (FK → users) |
| parent_id | BIGINT | Perusahaan induk (FK → self) |
| source_lead_id | BIGINT | ID Lead asal |
| ai_health_score | INTEGER | Skor kesehatan AI 0-100 |
| ai_health_grade | VARCHAR | Tingkat kesehatan AI: A/B/C/D |
| ai_churn_risk | DECIMAL | Risiko churn AI 0-100% |
| ai_churn_risk_level | VARCHAR | Tingkat risiko churn AI: low/medium/high |
| ai_health_dimensions | JSONB | Skor setiap dimensi kesehatan AI |
| ai_recommendations | JSONB | Daftar rekomendasi AI |
| ai_health_assessed_at | TIMESTAMP | Waktu penilaian kesehatan AI |
| ai_tags | JSONB | Tag yang dihasilkan AI |
| ai_best_contact_time | VARCHAR | Waktu kontak yang direkomendasikan AI |
| ai_next_best_action | TEXT | Rekomendasi langkah terbaik berikutnya dari AI |
| ai_nba_generated_at | TIMESTAMP | Waktu rekomendasi AI dihasilkan |
| description | TEXT | Deskripsi |
| is_deleted | BOOLEAN | Penanda soft delete |

#### 3.2.3 Tabel Peluang (nb_crm_opportunities)

Manajemen Peluang penjualan dengan tahap sales pipeline yang dapat dikonfigurasi.

**Field Kunci:**

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| opportunity_no | VARCHAR | Nomor Peluang (auto-generated, unique) |
| name | VARCHAR | Nama Peluang (wajib) |
| amount | DECIMAL | Jumlah yang diharapkan |
| currency | VARCHAR | Mata uang |
| exchange_rate | DECIMAL | Nilai tukar |
| amount_usd | DECIMAL | Jumlah ekuivalen USD |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak utama (FK) |
| stage | VARCHAR | Kode tahap (FK → stages.code) |
| stage_sort | INTEGER | Urutan tahap (redundan, untuk pengurutan) |
| stage_entered_at | TIMESTAMP | Waktu masuk tahap saat ini |
| days_in_stage | INTEGER | Hari di tahap saat ini |
| win_probability | DECIMAL | Probabilitas menang manual |
| ai_win_probability | DECIMAL | Prediksi probabilitas menang AI |
| ai_analyzed_at | TIMESTAMP | Waktu analisis AI |
| ai_confidence | DECIMAL | Tingkat kepercayaan prediksi AI |
| ai_trend | VARCHAR | Tren prediksi AI: up/stable/down |
| ai_risk_factors | JSONB | Faktor risiko yang diidentifikasi AI |
| ai_recommendations | JSONB | Daftar rekomendasi AI |
| ai_predicted_close | DATE | Tanggal closing prediksi AI |
| ai_next_best_action | TEXT | Rekomendasi langkah terbaik berikutnya dari AI |
| ai_nba_generated_at | TIMESTAMP | Waktu rekomendasi AI dihasilkan |
| expected_close_date | DATE | Tanggal closing yang diharapkan |
| actual_close_date | DATE | Tanggal closing aktual |
| owner_id | BIGINT | Penanggung jawab (FK → users) |
| last_activity_at | TIMESTAMP | Waktu aktivitas terakhir |
| stagnant_days | INTEGER | Hari tanpa aktivitas |
| loss_reason | TEXT | Alasan kalah |
| competitor_id | BIGINT | Kompetitor (FK) |
| lead_source | VARCHAR | Sumber Lead |
| campaign_id | BIGINT | ID kampanye marketing |
| expected_revenue | DECIMAL | Pendapatan diharapkan = amount × probability |
| description | TEXT | Deskripsi |

#### 3.2.4 Tabel Penawaran (nb_crm_quotations)

Manajemen Penawaran dengan dukungan multi-mata uang dan alur persetujuan.

**Alur status:**
```
Draft → Menunggu Persetujuan → Disetujui → Terkirim → Diterima/Ditolak/Kedaluwarsa
           ↓
       Ditolak → Direvisi → Draft
```

**Field Kunci:**

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| quotation_no | VARCHAR | Nomor Penawaran (auto-generated, unique) |
| name | VARCHAR | Nama Penawaran |
| version | INTEGER | Nomor versi |
| opportunity_id | BIGINT | Peluang (FK, wajib) |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak (FK) |
| owner_id | BIGINT | Penanggung jawab (FK → users) |
| currency_id | BIGINT | Mata uang (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Nilai tukar |
| subtotal | DECIMAL | Subtotal |
| discount_rate | DECIMAL | Persentase diskon |
| discount_amount | DECIMAL | Jumlah diskon |
| shipping_handling | DECIMAL | Pengiriman/biaya handling |
| tax_rate | DECIMAL | Tarif pajak |
| tax_amount | DECIMAL | Jumlah pajak |
| total_amount | DECIMAL | Total |
| total_amount_usd | DECIMAL | Total ekuivalen USD |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Waktu submit |
| approved_by | BIGINT | Approver (FK → users) |
| approved_at | TIMESTAMP | Waktu disetujui |
| rejected_at | TIMESTAMP | Waktu ditolak |
| sent_at | TIMESTAMP | Waktu dikirim |
| customer_response_at | TIMESTAMP | Waktu respons Pelanggan |
| expired_at | TIMESTAMP | Waktu kedaluwarsa |
| valid_until | DATE | Berlaku hingga |
| payment_terms | TEXT | Syarat pembayaran |
| terms_condition | TEXT | Syarat dan ketentuan |
| address | TEXT | Alamat pengiriman |
| description | TEXT | Deskripsi |

#### 3.2.5 Tabel Pesanan (nb_crm_orders)

Manajemen Pesanan dengan pelacakan pembayaran.

**Field Kunci:**

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| order_no | VARCHAR | Nomor Pesanan (auto-generated, unique) |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak (FK) |
| opportunity_id | BIGINT | Peluang (FK) |
| quotation_id | BIGINT | Penawaran (FK) |
| owner_id | BIGINT | Penanggung jawab (FK → users) |
| currency | VARCHAR | Mata uang |
| exchange_rate | DECIMAL | Nilai tukar |
| order_amount | DECIMAL | Jumlah Pesanan |
| paid_amount | DECIMAL | Jumlah dibayar |
| unpaid_amount | DECIMAL | Jumlah belum dibayar |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Status pembayaran: unpaid/partial/paid |
| order_date | DATE | Tanggal Pesanan |
| delivery_date | DATE | Estimasi tanggal pengiriman |
| actual_delivery_date | DATE | Tanggal pengiriman aktual |
| shipping_address | TEXT | Alamat pengiriman |
| logistics_company | VARCHAR | Perusahaan logistik |
| tracking_no | VARCHAR | Nomor pelacakan |
| terms_condition | TEXT | Syarat dan ketentuan |
| description | TEXT | Deskripsi |

### 3.3 Ringkasan Tabel Data

#### Tabel Bisnis CRM

| No. | Nama Tabel | Deskripsi | Tipe |
|-----|------|------|------|
| 1 | nb_crm_leads | Manajemen Lead | Bisnis |
| 2 | nb_crm_customers | Pelanggan/Perusahaan | Bisnis |
| 3 | nb_crm_contacts | Kontak | Bisnis |
| 4 | nb_crm_opportunities | Peluang penjualan | Bisnis |
| 5 | nb_crm_opportunity_stages | Konfigurasi tahap | Konfigurasi |
| 6 | nb_crm_opportunity_users | Kolaborator Peluang (tim sales) | Asosiasi |
| 7 | nb_crm_quotations | Penawaran | Bisnis |
| 8 | nb_crm_quotation_items | Detail Penawaran | Bisnis |
| 9 | nb_crm_quotation_approvals | Riwayat persetujuan | Bisnis |
| 10 | nb_crm_orders | Pesanan | Bisnis |
| 11 | nb_crm_order_items | Detail Pesanan | Bisnis |
| 12 | nb_crm_payments | Riwayat pembayaran | Bisnis |
| 13 | nb_crm_products | Katalog Produk | Bisnis |
| 14 | nb_crm_product_categories | Kategori Produk | Konfigurasi |
| 15 | nb_crm_price_tiers | Harga bertingkat | Konfigurasi |
| 16 | nb_crm_activities | Riwayat aktivitas | Bisnis |
| 17 | nb_crm_comments | Komentar/catatan | Bisnis |
| 18 | nb_crm_competitors | Kompetitor | Bisnis |
| 19 | nb_crm_tags | Tag | Konfigurasi |
| 20 | nb_crm_lead_tags | Asosiasi Lead-Tag | Asosiasi |
| 21 | nb_crm_contact_tags | Asosiasi Kontak-Tag | Asosiasi |
| 22 | nb_crm_customer_shares | Izin berbagi Pelanggan | Asosiasi |
| 23 | nb_crm_exchange_rates | Riwayat nilai tukar | Konfigurasi |

#### Tabel Data Dasar (Modul Publik)

| No. | Nama Tabel | Deskripsi | Tipe |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Kamus mata uang | Konfigurasi |
| 2 | nb_cbo_regions | Kamus negara/wilayah | Konfigurasi |

### 3.4 Tabel Pendukung

#### 3.4.1 Tabel Komentar (nb_crm_comments)

Tabel komentar/catatan umum, dapat dikaitkan dengan berbagai objek bisnis.

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| content | TEXT | Konten komentar |
| lead_id | BIGINT | Lead terkait (FK) |
| customer_id | BIGINT | Pelanggan terkait (FK) |
| opportunity_id | BIGINT | Peluang terkait (FK) |
| order_id | BIGINT | Pesanan terkait (FK) |

#### 3.4.2 Tabel Berbagi Pelanggan (nb_crm_customer_shares)

Mengimplementasikan kolaborasi multi-user dan berbagi izin Pelanggan.

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| customer_id | BIGINT | Pelanggan (FK, wajib) |
| shared_with_user_id | BIGINT | User yang dibagi (FK, wajib) |
| shared_by_user_id | BIGINT | Pemberi share (FK) |
| permission_level | VARCHAR | Level izin: read/write/full |
| shared_at | TIMESTAMP | Waktu berbagi |

#### 3.4.3 Tabel Kolaborator Peluang (nb_crm_opportunity_users)

Mendukung kolaborasi tim sales pada Peluang.

| Field | Tipe | Deskripsi |
|-----|------|------|
| opportunity_id | BIGINT | Peluang (FK, composite primary key) |
| user_id | BIGINT | User (FK, composite primary key) |
| role | VARCHAR | Role: owner/collaborator/viewer |

#### 3.4.4 Tabel Wilayah (nb_cbo_regions)

Kamus data dasar negara/wilayah.

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| code_alpha2 | VARCHAR | Kode 2 huruf ISO 3166-1 (unique) |
| code_alpha3 | VARCHAR | Kode 3 huruf ISO 3166-1 (unique) |
| code_numeric | VARCHAR | Kode numerik ISO 3166-1 |
| name | VARCHAR | Nama negara/wilayah |
| is_active | BOOLEAN | Apakah aktif |
| sort_order | INTEGER | Urutan |

---

## 4. Siklus Hidup Lead

Manajemen Lead menggunakan Workflow 4-tahap yang disederhanakan, saat Lead baru dibuat dapat memicu skoring AI otomatis melalui Workflow, membantu sales mengidentifikasi Lead berkualitas tinggi dengan cepat.

### 4.1 Definisi Status

| Status | Nama | Deskripsi |
|-----|------|------|
| new | Baru | Baru dibuat, menunggu kontak |
| working | Sedang Follow-up | Sedang aktif di-follow up |
| qualified | Tervalidasi | Siap dikonversi |
| unqualified | Tidak Memenuhi Syarat | Tidak cocok |

### 4.2 Diagram Alur Status

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Alur Konversi Lead

Antarmuka konversi menyediakan tiga opsi sekaligus, pengguna dapat memilih untuk membuat atau menghubungkan:

- **Pelanggan**: Buat Pelanggan baru atau hubungkan ke Pelanggan yang ada
- **Kontak**: Buat Kontak baru (dihubungkan ke Pelanggan)
- **Peluang**: Wajib membuat Peluang
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Record setelah konversi:**
- `converted_customer_id`: ID Pelanggan terkait
- `converted_contact_id`: ID Kontak terkait
- `converted_opportunity_id`: ID Peluang yang dibuat

---

## 5. Siklus Hidup Peluang

Manajemen Peluang menggunakan tahap sales pipeline yang dapat dikonfigurasi. Saat tahap Peluang berubah, dapat secara otomatis memicu prediksi probabilitas menang AI, membantu sales mengidentifikasi risiko dan peluang.

### 5.1 Tahap yang Dapat Dikonfigurasi

Tahap disimpan di tabel `nb_crm_opportunity_stages`, dapat dikustomisasi:

| Kode | Nama | Urutan | Probabilitas Menang Default |
|-----|------|------|---------|
| prospecting | Kontak Awal | 1 | 10% |
| analysis | Analisis Kebutuhan | 2 | 30% |
| proposal | Pengajuan Proposal | 3 | 60% |
| negotiation | Negosiasi Bisnis | 4 | 80% |
| won | Berhasil Menang | 5 | 100% |
| lost | Kalah | 6 | 0% |

### 5.2 Alur Pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)


### 5.3 Deteksi Stagnan

Peluang tanpa aktivitas akan ditandai:

| Hari Tanpa Aktivitas | Tindakan |
|-----------|------|
| 7 hari | Peringatan kuning |
| 14 hari | Peringatan oranye ke penanggung jawab |
| 30 hari | Peringatan merah ke manajer |

```sql
-- Hitung hari stagnan
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Pemrosesan Menang/Kalah

**Saat menang:**
1. Update tahap menjadi 'won'
2. Catat tanggal closing aktual
3. Update status Pelanggan menjadi 'active'
4. Picu pembuatan Pesanan (jika Penawaran diterima)

**Saat kalah:**
1. Update tahap menjadi 'lost'
2. Catat alasan kalah
3. Catat ID kompetitor (jika kalah ke kompetitor)
4. Beritahu manajer

---

## 6. Siklus Hidup Penawaran

### 6.1 Definisi Status

| Status | Nama | Deskripsi |
|-----|------|------|
| draft | Draft | Sedang disiapkan |
| pending_approval | Menunggu Persetujuan | Menunggu approval |
| approved | Disetujui | Dapat dikirim |
| sent | Terkirim | Sudah dikirim ke Pelanggan |
| accepted | Diterima | Pelanggan sudah menerima |
| rejected | Ditolak | Pelanggan menolak |
| expired | Kedaluwarsa | Melewati masa berlaku |

### 6.2 Aturan Persetujuan (Akan Disempurnakan)

Alur persetujuan dipicu berdasarkan kondisi berikut:

| Kondisi | Level Persetujuan |
|------|---------|
| Diskon > 10% | Manajer Penjualan |
| Diskon > 20% | Direktur Penjualan |
| Jumlah > $100K | Keuangan + Direktur Utama |


### 6.3 Dukungan Multi-Mata Uang

#### Filosofi Desain

Menggunakan **USD sebagai mata uang dasar terpadu** untuk semua laporan dan analisis. Setiap record jumlah menyimpan:
- Mata uang dan jumlah asli (yang dilihat Pelanggan)
- Nilai tukar saat transaksi
- Jumlah ekuivalen USD (untuk perbandingan internal)

#### Tabel Kamus Mata Uang (nb_cbo_currencies)

Konfigurasi mata uang menggunakan tabel data dasar publik, mendukung manajemen dinamis. Field `current_rate` menyimpan nilai tukar saat ini, di-sync update oleh scheduled task dari record terbaru di `nb_crm_exchange_rates`.

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| code | VARCHAR | Kode mata uang (unique): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Nama mata uang |
| symbol | VARCHAR | Simbol mata uang |
| decimal_places | INTEGER | Jumlah desimal |
| current_rate | DECIMAL | Nilai tukar saat ini terhadap USD (di-sync terjadwal dari tabel riwayat nilai tukar) |
| is_active | BOOLEAN | Apakah aktif |
| sort_order | INTEGER | Urutan |

#### Tabel Riwayat Nilai Tukar (nb_crm_exchange_rates)

Mencatat data nilai tukar historis, scheduled task akan men-sync nilai tukar terbaru ke `nb_cbo_currencies.current_rate`.

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| currency_code | VARCHAR | Kode mata uang (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Nilai tukar terhadap USD |
| effective_date | DATE | Tanggal berlaku |
| source | VARCHAR | Sumber nilai tukar: manual/api |
| createdAt | TIMESTAMP | Waktu dibuat |

> **Catatan**: Penawaran dihubungkan ke tabel `nb_cbo_currencies` melalui foreign key `currency_id`, nilai tukar diambil langsung dari field `current_rate`. Peluang dan Pesanan menggunakan field VARCHAR `currency` untuk menyimpan kode mata uang.

#### Pola Field Jumlah

Tabel yang berisi jumlah mengikuti pola ini:

| Field | Tipe | Deskripsi |
|-----|------|------|
| currency | VARCHAR | Mata uang transaksi |
| amount | DECIMAL | Jumlah mata uang asli |
| exchange_rate | DECIMAL | Nilai tukar terhadap USD saat transaksi |
| amount_usd | DECIMAL | Ekuivalen USD (dihitung) |

**Diterapkan pada:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integrasi Workflow
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)


**Logika Pengambilan Nilai Tukar:**
1. Saat operasi bisnis, ambil nilai tukar langsung dari `nb_cbo_currencies.current_rate`
2. Transaksi USD: nilai tukar = 1.0, tanpa perlu lookup
3. `current_rate` di-sync oleh scheduled task dari record terbaru `nb_crm_exchange_rates`

### 6.4 Manajemen Versi

Saat Penawaran ditolak atau kedaluwarsa, dapat disalin sebagai versi baru:

```
QT-20260119-001 v1 → Ditolak
QT-20260119-001 v2 → Terkirim
QT-20260119-001 v3 → Diterima
```

---

## 7. Siklus Hidup Pesanan

### 7.1 Ikhtisar Pesanan

Pesanan dibuat saat Penawaran diterima, mewakili komitmen bisnis yang sudah dikonfirmasi.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)


### 7.2 Definisi Status Pesanan

| Status | Kode | Deskripsi | Operasi yang Diizinkan |
|-----|------|------|---------|
| Draft | `draft` | Pesanan dibuat, belum dikonfirmasi | Edit, konfirmasi, batal |
| Dikonfirmasi | `confirmed` | Pesanan dikonfirmasi, menunggu fulfillment | Mulai fulfillment, batal |
| Sedang Diproses | `in_progress` | Pesanan sedang diproses/produksi | Update progress, kirim, batal (perlu approval) |
| Terkirim | `shipped` | Produk sudah dikirim ke Pelanggan | Tandai diterima |
| Diterima | `delivered` | Pelanggan sudah menerima | Selesaikan Pesanan |
| Selesai | `completed` | Pesanan benar-benar selesai | Tidak ada |
| Dibatalkan | `cancelled` | Pesanan dibatalkan | Tidak ada |

### 7.3 Model Data Pesanan

#### nb_crm_orders

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| order_no | VARCHAR | Nomor Pesanan (auto-generated, unique) |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak (FK) |
| opportunity_id | BIGINT | Peluang (FK) |
| quotation_id | BIGINT | Penawaran (FK) |
| owner_id | BIGINT | Penanggung jawab (FK → users) |
| status | VARCHAR | Status Pesanan |
| payment_status | VARCHAR | Status pembayaran: unpaid/partial/paid |
| order_date | DATE | Tanggal Pesanan |
| delivery_date | DATE | Estimasi tanggal pengiriman |
| actual_delivery_date | DATE | Tanggal pengiriman aktual |
| currency | VARCHAR | Mata uang Pesanan |
| exchange_rate | DECIMAL | Nilai tukar terhadap USD |
| order_amount | DECIMAL | Total Pesanan |
| paid_amount | DECIMAL | Jumlah dibayar |
| unpaid_amount | DECIMAL | Jumlah belum dibayar |
| shipping_address | TEXT | Alamat pengiriman |
| logistics_company | VARCHAR | Perusahaan logistik |
| tracking_no | VARCHAR | Nomor pelacakan |
| terms_condition | TEXT | Syarat dan ketentuan |
| description | TEXT | Deskripsi |

#### nb_crm_order_items

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| order_id | FK | Parent Pesanan |
| product_id | FK | Referensi Produk |
| product_name | VARCHAR | Snapshot nama Produk |
| quantity | INT | Jumlah dipesan |
| unit_price | DECIMAL | Harga satuan |
| discount_percent | DECIMAL | Persentase diskon |
| line_total | DECIMAL | Total per item |
| notes | TEXT | Catatan item |

### 7.4 Pelacakan Pembayaran

#### nb_crm_payments

| Field | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Primary key |
| order_id | BIGINT | Pesanan terkait (FK, wajib) |
| customer_id | BIGINT | Pelanggan (FK) |
| payment_no | VARCHAR | Nomor pembayaran (auto-generated, unique) |
| amount | DECIMAL | Jumlah pembayaran (wajib) |
| currency | VARCHAR | Mata uang pembayaran |
| payment_method | VARCHAR | Metode pembayaran: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Tanggal pembayaran |
| bank_account | VARCHAR | Nomor rekening bank |
| bank_name | VARCHAR | Nama bank |
| notes | TEXT | Catatan pembayaran |

---

## 8. Siklus Hidup Pelanggan

### 8.1 Ikhtisar Pelanggan

Pelanggan dibuat saat Lead dikonversi atau Peluang dimenangkan. Sistem melacak siklus hidup lengkap dari akuisisi hingga advocate.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)


### 8.2 Definisi Status Pelanggan

| Status | Kode | Kesehatan | Deskripsi |
|-----|------|--------|------|
| Prospek | `prospect` | Tidak ada | Lead yang dikonversi, belum ada Pesanan |
| Aktif | `active` | ≥70 | Pelanggan berbayar, interaksi baik |
| Berkembang | `growing` | ≥80 | Pelanggan dengan peluang ekspansi |
| Berisiko | `at_risk` | <50 | Pelanggan menunjukkan tanda churn |
| Churn | `churned` | Tidak ada | Pelanggan tidak lagi aktif |
| Win-back | `win_back` | Tidak ada | Mantan Pelanggan yang sedang diaktifkan kembali |
| Advocate | `advocate` | ≥90 | Kepuasan tinggi, memberikan referral |

### 8.3 Skor Kesehatan Pelanggan

Hitung kesehatan Pelanggan berdasarkan beberapa faktor:

| Faktor | Bobot | Indikator |
|-----|------|---------|
| Recency Pembelian | 25% | Hari sejak Pesanan terakhir |
| Frekuensi Pembelian | 20% | Jumlah Pesanan per periode |
| Nilai Moneter | 20% | Total dan rata-rata Pesanan |
| Tingkat Interaksi | 15% | Open rate email, partisipasi meeting |
| Kesehatan Support | 10% | Volume Ticket dan tingkat resolusi |
| Penggunaan Produk | 10% | Indikator penggunaan aktif (jika berlaku) |

**Threshold Kesehatan:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Segmentasi Pelanggan

#### Segmentasi Otomatis

| Segmen | Kondisi | Tindakan yang Disarankan |
|-----|------|---------|
| VIP | Lifetime value > $100K | Layanan VIP, sponsor eksekutif |
| Enterprise | Skala perusahaan > 500 orang | Account manager khusus |
| Mid-size | Skala perusahaan 50-500 orang | Visit berkala, support skala |
| Startup | Skala perusahaan < 50 orang | Sumber daya self-service, komunitas |
| Dorman | 90+ hari tanpa aktivitas | Marketing reaktivasi |

---

## 9. Integrasi Email

### 9.1 Ikhtisar

NocoBase menyediakan plugin integrasi email bawaan, mendukung Gmail dan Outlook. Setelah email disinkronisasi ke sistem, dapat memicu analisis sentimen dan intent email AI secara otomatis melalui Workflow, membantu sales memahami sikap Pelanggan dengan cepat.

### 9.2 Sinkronisasi Email

**Email yang Didukung:**
- Gmail (melalui OAuth 2.0)
- Outlook/Microsoft 365 (melalui OAuth 2.0)

**Perilaku Sinkronisasi:**
- Sinkronisasi dua arah email kirim dan terima
- Otomatis menghubungkan email ke record CRM (Lead, Kontak, Peluang)
- Lampiran disimpan di file system NocoBase

### 9.3 Asosiasi Email-CRM (Akan Disempurnakan)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Template Email

Sales dapat menggunakan Template pre-built:

| Kategori Template | Contoh |
|---------|------|
| Outreach Awal | Cold email, perkenalan hangat, follow-up event |
| Follow-up | Follow-up meeting, follow-up proposal, reminder tanpa balasan |
| Penawaran | Penawaran terlampir, revisi Penawaran, Penawaran akan kedaluwarsa |
| Pesanan | Konfirmasi Pesanan, notifikasi pengiriman, konfirmasi diterima |
| Customer Success | Welcome, follow-up berkala, permintaan review |

---

## 10. Kemampuan Bantuan AI

### 10.1 Tim AI Employee

Sistem CRM mengintegrasikan plugin AI NocoBase, menggunakan ulang AI Employee bawaan berikut, dan mengonfigurasi tugas khusus untuk skenario CRM:

| ID | Nama | Posisi Bawaan | Kemampuan CRM yang Diperluas |
|----|------|---------|-------------|
| viz | Viz | Analis Data | Analisis data penjualan, prediksi pipeline |
| dara | Dara | Ahli Chart | Visualisasi data, pengembangan chart laporan, desain dashboard |
| ellis | Ellis | Editor | Penyusunan balasan email, ringkasan komunikasi, penyusunan email bisnis |
| lexi | Lexi | Penerjemah | Komunikasi Pelanggan multi-bahasa, terjemahan konten |
| orin | Orin | Organizer | Prioritas harian, rekomendasi langkah berikutnya, rencana follow-up |

### 10.2 Daftar Tugas AI

Kemampuan AI dibagi menjadi dua kategori, saling independen:

#### Satu, AI Employee (dipicu oleh Block frontend)

Melalui Block AI Employee frontend, pengguna berinteraksi langsung dengan AI dalam percakapan, mendapatkan analisis dan rekomendasi.

| Employee | Tugas | Deskripsi |
|------|------|------|
| Viz | Analisis data penjualan | Analisis tren pipeline, conversion rate |
| Viz | Prediksi pipeline | Prediksi pendapatan berdasarkan pipeline berbobot |
| Dara | Generate chart | Generate chart laporan penjualan |
| Dara | Desain dashboard | Desain layout dashboard data |
| Ellis | Penyusunan balasan | Generate balasan email profesional |
| Ellis | Ringkasan komunikasi | Ringkas thread email |
| Ellis | Penyusunan email bisnis | Email undangan meeting, follow-up, ucapan terima kasih, dll. |
| Orin | Prioritas harian | Generate daftar tugas prioritas hari ini |
| Orin | Rekomendasi langkah berikutnya | Rekomendasi tindakan berikutnya untuk setiap Peluang |
| Lexi | Terjemahan konten | Terjemahkan materi marketing, proposal, email |

#### Dua, Node LLM Workflow (eksekusi otomatis backend)

Node LLM yang ter-nest dalam Workflow, dipicu otomatis melalui event tabel data, event Action, scheduled task, dll., tidak terkait dengan AI Employee.

| Tugas | Cara Pemicu | Deskripsi | Field Tulis |
|------|---------|------|---------|
| Skoring Lead | Event tabel data (create/update) | Evaluasi kualitas Lead | ai_score, ai_convert_prob |
| Prediksi probabilitas menang | Event tabel data (perubahan tahap) | Prediksi kemungkinan sukses Peluang | ai_win_probability, ai_risk_factors |

> **Catatan**: Node LLM Workflow menggunakan prompt dan Schema untuk output JSON terstruktur, di-parse lalu ditulis ke field data bisnis, tanpa intervensi pengguna.

### 10.3 Field AI di Database

| Tabel | Field AI | Deskripsi |
|----|--------|------|
| nb_crm_leads | ai_score | Skor AI 0-100 |
| | ai_convert_prob | Probabilitas konversi |
| | ai_best_contact_time | Waktu kontak terbaik |
| | ai_tags | Tag yang dihasilkan AI (JSONB) |
| | ai_scored_at | Waktu skoring |
| | ai_next_best_action | Rekomendasi langkah terbaik berikutnya |
| | ai_nba_generated_at | Waktu rekomendasi dihasilkan |
| nb_crm_opportunities | ai_win_probability | Prediksi probabilitas menang AI |
| | ai_analyzed_at | Waktu analisis |
| | ai_confidence | Tingkat kepercayaan prediksi |
| | ai_trend | Tren: up/stable/down |
| | ai_risk_factors | Faktor risiko (JSONB) |
| | ai_recommendations | Daftar rekomendasi (JSONB) |
| | ai_predicted_close | Tanggal closing prediksi |
| | ai_next_best_action | Rekomendasi langkah terbaik berikutnya |
| | ai_nba_generated_at | Waktu rekomendasi dihasilkan |
| nb_crm_customers | ai_health_score | Skor kesehatan 0-100 |
| | ai_health_grade | Tingkat kesehatan: A/B/C/D |
| | ai_churn_risk | Risiko churn 0-100% |
| | ai_churn_risk_level | Tingkat risiko churn: low/medium/high |
| | ai_health_dimensions | Skor setiap dimensi (JSONB) |
| | ai_recommendations | Daftar rekomendasi (JSONB) |
| | ai_health_assessed_at | Waktu penilaian kesehatan |
| | ai_tags | Tag yang dihasilkan AI (JSONB) |
| | ai_best_contact_time | Waktu kontak terbaik |
| | ai_next_best_action | Rekomendasi langkah terbaik berikutnya |
| | ai_nba_generated_at | Waktu rekomendasi dihasilkan |

---

## 11. Engine Workflow

### 11.1 Workflow yang Sudah Diimplementasikan

| Nama Workflow | Tipe Trigger | Status | Deskripsi |
|-----------|---------|------|------|
| Leads Created | Event tabel data | Aktif | Dipicu saat Lead dibuat |
| CRM Overall Analytics | Event AI Employee | Aktif | Analisis data CRM keseluruhan |
| Lead Conversion | Event setelah Action | Aktif | Alur konversi Lead |
| Lead Assignment | Event tabel data | Aktif | Penugasan Lead otomatis |
| Lead Scoring | Event tabel data | Disable | Skoring Lead (akan disempurnakan) |
| Follow-up Reminder | Scheduled task | Disable | Reminder follow-up (akan disempurnakan) |

### 11.2 Workflow yang Akan Diimplementasikan

| Workflow | Tipe Trigger | Deskripsi |
|-------|---------|------|
| Peningkatan tahap Peluang | Event tabel data | Update probabilitas menang dan catat waktu saat tahap berubah |
| Deteksi stagnasi Peluang | Scheduled task | Mendeteksi Peluang tanpa aktivitas, kirim reminder |
| Persetujuan Penawaran | Event setelah Action | Alur persetujuan multi-level |
| Generate Pesanan | Event setelah Action | Generate Pesanan otomatis setelah Penawaran diterima |

---

## 12. Desain Menu dan Antarmuka

### 12.1 Struktur Backend Admin

| Menu | Tipe | Deskripsi |
|------|------|------|
| **Dashboards** | Group | Dashboard |
| - Dashboard | Page | Dashboard default |
| - SalesManager | Page | Tampilan Manajer Penjualan |
| - SalesRep | Page | Tampilan Tenaga Penjualan |
| - Executive | Page | Tampilan Eksekutif |
| **Leads** | Page | Manajemen Lead |
| **Customers** | Page | Manajemen Pelanggan |
| **Opportunities** | Page | Manajemen Peluang |
| - Table | Tab | Daftar Peluang |
| **Products** | Page | Manajemen Produk |
| - Categories | Tab | Kategori Produk |
| **Orders** | Page | Manajemen Pesanan |
| **Settings** | Group | Pengaturan |
| - Stage Settings | Page | Konfigurasi tahap Peluang |
| - Exchange Rate | Page | Pengaturan nilai tukar |
| - Activity | Page | Riwayat aktivitas |
| - Emails | Page | Manajemen email |
| - Contacts | Page | Manajemen Kontak |
| - Data Analysis | Page | Analisis data |

### 12.2 Tampilan Dashboard

#### Tampilan Manajer Penjualan

| Komponen | Tipe | Data |
|-----|------|------|
| Nilai Pipeline | KPI Card | Total pipeline per tahap |
| Leaderboard Tim | Tabel | Ranking performa rep |
| Peringatan Risiko | Daftar Peringatan | Peluang risiko tinggi |
| Tren Probabilitas Menang | Line Chart | Probabilitas menang bulanan |
| Transaksi Stagnan | Daftar | Transaksi yang perlu perhatian |

#### Tampilan Tenaga Penjualan

| Komponen | Tipe | Data |
|-----|------|------|
| Progress Quota Saya | Progress Bar | Aktual bulanan vs Quota |
| Peluang Pending | KPI Card | Jumlah Peluang pending saya |
| Akan Closing Minggu Ini | Daftar | Transaksi yang akan closing |
| Aktivitas Lewat Tenggat | Peringatan | Tugas overdue |
| Action Cepat | Tombol | Catat aktivitas, buat Peluang |

#### Tampilan Eksekutif

| Komponen | Tipe | Data |
|-----|------|------|
| Pendapatan Tahunan | KPI Card | Pendapatan year-to-date |
| Nilai Pipeline | KPI Card | Total pipeline |
| Win Rate | KPI Card | Win rate keseluruhan |
| Kesehatan Pelanggan | Distribution Chart | Distribusi skor kesehatan |
| Forecast | Chart | Prediksi pendapatan bulanan |


---

*Versi dokumen: v2.0 | Tanggal pembaruan: 2026-02-06*
