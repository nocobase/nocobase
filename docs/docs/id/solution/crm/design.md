:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/solution/crm/design).
:::

# Desain Detail Sistem CRM 2.0

## 1. Ikhtisar Sistem dan Filosofi Desain

### 1.1 Penempatan Sistem

Sistem ini adalah **Platform Manajemen Penjualan CRM 2.0** yang dibangun di atas platform tanpa kode NocoBase. Tujuan utamanya adalah:

```
Membiarkan tim penjualan fokus pada membangun hubungan pelanggan, bukan pada entri data dan analisis yang berulang.
```

Sistem ini mengotomatiskan tugas-tugas rutin melalui alur kerja dan menggunakan bantuan AI untuk menyelesaikan penilaian lead, analisis peluang, dan pekerjaan lainnya, membantu tim penjualan meningkatkan efisiensi.

### 1.2 Filosofi Desain

#### Filosofi 1: Corong Penjualan yang Lengkap

**Proses Penjualan End-to-End:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Mengapa didesain seperti ini?**

| Metode Tradisional | CRM Terintegrasi |
|---------|-----------|
| Menggunakan beberapa sistem untuk tahap yang berbeda | Sistem tunggal yang mencakup seluruh siklus hidup |
| Transfer data manual antar sistem | Aliran dan konversi data otomatis |
| Tampilan pelanggan yang tidak konsisten | Tampilan pelanggan 360 derajat yang terpadu |
| Analisis data yang terfragmentasi | Analisis pipeline penjualan end-to-end |

#### Filosofi 2: Pipeline Penjualan yang Dapat Dikonfigurasi
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Industri yang berbeda dapat menyesuaikan tahap pipeline penjualan tanpa perlu mengubah kode.

#### Filosofi 3: Desain Modular

- Modul inti (Pelanggan + Peluang) bersifat wajib, modul lain dapat diaktifkan sesuai kebutuhan.
- Menonaktifkan modul tidak memerlukan perubahan kode, cukup melalui konfigurasi antarmuka NocoBase.
- Setiap modul didesain secara independen untuk mengurangi ketergantungan antar modul (coupling).

---

## 2. Arsitektur Modul dan Kustomisasi

### 2.1 Ikhtisar Modul

Sistem CRM mengadopsi desain **arsitektur modular**—setiap modul dapat diaktifkan atau dinonaktifkan secara independen sesuai dengan kebutuhan bisnis.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Ketergantungan Modul

| Modul | Apakah Wajib | Ketergantungan | Kondisi Penonaktifan |
|-----|---------|--------|---------|
| **Manajemen Pelanggan** | ✅ Ya | - | Tidak dapat dinonaktifkan (Inti) |
| **Manajemen Peluang** | ✅ Ya | Manajemen Pelanggan | Tidak dapat dinonaktifkan (Inti) |
| **Manajemen Lead** | Opsional | - | Saat akuisisi lead tidak diperlukan |
| **Manajemen Penawaran** | Opsional | Peluang, Produk | Transaksi sederhana tanpa penawaran formal |
| **Manajemen Pesanan** | Opsional | Peluang (atau Penawaran) | Saat pelacakan pesanan/pembayaran tidak diperlukan |
| **Manajemen Produk** | Opsional | - | Saat katalog produk tidak diperlukan |
| **Integrasi Email** | Opsional | Pelanggan, Kontak | Saat menggunakan sistem email eksternal |

### 2.3 Versi Pra-konfigurasi

| Versi | Modul yang Disertakan | Skenario Penggunaan | Jumlah Koleksi |
|-----|---------|---------|-----------|
| **Versi Ringan (Lite)** | Pelanggan + Peluang | Pelacakan transaksi sederhana | 6 |
| **Versi Standar** | Versi Ringan + Lead + Penawaran + Pesanan + Produk | Siklus penjualan lengkap | 15 |
| **Versi Perusahaan** | Versi Standar + Integrasi Email | Fitur lengkap termasuk email | 17 |

### 2.4 Pemetaan Modul ke Koleksi

#### Koleksi Modul Inti (Selalu Diperlukan)

| Koleksi | Modul | Deskripsi |
|-------|------|------|
| nb_crm_customers | Manajemen Pelanggan | Catatan Pelanggan/Perusahaan |
| nb_crm_contacts | Manajemen Pelanggan | Kontak |
| nb_crm_customer_shares | Manajemen Pelanggan | Izin berbagi pelanggan |
| nb_crm_opportunities | Manajemen Peluang | Peluang Penjualan |
| nb_crm_opportunity_stages | Manajemen Peluang | Konfigurasi tahap |
| nb_crm_opportunity_users | Manajemen Peluang | Kolaborator peluang |
| nb_crm_activities | Manajemen Aktivitas | Catatan aktivitas |
| nb_crm_comments | Manajemen Aktivitas | Komentar/Catatan |
| nb_crm_tags | Inti | Label bersama |
| nb_cbo_currencies | Data Dasar | Kamus mata uang |
| nb_cbo_regions | Data Dasar | Kamus negara/wilayah |

### 2.5 Cara Menonaktifkan Modul

Cukup sembunyikan entri menu modul tersebut di latar belakang administrasi NocoBase, tanpa perlu mengubah kode atau menghapus koleksi data.

---

## 3. Entitas Inti dan Model Data

### 3.1 Ikhtisar Hubungan Entitas
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Detail Koleksi Inti

#### 3.2.1 Tabel Lead (nb_crm_leads)

Manajemen lead menggunakan alur kerja 4 tahap yang disederhanakan.

**Proses Tahap:**
```
Baru → Sedang Dikerjakan → Terverifikasi → Dikonversi menjadi Pelanggan/Peluang
         ↓                    ↓
Tidak Memenuhi Syarat   Tidak Memenuhi Syarat
```

