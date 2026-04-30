---
title: "Pelanggan, Kontak, dan Email"
description: "Tampilan 360 Pelanggan CRM, skor kesehatan AI, penggabungan Pelanggan, manajemen role Kontak, kirim/terima email dengan bantuan AI, riwayat aktivitas."
keywords: "Manajemen Pelanggan,Kontak,Email,Skor Kesehatan,Penggabungan Pelanggan,NocoBase CRM"
---

# Pelanggan, Kontak, dan Email

> Pelanggan, Kontak, dan Email adalah tiga modul yang saling terkait erat — Pelanggan adalah subjek, Kontak adalah objek komunikasi, Email adalah catatan komunikasi. Bab ini akan memperkenalkan ketiganya secara terpadu.

![cn_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_04-customers-emails.png)

## Manajemen Pelanggan

Dari menu atas masuk ke halaman **Customers**, berisi dua tab: Daftar Pelanggan dan Tool Penggabungan Pelanggan.

### Daftar Pelanggan

Di atas list ada tombol filter:

| Kondisi Filter | Deskripsi |
|---------|------|
| **All** | Semua Pelanggan |
| **Active** | Pelanggan aktif |
| **Potential** | Pelanggan potensial, belum closing |
| **Dormant** | Pelanggan dormant, lama tidak ada interaksi |
| **Key Accounts** | Pelanggan besar/Pelanggan penting |
| **New This Month** | Pelanggan baru bulan ini |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**Kolom Kunci**:

- **Skor Kesehatan AI**: Progress ring 0-100 poin (hijau 70-100 sehat / kuning 40-69 peringatan / merah 0-39 berbahaya)
- **Aktivitas Terbaru**: Waktu relatif + color coding, semakin lama tidak dihubungi semakin gelap warnanya

### Detail Pelanggan

Klik nama Pelanggan untuk membuka popup detail, berisi **3 tab**:

| Tab | Konten |
|-------|------|
| **Detail** | Profil Pelanggan, card statistik, Kontak, Peluang, komentar |
| **Email** | Email yang dikirim/diterima dengan semua Kontak Pelanggan tersebut, 5 tombol AI |
| **Riwayat Perubahan** | Audit log tingkat field |

**Tab Detail** menggunakan layout dua kolom 2/3 kiri + 1/3 kanan:

- **Kolom Kiri**: Avatar Pelanggan (diwarnai berdasarkan level: Normal=abu-abu, Important=amber, VIP=emas), ringkasan 4 kolom (level/skala/wilayah/tipe), card statistik (total jumlah closing / jumlah Peluang aktif / jumlah interaksi bulan ini, query API real-time), daftar Kontak, daftar Peluang, area komentar
- **Kolom Kanan**: Profil cerdas AI (tag AI, donut chart skor kesehatan, risiko churn, waktu kontak terbaik, strategi komunikasi)

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### Skor Kesehatan AI

Skor kesehatan dihitung otomatis dengan menggabungkan dimensi berikut: frekuensi interaksi, aktivitas Peluang, kondisi Pesanan, cakupan Kontak.

Saran penggunaan:

1. Setiap hari buka daftar Pelanggan, urutkan berdasarkan skor kesehatan
2. Prioritaskan Pelanggan merah (Critical) — mungkin sedang churn
3. Pelanggan kuning (Warning) — atur follow-up ringan
4. Pelanggan hijau (Healthy) — pemeliharaan dengan ritme normal

### Penggabungan Pelanggan

Saat muncul record Pelanggan duplikat, bersihkan melalui tool penggabungan:

1. **Inisiasi Penggabungan**: Pada daftar Pelanggan, centang beberapa Pelanggan → klik tombol "Customer Merge"
2. **Masuk ke Tool Penggabungan**: Beralih ke tab kedua, lihat daftar permintaan penggabungan (Pending / Merged / Cancelled)
3. **Eksekusi Penggabungan**: Pilih record utama (Master) → bandingkan perbedaan field per field → preview → konfirmasi. Workflow backend otomatis memigrasikan semua data terkait (Peluang, Kontak, aktivitas, komentar, Pesanan, Penawaran, share) dan menonaktifkan Pelanggan yang digabung

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[Periksa dengan Hati-hati Sebelum Penggabungan]
Penggabungan Pelanggan adalah operasi yang tidak dapat dibalikkan. Sebelum eksekusi, periksa dengan hati-hati pemilihan record utama dan pilihan nilai field.
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## Manajemen Kontak

Dari menu atas masuk ke halaman **Settings → Contacts**.

### Informasi Kontak

| Field | Deskripsi |
|------|------|
| Name | Nama Kontak |
| Company | Perusahaan tempat bekerja (terkait dengan record Pelanggan) |
| Email | Alamat email (untuk asosiasi email otomatis) |
| Phone | Nomor telepon |
| Role | Tag role |
| Level | Level Kontak |
| Primary Contact | Apakah Kontak utama Pelanggan tersebut |

### Tag Role

| Role | Arti |
|------|------|
| Decision Maker | Pengambil keputusan |
| Influencer | Influencer |
| Technical | Penanggung jawab teknis |
| Procurement | Penanggung jawab pengadaan |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### Mengirim Email dari Kontak

Buka halaman detail Kontak, mirip dengan manajemen data lainnya, berisi tab detail, email, riwayat field, dll.

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### Asosiasi Email dan CRM

Email otomatis dikaitkan dengan Pelanggan, Kontak, dan Peluang:

- Tab "Email" pada detail Pelanggan → Email yang dikirim/diterima oleh semua Kontak Pelanggan tersebut
- Detail Kontak → Riwayat email lengkap Kontak tersebut
- Detail Peluang → Catatan komunikasi terkait

Asosiasi melalui view, otomatis dicocokkan berdasarkan alamat email Kontak.

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### Bantuan Email AI

Halaman email menyediakan 6 skenario bantuan AI:

| Skenario | Fungsi |
|------|------|
| **Penyusunan Proposal** | AI generate email proposal berdasarkan konteks Pelanggan dan Peluang |
| **Email Follow-up** | AI generate email follow-up dengan nada yang sesuai |
| **Analisis Email** | AI analisis sentimen email dan poin kunci |
| **Ringkasan Email** | AI generate ringkasan untuk thread email |
| **Konteks Pelanggan** | AI merangkum informasi latar belakang Pelanggan |
| **Briefing Eksekutif** | AI mengekstrak informasi kunci dari thread email untuk generate briefing |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## Riwayat Aktivitas

Dari menu atas masuk ke halaman **Settings → Activities**. Ini adalah log pusat untuk semua interaksi Pelanggan.

| Tipe Aktivitas | Deskripsi |
|---------|------|
| Meeting | Pertemuan |
| Call | Telepon |
| Email | Email |
| Visit | Kunjungan |
| Note | Catatan |
| Task | Tugas |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

Riwayat aktivitas juga akan muncul di tampilan kalender dashboard Overview.

---

## Halaman Terkait

- [Panduan Penggunaan CRM](./index.md)
- [Manajemen Lead](./guide-leads) — Setelah Lead dikonversi otomatis membuat Pelanggan dan Kontak
- [Manajemen Peluang](./guide-opportunities) — Peluang yang terkait dengan Pelanggan
- [AI Employee](./guide-ai)