**Bidang Kunci:**

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama (Primary Key) |
| lead_no | VARCHAR | Nomor Lead (Dihasilkan otomatis) |
| name | VARCHAR | Nama Kontak |
| company | VARCHAR | Nama Perusahaan |
| title | VARCHAR | Jabatan |
| email | VARCHAR | Email |
| phone | VARCHAR | Telepon |
| mobile_phone | VARCHAR | Ponsel |
| website | TEXT | Situs Web |
| address | TEXT | Alamat |
| source | VARCHAR | Sumber Lead: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Industri |
| annual_revenue | VARCHAR | Skala Pendapatan Tahunan |
| number_of_employees | VARCHAR | Skala Jumlah Karyawan |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Penilaian: hot/warm/cold |
| owner_id | BIGINT | Penanggung Jawab (FK → users) |
| ai_score | INTEGER | Skor Kualitas AI 0-100 |
| ai_convert_prob | DECIMAL | Probabilitas Konversi AI |
| ai_best_contact_time | VARCHAR | Waktu Kontak Direkomendasikan AI |
| ai_tags | JSONB | Label yang Dihasilkan AI |
| ai_scored_at | TIMESTAMP | Waktu Penilaian AI |
| ai_next_best_action | TEXT | Saran Tindakan Terbaik Selanjutnya dari AI |
| ai_nba_generated_at | TIMESTAMP | Waktu Pembuatan Saran AI |
| is_converted | BOOLEAN | Penanda Sudah Dikonversi |
| converted_at | TIMESTAMP | Waktu Konversi |
| converted_customer_id | BIGINT | ID Pelanggan Hasil Konversi |
| converted_contact_id | BIGINT | ID Kontak Hasil Konversi |
| converted_opportunity_id | BIGINT | ID Peluang Hasil Konversi |
| lost_reason | TEXT | Alasan Hilang |
| disqualification_reason | TEXT | Alasan Tidak Memenuhi Syarat |
| description | TEXT | Deskripsi |

#### 3.2.2 Tabel Pelanggan (nb_crm_customers)

Mendukung manajemen pelanggan/perusahaan untuk bisnis perdagangan luar negeri.

**Bidang Kunci:**

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| name | VARCHAR | Nama Pelanggan (Wajib) |
| account_number | VARCHAR | Nomor Pelanggan (Otomatis, Unik) |
| phone | VARCHAR | Telepon |
| website | TEXT | Situs Web |
| address | TEXT | Alamat |
| industry | VARCHAR | Industri |
| type | VARCHAR | Tipe: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Skala Jumlah Karyawan |
| annual_revenue | VARCHAR | Skala Pendapatan Tahunan |
| level | VARCHAR | Tingkat: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | Negara |
| region_id | BIGINT | Wilayah (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Mata Uang Pilihan: CNY/USD/EUR |
| owner_id | BIGINT | Penanggung Jawab (FK → users) |
| parent_id | BIGINT | Perusahaan Induk (FK → self) |
| source_lead_id | BIGINT | ID Lead Sumber |
| ai_health_score | INTEGER | Skor Kesehatan AI 0-100 |
| ai_health_grade | VARCHAR | Tingkat Kesehatan AI: A/B/C/D |
| ai_churn_risk | DECIMAL | Risiko Kehilangan AI 0-100% |
| ai_churn_risk_level | VARCHAR | Tingkat Risiko Kehilangan AI: low/medium/high |
| ai_health_dimensions | JSONB | Skor Dimensi Kesehatan AI |
| ai_recommendations | JSONB | Daftar Saran AI |
| ai_health_assessed_at | TIMESTAMP | Waktu Penilaian Kesehatan AI |
| ai_tags | JSONB | Label yang Dihasilkan AI |
| ai_best_contact_time | VARCHAR | Waktu Kontak Direkomendasikan AI |
| ai_next_best_action | TEXT | Saran Tindakan Terbaik Selanjutnya dari AI |
| ai_nba_generated_at | TIMESTAMP | Waktu Pembuatan Saran AI |
| description | TEXT | Deskripsi |
| is_deleted | BOOLEAN | Penanda Penghapusan Lunak |

#### 3.2.3 Tabel Peluang (nb_crm_opportunities)

Manajemen peluang penjualan dengan tahap pipeline yang dapat dikonfigurasi.

**Bidang Kunci:**

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| opportunity_no | VARCHAR | Nomor Peluang (Otomatis, Unik) |
| name | VARCHAR | Nama Peluang (Wajib) |
| amount | DECIMAL | Jumlah yang Diharapkan |
| currency | VARCHAR | Mata Uang |
| exchange_rate | DECIMAL | Nilai Tukar |
| amount_usd | DECIMAL | Jumlah Setara USD |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak Utama (FK) |
| stage | VARCHAR | Kode Tahap (FK → stages.code) |
| stage_sort | INTEGER | Urutan Tahap (Redundan, untuk kemudahan pengurutan) |
| stage_entered_at | TIMESTAMP | Waktu Masuk Tahap Saat Ini |
| days_in_stage | INTEGER | Jumlah Hari di Tahap Saat Ini |
| win_probability | DECIMAL | Tingkat Kemenangan Manual |
| ai_win_probability | DECIMAL | Prediksi Tingkat Kemenangan AI |
| ai_analyzed_at | TIMESTAMP | Waktu Analisis AI |
| ai_confidence | DECIMAL | Kepercayaan Prediksi AI |
| ai_trend | VARCHAR | Tren Prediksi AI: up/stable/down |
| ai_risk_factors | JSONB | Faktor Risiko yang Diidentifikasi AI |
| ai_recommendations | JSONB | Daftar Saran AI |
| ai_predicted_close | DATE | Prediksi Tanggal Penutupan AI |
| ai_next_best_action | TEXT | Saran Tindakan Terbaik Selanjutnya dari AI |
| ai_nba_generated_at | TIMESTAMP | Waktu Pembuatan Saran AI |
| expected_close_date | DATE | Perkiraan Tanggal Penutupan |
| actual_close_date | DATE | Tanggal Penutupan Aktual |
| owner_id | BIGINT | Penanggung Jawab (FK → users) |
| last_activity_at | TIMESTAMP | Waktu Aktivitas Terakhir |
| stagnant_days | INTEGER | Jumlah Hari Tanpa Aktivitas |
| loss_reason | TEXT | Alasan Gagal |
| competitor_id | BIGINT | Kompetitor (FK) |
| lead_source | VARCHAR | Sumber Lead |
| campaign_id | BIGINT | ID Kampanye Pemasaran |
| expected_revenue | DECIMAL | Pendapatan yang Diharapkan = amount × probability |
| description | TEXT | Deskripsi |

#### 3.2.4 Tabel Penawaran (nb_crm_quotations)

Manajemen penawaran yang mendukung multi-mata uang dan alur kerja persetujuan.

**Proses Status:**
```
Draf → Menunggu Persetujuan → Disetujui → Dikirim → Diterima/Ditolak/Kedaluwarsa
              ↓
           Ditolak → Ubah → Draf
```

**Bidang Kunci:**

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| quotation_no | VARCHAR | Nomor Penawaran (Otomatis, Unik) |
| name | VARCHAR | Nama Penawaran |
| version | INTEGER | Nomor Versi |
| opportunity_id | BIGINT | Peluang (FK, Wajib) |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak (FK) |
| owner_id | BIGINT | Penanggung Jawab (FK → users) |
| currency_id | BIGINT | Mata Uang (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Nilai Tukar |
| subtotal | DECIMAL | Subtotal |
| discount_rate | DECIMAL | Tingkat Diskon |
| discount_amount | DECIMAL | Jumlah Diskon |
| shipping_handling | DECIMAL | Biaya Pengiriman/Penanganan |
| tax_rate | DECIMAL | Tingkat Pajak |
| tax_amount | DECIMAL | Jumlah Pajak |
| total_amount | DECIMAL | Total Jumlah |
| total_amount_usd | DECIMAL | Jumlah Setara USD |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Waktu Pengajuan |
| approved_by | BIGINT | Penyetuju (FK → users) |
| approved_at | TIMESTAMP | Waktu Persetujuan |
| rejected_at | TIMESTAMP | Waktu Penolakan |
| sent_at | TIMESTAMP | Waktu Pengiriman |
| customer_response_at | TIMESTAMP | Waktu Respon Pelanggan |
| expired_at | TIMESTAMP | Waktu Kedaluwarsa |
| valid_until | DATE | Berlaku Hingga |
| payment_terms | TEXT | Syarat Pembayaran |
| terms_condition | TEXT | Syarat dan Ketentuan |
| address | TEXT | Alamat Pengiriman |
| description | TEXT | Deskripsi |

#### 3.2.5 Tabel Pesanan (nb_crm_orders)

Manajemen pesanan termasuk pelacakan pembayaran.

**Bidang Kunci:**

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| order_no | VARCHAR | Nomor Pesanan (Otomatis, Unik) |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak (FK) |
| opportunity_id | BIGINT | Peluang (FK) |
| quotation_id | BIGINT | Penawaran (FK) |
| owner_id | BIGINT | Penanggung Jawab (FK → users) |
| currency | VARCHAR | Mata Uang |
| exchange_rate | DECIMAL | Nilai Tukar |
| order_amount | DECIMAL | Jumlah Pesanan |
| paid_amount | DECIMAL | Jumlah yang Sudah Dibayar |
| unpaid_amount | DECIMAL | Jumlah yang Belum Dibayar |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Status Pembayaran: unpaid/partial/paid |
| order_date | DATE | Tanggal Pesanan |
| delivery_date | DATE | Perkiraan Tanggal Pengiriman |
| actual_delivery_date | DATE | Tanggal Pengiriman Aktual |
| shipping_address | TEXT | Alamat Pengiriman |
| logistics_company | VARCHAR | Perusahaan Logistik |
| tracking_no | VARCHAR | Nomor Resi |
| terms_condition | TEXT | Syarat dan Ketentuan |
| description | TEXT | Deskripsi |

### 3.3 Ringkasan Koleksi Data

#### Koleksi Bisnis CRM

| No. | Nama Koleksi | Deskripsi | Tipe |
|-----|------|------|------|
| 1 | nb_crm_leads | Manajemen Lead | Bisnis |
| 2 | nb_crm_customers | Pelanggan/Perusahaan | Bisnis |
| 3 | nb_crm_contacts | Kontak | Bisnis |
| 4 | nb_crm_opportunities | Peluang Penjualan | Bisnis |
| 5 | nb_crm_opportunity_stages | Konfigurasi Tahap | Konfigurasi |
| 6 | nb_crm_opportunity_users | Kolaborator Peluang (Tim Penjualan) | Relasi |
| 7 | nb_crm_quotations | Penawaran Harga | Bisnis |
| 8 | nb_crm_quotation_items | Detail Penawaran | Bisnis |
| 9 | nb_crm_quotation_approvals | Catatan Persetujuan | Bisnis |
| 10 | nb_crm_orders | Pesanan | Bisnis |
| 11 | nb_crm_order_items | Detail Pesanan | Bisnis |
| 12 | nb_crm_payments | Catatan Pembayaran | Bisnis |
| 13 | nb_crm_products | Katalog Produk | Bisnis |
| 14 | nb_crm_product_categories | Kategori Produk | Konfigurasi |
| 15 | nb_crm_price_tiers | Penetapan Harga Berjenjang | Konfigurasi |
| 16 | nb_crm_activities | Catatan Aktivitas | Bisnis |
| 17 | nb_crm_comments | Komentar/Catatan | Bisnis |
| 18 | nb_crm_competitors | Kompetitor | Bisnis |
| 19 | nb_crm_tags | Label | Konfigurasi |
| 20 | nb_crm_lead_tags | Relasi Lead-Label | Relasi |
| 21 | nb_crm_contact_tags | Relasi Kontak-Label | Relasi |
| 22 | nb_crm_customer_shares | Izin Berbagi Pelanggan | Relasi |
| 23 | nb_crm_exchange_rates | Riwayat Nilai Tukar | Konfigurasi |

#### Koleksi Data Dasar (Modul Publik)

| No. | Nama Koleksi | Deskripsi | Tipe |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Kamus Mata Uang | Konfigurasi |
| 2 | nb_cbo_regions | Kamus Negara/Wilayah | Konfigurasi |

### 3.4 Tabel Pendukung

#### 3.4.1 Tabel Komentar (nb_crm_comments)

Tabel komentar/catatan umum yang dapat dikaitkan dengan berbagai objek bisnis.

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| content | TEXT | Isi Komentar |
| lead_id | BIGINT | Lead Terkait (FK) |
| customer_id | BIGINT | Pelanggan Terkait (FK) |
| opportunity_id | BIGINT | Peluang Terkait (FK) |
| order_id | BIGINT | Pesanan Terkait (FK) |

#### 3.4.2 Tabel Berbagi Pelanggan (nb_crm_customer_shares)

Mengimplementasikan kolaborasi multi-orang dan berbagi izin untuk pelanggan.

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| customer_id | BIGINT | Pelanggan (FK, Wajib) |
| shared_with_user_id | BIGINT | Pengguna yang Diberi Akses (FK, Wajib) |
| shared_by_user_id | BIGINT | Pemrakarsa Berbagi (FK) |
| permission_level | VARCHAR | Tingkat Izin: read/write/full |
| shared_at | TIMESTAMP | Waktu Berbagi |

#### 3.4.3 Tabel Kolaborator Peluang (nb_crm_opportunity_users)

Mendukung kolaborasi tim penjualan pada peluang bisnis.

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| opportunity_id | BIGINT | Peluang (FK, Kunci Utama Gabungan) |
| user_id | BIGINT | Pengguna (FK, Kunci Utama Gabungan) |
| role | VARCHAR | Peran: owner/collaborator/viewer |

#### 3.4.4 Tabel Wilayah (nb_cbo_regions)

Kamus data dasar negara/wilayah.

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| code_alpha2 | VARCHAR | Kode Dua Huruf ISO 3166-1 (Unik) |
| code_alpha3 | VARCHAR | Kode Tiga Huruf ISO 3166-1 (Unik) |
| code_numeric | VARCHAR | Kode Numerik ISO 3166-1 |
| name | VARCHAR | Nama Negara/Wilayah |
| is_active | BOOLEAN | Apakah Aktif |
| sort_order | INTEGER | Urutan |

---

## 4. Siklus Hidup Lead

Manajemen lead menggunakan alur kerja 4 tahap yang disederhanakan. Saat lead baru dibuat, alur kerja dapat secara otomatis memicu penilaian AI untuk membantu tim penjualan mengidentifikasi lead berkualitas tinggi dengan cepat.

### 4.1 Definisi Status

| Status | Nama | Deskripsi |
|-----|------|------|
| new | Baru | Baru dibuat, menunggu untuk dihubungi |
| working | Sedang Dikerjakan | Sedang ditindaklanjuti secara aktif |
| qualified | Terverifikasi | Siap untuk dikonversi |
| unqualified | Tidak Memenuhi Syarat | Tidak cocok |

### 4.2 Diagram Alir Status

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Proses Konversi Lead

Antarmuka konversi menyediakan tiga opsi secara bersamaan, pengguna dapat memilih untuk membuat atau mengaitkan:

- **Pelanggan**: Buat pelanggan baru ATAU kaitkan dengan pelanggan yang sudah ada.
- **Kontak**: Buat kontak baru (dikaitkan dengan pelanggan).
- **Peluang**: Harus membuat peluang bisnis.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Catatan Setelah Konversi:**
- `converted_customer_id`: ID Pelanggan yang dikaitkan
- `converted_contact_id`: ID Kontak yang dikaitkan
- `converted_opportunity_id`: ID Peluang yang dibuat

---

## 5. Siklus Hidup Peluang

Manajemen peluang menggunakan tahap pipeline penjualan yang dapat dikonfigurasi. Saat tahap peluang berubah, prediksi tingkat kemenangan AI dapat dipicu secara otomatis untuk membantu tim penjualan mengidentifikasi risiko dan peluang.

### 5.1 Tahap yang Dapat Dikonfigurasi

Tahap disimpan dalam tabel `nb_crm_opportunity_stages` dan dapat disesuaikan:

| Kode | Nama | Urutan | Tingkat Kemenangan Default |
|-----|------|------|---------|
| prospecting | Prospeksi | 1 | 10% |
| analysis | Analisis Kebutuhan | 2 | 30% |
| proposal | Pengajuan Proposal | 3 | 60% |
| negotiation | Negosiasi Bisnis | 4 | 80% |
| won | Berhasil Menang | 5 | 100% |
| lost | Gagal/Hilang | 6 | 0% |

### 5.2 Alur Pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Deteksi Stagnasi

Peluang tanpa aktivitas akan ditandai:

| Hari Tanpa Aktivitas | Tindakan |
|-----------|------|
| 7 Hari | Peringatan Kuning |
| 14 Hari | Pengingat Oranye kepada Penanggung Jawab |
| 30 Hari | Pengingat Merah kepada Manajer |

```sql
-- Menghitung hari stagnasi
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Penanganan Menang/Gagal

**Saat Menang:**
1. Perbarui tahap menjadi 'won'
2. Catat tanggal penutupan aktual
3. Perbarui status pelanggan menjadi 'active'
4. Pemicu pembuatan pesanan (jika penawaran diterima)

**Saat Gagal:**
1. Perbarui tahap menjadi 'lost'
2. Catat alasan gagal
3. Catat ID kompetitor (jika kalah dari kompetitor)
4. Beri tahu manajer

---

## 6. Siklus Hidup Penawaran

### 6.1 Definisi Status

| Status | Nama | Deskripsi |
|-----|------|------|
| draft | Draf | Sedang dipersiapkan |
| pending_approval | Menunggu Persetujuan | Menunggu persetujuan |
| approved | Disetujui | Dapat dikirim |
| sent | Dikirim | Sudah dikirim ke pelanggan |
| accepted | Diterima | Pelanggan telah menerima |
| rejected | Ditolak | Pelanggan telah menolak |
| expired | Kedaluwarsa | Melewati masa berlaku |

### 6.2 Aturan Persetujuan (Akan Disempurnakan)

Alur kerja persetujuan dipicu berdasarkan kondisi berikut:

| Kondisi | Tingkat Persetujuan |
|------|---------|
| Diskon > 10% | Manajer Penjualan |
| Diskon > 20% | Direktur Penjualan |
| Jumlah > $100K | Keuangan + Direktur Utama |

### 6.3 Dukungan Multi-mata Uang

#### Filosofi Desain

Menggunakan **USD sebagai mata uang dasar tunggal** untuk semua laporan dan analisis. Setiap catatan jumlah menyimpan:
- Mata uang dan jumlah asli (yang dilihat pelanggan)
- Nilai tukar pada saat transaksi
- Jumlah setara USD (untuk perbandingan internal)

#### Kamus Mata Uang (nb_cbo_currencies)

Konfigurasi mata uang menggunakan tabel data dasar publik, mendukung manajemen dinamis. Bidang `current_rate` menyimpan nilai tukar saat ini, yang diperbarui oleh tugas terjadwal dari catatan terbaru di `nb_crm_exchange_rates`.

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| code | VARCHAR | Kode Mata Uang (Unik): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Nama Mata Uang |
| symbol | VARCHAR | Simbol Mata Uang |
| decimal_places | INTEGER | Jumlah Desimal |
| current_rate | DECIMAL | Nilai Tukar Saat Ini terhadap USD (Sinkronisasi dari riwayat) |
| is_active | BOOLEAN | Apakah Aktif |
| sort_order | INTEGER | Urutan |

#### Riwayat Nilai Tukar (nb_crm_exchange_rates)

Mencatat data riwayat nilai tukar, tugas terjadwal akan menyinkronkan nilai tukar terbaru ke `nb_cbo_currencies.current_rate`.

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| currency_code | VARCHAR | Kode Mata Uang (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Nilai Tukar terhadap USD |
| effective_date | DATE | Tanggal Berlaku |
| source | VARCHAR | Sumber Nilai Tukar: manual/api |
| createdAt | TIMESTAMP | Waktu Pembuatan |

> **Catatan**: Penawaran dikaitkan dengan tabel `nb_cbo_currencies` melalui kunci asing `currency_id`, nilai tukar diambil langsung dari bidang `current_rate`. Peluang dan pesanan menggunakan bidang VARCHAR `currency` untuk menyimpan kode mata uang.

#### Pola Bidang Jumlah

Tabel yang berisi jumlah mengikuti pola ini:

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| currency | VARCHAR | Mata Uang Transaksi |
| amount | DECIMAL | Jumlah Mata Uang Asli |
| exchange_rate | DECIMAL | Nilai Tukar terhadap USD saat transaksi |
| amount_usd | DECIMAL | Setara USD (Dihitung) |

**Diterapkan pada:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integrasi Alur Kerja
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logika Pengambilan Nilai Tukar:**
1. Saat operasi bisnis, ambil nilai tukar langsung dari `nb_cbo_currencies.current_rate`.
2. Transaksi USD: Nilai tukar = 1.0, tidak perlu pencarian.
3. `current_rate` disinkronkan oleh tugas terjadwal dari catatan terbaru `nb_crm_exchange_rates`.

### 6.4 Manajemen Versi

Saat penawaran ditolak atau kedaluwarsa, penawaran tersebut dapat disalin sebagai versi baru:

```
QT-20260119-001 v1 → Ditolak
QT-20260119-001 v2 → Dikirim
QT-20260119-001 v3 → Diterima
```

---

## 7. Siklus Hidup Pesanan

### 7.1 Ikhtisar Pesanan

Pesanan dibuat saat penawaran diterima, mewakili komitmen bisnis yang telah dikonfirmasi.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Definisi Status Pesanan

| Status | Kode | Deskripsi | Tindakan yang Diizinkan |
|-----|------|------|---------|
| Draf | `draft` | Pesanan dibuat, belum dikonfirmasi | Edit, Konfirmasi, Batalkan |
| Dikonfirmasi | `confirmed` | Pesanan dikonfirmasi, menunggu pemenuhan | Mulai Pemenuhan, Batalkan |
| Dalam Proses | `in_progress` | Pesanan sedang diproses/diproduksi | Perbarui Progres, Kirim, Batalkan (perlu persetujuan) |
| Dikirim | `shipped` | Produk telah dikirim ke pelanggan | Tandai Terkirim |
| Terkirim | `delivered` | Pelanggan telah menerima barang | Selesaikan Pesanan |
| Selesai | `completed` | Pesanan selesai sepenuhnya | Tidak ada |
| Dibatalkan | `cancelled` | Pesanan dibatalkan | Tidak ada |

### 7.3 Model Data Pesanan

#### nb_crm_orders

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| order_no | VARCHAR | Nomor Pesanan (Otomatis, Unik) |
| customer_id | BIGINT | Pelanggan (FK) |
| contact_id | BIGINT | Kontak (FK) |
| opportunity_id | BIGINT | Peluang (FK) |
| quotation_id | BIGINT | Penawaran (FK) |
| owner_id | BIGINT | Penanggung Jawab (FK → users) |
| status | VARCHAR | Status Pesanan |
| payment_status | VARCHAR | Status Pembayaran: unpaid/partial/paid |
| order_date | DATE | Tanggal Pesanan |
| delivery_date | DATE | Perkiraan Tanggal Pengiriman |
| actual_delivery_date | DATE | Tanggal Pengiriman Aktual |
| currency | VARCHAR | Mata Uang Pesanan |
| exchange_rate | DECIMAL | Nilai Tukar terhadap USD |
| order_amount | DECIMAL | Total Jumlah Pesanan |
| paid_amount | DECIMAL | Jumlah yang Sudah Dibayar |
| unpaid_amount | DECIMAL | Jumlah yang Belum Dibayar |
| shipping_address | TEXT | Alamat Pengiriman |
| logistics_company | VARCHAR | Perusahaan Logistik |
| tracking_no | VARCHAR | Nomor Resi |
| terms_condition | TEXT | Syarat dan Ketentuan |
| description | TEXT | Deskripsi |

#### nb_crm_order_items

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| order_id | FK | Pesanan Induk |
| product_id | FK | Referensi Produk |
| product_name | VARCHAR | Snapshot Nama Produk |
| quantity | INT | Jumlah yang Dipesan |
| unit_price | DECIMAL | Harga Satuan |
| discount_percent | DECIMAL | Persentase Diskon |
| line_total | DECIMAL | Total Item Baris |
| notes | TEXT | Catatan Item Baris |

### 7.4 Pelacakan Pembayaran

#### nb_crm_payments

| Bidang | Tipe | Deskripsi |
|-----|------|------|
| id | BIGINT | Kunci Utama |
| order_id | BIGINT | Pesanan Terkait (FK, Wajib) |
| customer_id | BIGINT | Pelanggan (FK) |
| payment_no | VARCHAR | Nomor Pembayaran (Otomatis, Unik) |
| amount | DECIMAL | Jumlah Pembayaran (Wajib) |
| currency | VARCHAR | Mata Uang Pembayaran |
| payment_method | VARCHAR | Metode Pembayaran: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Tanggal Pembayaran |
| bank_account | VARCHAR | Nomor Rekening Bank |
| bank_name | VARCHAR | Nama Bank |
| notes | TEXT | Catatan Pembayaran |

---

## 8. Siklus Hidup Pelanggan

### 8.1 Ikhtisar Pelanggan

Pelanggan dibuat saat konversi lead atau saat peluang berhasil dimenangkan. Sistem melacak siklus hidup lengkap dari akuisisi hingga menjadi pendukung (advocate).
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Definisi Status Pelanggan

| Status | Kode | Kesehatan | Deskripsi |
|-----|------|--------|------|
| Potensial | `prospect` | N/A | Lead yang sudah dikonversi, belum ada pesanan |
| Aktif | `active` | ≥70 | Pelanggan berbayar, interaksi baik |
| Berkembang | `growing` | ≥80 | Pelanggan dengan peluang ekspansi |
| Berisiko | `at_risk` | <50 | Pelanggan yang menunjukkan tanda-tanda akan berhenti |
| Berhenti | `churned` | N/A | Pelanggan yang tidak lagi aktif |
| Kembali | `win_back` | N/A | Mantan pelanggan yang sedang diaktifkan kembali |
| Pendukung | `advocate` | ≥90 | Kepuasan tinggi, memberikan referensi |

### 8.3 Penilaian Kesehatan Pelanggan

Kesehatan pelanggan dihitung berdasarkan beberapa faktor:

| Faktor | Bobot | Metrik Pengukuran |
|-----|------|---------|
| Kebaruan Pembelian | 25% | Jumlah hari sejak pesanan terakhir |
| Frekuensi Pembelian | 20% | Jumlah pesanan per periode |
| Nilai Moneter | 20% | Total dan rata-rata nilai pesanan |
| Tingkat Interaksi | 15% | Tingkat pembukaan email, partisipasi pertemuan |
| Kesehatan Dukungan | 10% | Volume tiket dan tingkat penyelesaian |
| Penggunaan Produk | 10% | Metrik penggunaan aktif (jika ada) |

**Ambang Batas Kesehatan:**

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
| VIP | Nilai Seumur Hidup (LTV) > $100K | Layanan eksklusif, sponsor eksekutif |
| Perusahaan Besar | Ukuran Perusahaan > 500 orang | Manajer Akun khusus |
| Pasar Menengah | Ukuran Perusahaan 50-500 orang | Kunjungan rutin, dukungan berskala |
| Startup | Ukuran Perusahaan < 50 orang | Sumber daya mandiri, komunitas |
| Dormant | 90+ hari tanpa aktivitas | Pemasaran aktivasi kembali |

---

## 9. Integrasi Email

### 9.1 Ikhtisar

NocoBase menyediakan plugin integrasi email bawaan yang mendukung Gmail dan Outlook. Setelah email disinkronkan ke sistem, alur kerja dapat secara otomatis memicu analisis AI untuk mengetahui sentimen dan niat email, membantu tim penjualan memahami sikap pelanggan dengan cepat.

### 9.2 Sinkronisasi Email

**Email yang Didukung:**
- Gmail (melalui OAuth 2.0)
- Outlook/Microsoft 365 (melalui OAuth 2.0)

**Perilaku Sinkronisasi:**
- Sinkronisasi dua arah untuk email terkirim dan diterima
- Pengaitan otomatis email ke catatan CRM (Lead, Kontak, Peluang)
- Lampiran disimpan dalam sistem file NocoBase

### 9.3 Pengaitan Email-CRM (Akan Disempurnakan)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Templat Email

Tim penjualan dapat menggunakan templat yang telah ditentukan:

| Kategori Templat | Contoh |
|---------|------|
| Kontak Awal | Email dingin (cold email), perkenalan hangat, tindak lanjut acara |
| Tindak Lanjut | Tindak lanjut pertemuan, tindak lanjut proposal, pengingat tanpa balasan |
| Penawaran | Penawaran terlampir, revisi penawaran, penawaran segera kedaluwarsa |
| Pesanan | Konfirmasi pesanan, pemberitahuan pengiriman, konfirmasi penerimaan |
| Kesuksesan Pelanggan | Selamat datang, kunjungan rutin, permintaan ulasan |

---

## 10. Kemampuan Berbantuan AI

### 10.1 Tim Karyawan AI

Sistem CRM mengintegrasikan plugin AI NocoBase, menggunakan kembali karyawan AI bawaan berikut, dan mengonfigurasi tugas khusus untuk skenario CRM:

| ID | Nama | Jabatan Bawaan | Kemampuan Ekstensi CRM |
|----|------|---------|-------------|
| viz | Viz | Analis Data | Analisis data penjualan, prediksi pipeline |
| dara | Dara | Pakar Bagan | Visualisasi data, pengembangan laporan bagan, desain dasbor |
| ellis | Ellis | Editor | Pembuatan draf balasan email, ringkasan komunikasi, draf email bisnis |
| lexi | Lexi | Penerjemah | Komunikasi pelanggan multi-bahasa, terjemahan konten |
| orin | Orin | Pengatur (Organizer) | Prioritas harian, saran langkah selanjutnya, rencana tindak lanjut |

### 10.2 Daftar Tugas AI

Kemampuan AI dibagi menjadi dua kategori yang saling independen:

#### I. Karyawan AI (Dipicu oleh Blok Antarmuka)

Melalui blok karyawan AI di antarmuka, pengguna berinteraksi langsung dengan AI untuk mendapatkan analisis dan saran.

| Karyawan | Tugas | Deskripsi |
|------|------|------|
| Viz | Analis Data Penjualan | Menganalisis tren pipeline, tingkat konversi |
| Viz | Prediksi Pipeline | Memprediksi pendapatan berdasarkan pipeline tertimbang |
| Dara | Pembuatan Bagan | Menghasilkan bagan laporan penjualan |
| Dara | Desain Dasbor | Mendesain tata letak dasbor data |
| Ellis | Pembuatan Draf Balasan | Menghasilkan balasan email profesional |
| Ellis | Ringkasan Komunikasi | Merangkum utas email |
| Ellis | Draf Email Bisnis | Undangan pertemuan, tindak lanjut, ucapan terima kasih, dll. |
| Orin | Prioritas Harian | Menghasilkan daftar tugas prioritas hari ini |
| Orin | Saran Langkah Selanjutnya | Merekomendasikan tindakan selanjutnya untuk setiap peluang |
| Lexi | Terjemahan Konten | Menerjemahkan materi pemasaran, proposal, email |

#### II. Node LLM Alur Kerja (Eksekusi Otomatis di Latar Belakang)

Node LLM yang disematkan dalam alur kerja, dipicu secara otomatis melalui peristiwa tabel data, peristiwa operasi, tugas terjadwal, dll., dan tidak terkait dengan karyawan AI.

| Tugas | Metode Pemicu | Deskripsi | Bidang Penulisan |
|------|---------|------|---------|
| Penilaian Lead | Peristiwa Tabel (Buat/Perbarui) | Mengevaluasi kualitas lead | ai_score, ai_convert_prob |
| Prediksi Tingkat Kemenangan | Peristiwa Tabel (Perubahan Tahap) | Memprediksi kemungkinan keberhasilan peluang | ai_win_probability, ai_risk_factors |

> **Penjelasan**: Node LLM alur kerja menggunakan perintah (prompt) dan Schema untuk menghasilkan JSON terstruktur, yang kemudian diurai dan ditulis ke dalam bidang data bisnis tanpa campur tangan pengguna.

### 10.3 Bidang AI dalam Database

| Tabel | Bidang AI | Deskripsi |
|----|--------|------|
| nb_crm_leads | ai_score | Skor AI 0-100 |
| | ai_convert_prob | Probabilitas Konversi |
| | ai_best_contact_time | Waktu Kontak Terbaik |
| | ai_tags | Label yang Dihasilkan AI (JSONB) |
| | ai_scored_at | Waktu Penilaian |
| | ai_next_best_action | Saran Tindakan Terbaik Selanjutnya |
| | ai_nba_generated_at | Waktu Pembuatan Saran |
| nb_crm_opportunities | ai_win_probability | Prediksi Tingkat Kemenangan AI |
| | ai_analyzed_at | Waktu Analisis |
| | ai_confidence | Kepercayaan Prediksi |
| | ai_trend | Tren: up/stable/down |
| | ai_risk_factors | Faktor Risiko (JSONB) |
| | ai_recommendations | Daftar Saran (JSONB) |
| | ai_predicted_close | Prediksi Tanggal Penutupan |
| | ai_next_best_action | Saran Tindakan Terbaik Selanjutnya |
| | ai_nba_generated_at | Waktu Pembuatan Saran |
| nb_crm_customers | ai_health_score | Skor Kesehatan 0-100 |
| | ai_health_grade | Tingkat Kesehatan: A/B/C/D |
| | ai_churn_risk | Risiko Kehilangan 0-100% |
| | ai_churn_risk_level | Tingkat Risiko Kehilangan: low/medium/high |
| | ai_health_dimensions | Skor Berbagai Dimensi (JSONB) |
| | ai_recommendations | Daftar Saran (JSONB) |
| | ai_health_assessed_at | Waktu Penilaian Kesehatan |
| | ai_tags | Label yang Dihasilkan AI (JSONB) |
| | ai_best_contact_time | Waktu Kontak Terbaik |
| | ai_next_best_action | Saran Tindakan Terbaik Selanjutnya |
| | ai_nba_generated_at | Waktu Pembuatan Saran |

---

## 11. Mesin Alur Kerja

### 11.1 Alur Kerja yang Telah Diimplementasikan

| Nama Alur Kerja | Tipe Pemicu | Status | Penjelasan |
|-----------|---------|------|------|
| Leads Created | Peristiwa Tabel | Aktif | Dipicu saat lead dibuat |
| CRM Overall Analytics | Peristiwa Karyawan AI | Aktif | Analisis data CRM secara keseluruhan |
| Lead Conversion | Peristiwa Setelah Operasi | Aktif | Proses konversi lead |
| Lead Assignment | Peristiwa Tabel | Aktif | Alokasi lead otomatis |
| Lead Scoring | Peristiwa Tabel | Nonaktif | Penilaian lead (akan disempurnakan) |
| Follow-up Reminder | Tugas Terjadwal | Nonaktif | Pengingat tindak lanjut (akan disempurnakan) |

### 11.2 Alur Kerja yang Akan Datang

| Alur Kerja | Tipe Pemicu | Penjelasan |
|-------|---------|------|
| Kemajuan Tahap Peluang | Peristiwa Tabel | Perbarui tingkat kemenangan dan catat waktu saat tahap berubah |
| Deteksi Stagnasi Peluang | Tugas Terjadwal | Mendeteksi peluang tanpa aktivitas dan mengirim pengingat |
| Persetujuan Penawaran | Peristiwa Setelah Operasi | Proses persetujuan bertingkat |
| Pembuatan Pesanan | Peristiwa Setelah Operasi | Membuat pesanan otomatis setelah penawaran diterima |

---

## 12. Desain Menu dan Antarmuka

### 12.1 Struktur Manajemen Latar Belakang

| Menu | Tipe | Penjelasan |
|------|------|------|
| **Dasbor** | Grup | Dasbor |
| - Dasbor | Halaman | Dasbor Default |
| - Manajer Penjualan | Halaman | Tampilan Manajer Penjualan |
| - Perwakilan Penjualan | Halaman | Tampilan Perwakilan Penjualan |
| - Eksekutif | Halaman | Tampilan Eksekutif |
| **Lead** | Halaman | Manajemen Lead |
| **Pelanggan** | Halaman | Manajemen Pelanggan |
| **Peluang** | Halaman | Manajemen Peluang |
| - Tabel | Tab | Daftar Peluang |
| **Produk** | Halaman | Manajemen Produk |
| - Kategori | Tab | Kategori Produk |
| **Pesanan** | Halaman | Manajemen Pesanan |
| **Pengaturan** | Grup | Pengaturan |
| - Pengaturan Tahap | Halaman | Konfigurasi Tahap Peluang |
| - Nilai Tukar | Halaman | Pengaturan Nilai Tukar |
| - Aktivitas | Halaman | Catatan Aktivitas |
| - Email | Halaman | Manajemen Email |
| - Kontak | Halaman | Manajemen Kontak |
| - Analisis Data | Halaman | Analisis Data |

### 12.2 Tampilan Dasbor

#### Tampilan Manajer Penjualan

| Komponen | Tipe | Data |
|-----|------|------|
| Nilai Pipeline | Kartu KPI | Total nilai pipeline di setiap tahap |
| Papan Peringkat Tim | Tabel | Peringkat kinerja perwakilan |
| Peringatan Risiko | Daftar Peringatan | Peluang berisiko tinggi |
| Tren Tingkat Kemenangan | Bagan Garis | Tingkat kemenangan bulanan |
| Transaksi Stagnan | Daftar | Transaksi yang memerlukan perhatian |

#### Tampilan Perwakilan Penjualan

| Komponen | Tipe | Data |
|-----|------|------|
| Progres Kuota Saya | Bilah Progres | Aktual bulanan vs Kuota |
| Peluang Menunggu Diproses | Kartu KPI | Jumlah peluang saya yang menunggu diproses |
| Akan Ditutup Minggu Ini | Daftar | Transaksi yang akan segera ditutup |
| Aktivitas Terlambat | Peringatan | Tugas yang sudah kedaluwarsa |
| Tindakan Cepat | Tombol | Catat aktivitas, buat peluang |

#### Tampilan Eksekutif

| Komponen | Tipe | Data |
|-----|------|------|
| Pendapatan Tahunan | Kartu KPI | Pendapatan tahun berjalan hingga saat ini |
| Nilai Pipeline | Kartu KPI | Total nilai pipeline |
| Tingkat Kemenangan | Kartu KPI | Tingkat kemenangan keseluruhan |
| Kesehatan Pelanggan | Bagan Distribusi | Distribusi skor kesehatan |
| Prediksi | Bagan | Prediksi pendapatan bulanan |


---

*Versi Dokumen: v2.0 | Tanggal Pembaruan: 2026-02-06*