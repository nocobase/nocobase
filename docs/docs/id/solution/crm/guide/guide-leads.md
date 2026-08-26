---
title: "Manajemen Lead"
description: "Panduan penggunaan manajemen Lead CRM: pembuatan Lead, skoring otomatis AI, filter cerdas, konversi Lead ke Pelanggan dan Peluang."
keywords: "Manajemen Lead,Lead,Skoring AI,Konversi Lead,Sales Funnel,NocoBase CRM"
---

# Manajemen Lead

> Lead adalah titik awal alur penjualan — kontak pertama dengan setiap Pelanggan potensial dimulai dari sini. Bab ini akan membawa Anda melalui siklus hidup lengkap Lead: pembuatan, skoring, filter, follow-up, konversi.

![cn_01-leads](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_01-leads.png)

## Ikhtisar Halaman Lead

Pada menu atas, klik **Sales → Leads** untuk masuk ke halaman manajemen Lead.

![01-leads-2026-04-02-00-04-18](https://static-docs.nocobase.com/01-leads-2026-04-02-00-04-18.png)

Bagian atas halaman adalah barisan **tombol filter cerdas**, membantu Anda dengan cepat beralih tampilan:

Grup pertama:

| Tombol | Deskripsi |
|------|------|
| All | Tampilkan semua Lead |
| New | Status baru, belum mulai di-follow up |
| Working | Sedang di-follow up |
| Qualified | Dikonfirmasi sebagai Lead memenuhi syarat |
| Unqualified | Ditandai tidak memenuhi syarat |

Grup kedua:

| Tag | Arti |
|------|------|
| Hot | Lead skor tinggi dengan skor AI ≥ 75 |
| Hari Ini | Lead yang dibuat hari ini |
| Minggu Ini | Lead yang dibuat minggu ini |
| Bulan Ini | Lead yang dibuat bulan ini |
| Belum Ditugaskan | Lead yang belum ditentukan Owner-nya |
| Enterprise | Lead dari sumber Pelanggan tingkat enterprise |


![01-leads-2026-04-02-00-06-19](https://static-docs.nocobase.com/01-leads-2026-04-02-00-06-19.gif)


Tabel dapat menampilkan informasi kunci sekilas, kolom komposit yang disertakan:

- **Dashboard Skor AI**: Meter bulat 0-100, merah (rendah) → kuning (sedang) → hijau (tinggi), secara intuitif mencerminkan kualitas Lead
- **Kolom Komposit Nama+Perusahaan**: Nama dan nama perusahaan ditampilkan bersama, menghemat ruang
- **Kolom Komposit Email+Telepon**: Informasi kontak terlihat jelas
- **Kolom Waktu Relatif**: Menampilkan "3 jam yang lalu", "2 hari yang lalu", dll. waktu relatif, Lead yang sudah lewat waktu akan disorot merah untuk mengingatkan Anda untuk follow-up tepat waktu

![01-leads-2026-04-02-00-07-04](https://static-docs.nocobase.com/01-leads-2026-04-02-00-07-04.gif)

## Membuat Lead

Klik tombol **Add new** di atas tabel untuk membuka form pembuatan Lead.

![01-leads-2026-04-02-00-08-08](https://static-docs.nocobase.com/01-leads-2026-04-02-00-08-08.png)

Isi informasi berikut:

| Field | Deskripsi | Wajib |
|------|------|---------|
| Name | Nama Lead | Ya |
| Company | Perusahaan | Disarankan diisi |
| Email | Alamat email | Disarankan diisi |
| Phone | Nomor telepon | Disarankan diisi |
| Source | Sumber Lead (seperti form website, pameran, referral, dll.) | Disarankan diisi |
...

### Deteksi Duplikat Real-time

Saat Anda mengisi form, sistem akan melakukan deteksi duplikat real-time pada field nama, perusahaan, email, telepon, HP, dll. Saat input, jika menemukan record yang ada cocok:

- **Peringatan Kuning**: Ditemukan record yang mirip, disarankan untuk diverifikasi
- **Peringatan Merah**: Ditemukan record duplikat persis, sangat disarankan untuk memeriksa record yang ada terlebih dahulu

![01-leads-2026-04-02-00-11-05](https://static-docs.nocobase.com/01-leads-2026-04-02-00-11-05.png)


Ini secara efektif menghindari satu orang yang sama dimasukkan beberapa kali.

### Pengisian Form AI

Jika Anda memiliki teks kartu nama atau riwayat percakapan, tidak perlu mengisi field per field secara manual — klik tombol AI, pilih "Form Fill", paste konten teks, AI akan secara otomatis mengekstrak nama, perusahaan, email, telepon, dan informasi lainnya, mengisi form dengan satu klik.

Setelah selesai mengisi, klik **Submit** untuk menyimpan.

![01-leads-2026-04-02-00-15-14](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-14.png)

### Skoring Otomatis AI

Setelah disimpan, sistem akan otomatis memicu **Workflow Skoring AI**. AI akan menganalisis informasi Lead secara komprehensif, menghasilkan output berikut:

| Output AI | Deskripsi |
|---------|------|
| Score | Skor komprehensif 0-100 |
| Conversion Probability | Prediksi probabilitas konversi |
| NBA (Rekomendasi Langkah Berikutnya) | Saran follow-up yang diberikan AI, contoh "Disarankan kontak via telepon dalam 24 jam" |
| Tags | Tag yang dihasilkan otomatis, seperti "Niat Tinggi", "Pengambil Keputusan", dll. |

![01-leads-2026-04-02-00-15-53](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-53.png)

> Tips: Semakin tinggi skor AI, semakin baik kualitas Lead. Disarankan untuk memprioritaskan follow-up Lead Hot (≥ 75 poin), curahkan tenaga pada Pelanggan yang paling mungkin closing.

## Filter dan Pencarian

Tombol filter cerdas di atas mendukung **filter real-time** — klik langsung berlaku, tanpa perlu refresh halaman.

Beberapa skenario umum:

- **Mulai Kerja Pagi**: Klik "Hari Ini" untuk melihat Lead baru hari ini, lalu klik "Hot" untuk melihat apakah ada Lead skor tinggi yang perlu segera di-follow up
- **Penugasan Lead**: Klik "Belum Ditugaskan" untuk menemukan Lead yang belum memiliki Owner, dan menugaskannya satu per satu kepada rekan sales
- **Filter Review**: Klik "Unqualified" untuk meninjau Lead yang ditandai tidak memenuhi syarat, periksa apakah ada kesalahan penilaian

> Tips: Sistem mendukung filter langsung melalui parameter URL. Misalnya saat mengakses halaman Lead dengan `?status=new`, halaman akan otomatis memilih tombol filter "New". Ini sangat mudah saat navigasi dari halaman lain.

## Detail Lead

Pada tabel, klik Lead apa pun untuk membuka popup detail. Popup berisi **3 tab**:

### Tab Detail

Ini adalah tab dengan informasi terkaya, dari atas ke bawah berisi:

![01-leads-2026-04-02-00-17-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-36.png)

**Alur Tahap dan Tombol Action**

Area atas berisi bar alur tahap dan tombol Action (Edit / Convert / Lost / Assign). Bar alur tahap:

```
New → Working → Converted / Lost
```

Anda dapat langsung **klik tahap yang sesuai** untuk mendorong status Lead. Misalnya saat mulai follow-up klik "Working", setelah mengonfirmasi Lead memenuhi syarat klik "Converted" untuk memicu alur konversi.

![01-leads-2026-04-02-00-23-03](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-03.png)

Jika sudah memiliki objek target (Pelanggan, Kontak, Peluang), langsung cari dan pilih. Jika belum, klik tombol buat baru di sebelah kanan input box, akan membuka popup buat baru, otomatis mengisi konten yang terkait dengan Lead.
![01-leads-2026-04-07-00-14-21](https://static-docs.nocobase.com/01-leads-2026-04-07-00-14-21.gif)


Klik "Lost" akan memunculkan dialog box, meminta Anda mengisi alasan kalah — memudahkan analisis review berikutnya.

![01-leads-2026-04-02-00-23-25](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-25.png)


**Card Skor AI**

Menampilkan detail skor AI, termasuk:
- Dashboard AI Score (0-100)
- Conversion Probability
- Pipeline Days (Hari di pipeline)
- NBA (Rekomendasi Langkah Berikutnya)

**Area Tag Badge**

Menampilkan atribut kunci seperti Rating, Status, Source, dll. dengan badge berwarna.

**Informasi Dasar dan Tombol Cepat Aktivitas**

Field dasar seperti informasi perusahaan, kontak, dll. Area ini juga memiliki kelompok tombol cepat aktivitas: Log Call, Send Email, Schedule, setelah dioperasikan akan otomatis terkait dengan Lead saat ini.

**AI Insights**

Insight analisis dan rekomendasi follow-up yang dihasilkan AI.

**Area Komentar**

Anggota tim dapat meninggalkan pesan untuk diskusi di sini, semua komentar setelah Lead dikonversi akan otomatis dimigrasikan ke record Pelanggan yang baru dibuat.

![01-leads-2026-04-02-00-24-10](https://static-docs.nocobase.com/01-leads-2026-04-02-00-24-10.png)

### Tab Email

Menampilkan semua email yang terkait dengan Lead tersebut, memudahkan untuk meninjau riwayat komunikasi. Mendukung mengirim email langsung di sini, dan memiliki tombol bantuan AI.

![01-leads-2026-04-02-00-17-57](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-57.png)

### Tab Riwayat Perubahan

Mencatat semua perubahan field Lead tersebut, akurat hingga "siapa pada waktu apa mengubah field mana dari A menjadi B". Digunakan untuk pelacakan dan review.

![01-leads-2026-04-02-00-22-07](https://static-docs.nocobase.com/01-leads-2026-04-02-00-22-07.png)


## Konversi Lead

Ini adalah operasi **paling inti** dalam manajemen Lead — mengkonversi satu Lead memenuhi syarat menjadi Pelanggan, Kontak, dan Peluang dengan satu klik.

### Cara Konversi

Pada popup detail Lead, klik tahap **Converted** pada komponen alur tahap.

![01-leads-2026-04-02-00-26-01](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-01.png)

### Alur Konversi

Sistem akan otomatis memicu **Workflow Konversi Lead**, menyelesaikan operasi berikut sekaligus:

1. **Buat Pelanggan (Customer)** — Buat record Pelanggan baru dengan nama perusahaan dari Lead, nama/industri/skala/alamat otomatis terisi dari Lead, dengan deteksi duplikat
2. **Buat Kontak (Contact)** — Buat Kontak dengan nama, email, telepon, jabatan dari Lead, dan terkait dengan Pelanggan
3. **Buat Peluang (Opportunity)** — Buat record Peluang baru, nama/sumber/jumlah/tahap otomatis terisi dari Lead, terkait dengan Pelanggan
4. **Migrasi Komentar** — Semua komentar pada Lead otomatis disalin ke record yang baru dibuat
5. **Update Status Lead** — Status Lead ditandai sebagai Qualified

### Efek Setelah Konversi

Setelah konversi selesai, kembali ke list Lead, Anda akan menemukan **kolom komposit Nama+Perusahaan** Lead tersebut menjadi link yang dapat diklik:

- Klik nama → Navigasi ke detail Kontak
- Klik nama perusahaan → Navigasi ke detail Pelanggan

![01-leads-2026-04-02-00-26-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-36.png)

> Tips: Konversi adalah operasi yang tidak dapat dibalikkan. Sebelum konversi, pastikan informasi Lead akurat dan lengkap, terutama nama perusahaan dan informasi kontak — ini akan langsung menjadi data awal Pelanggan dan Kontak.

## Penugasan Otomatis

Saat satu Lead belum menentukan Owner, sistem akan otomatis memicu **Workflow Penugasan Lead**.

Logika penugasan sangat sederhana: **otomatis ditugaskan kepada tenaga penjualan dengan jumlah Lead saat ini paling sedikit**, memastikan beban kerja tim seimbang.

Workflow ini akan memeriksa saat Lead dibuat dan diupdate — jika field Owner kosong, akan otomatis ditugaskan.

> Tips: Jika Anda ingin menentukan Owner secara manual, langsung edit field Owner di detail. Penugasan manual akan menimpa hasil penugasan otomatis.

---

Setelah konversi Lead selesai, Pelanggan dan Peluang Anda sudah siap. Selanjutnya, lihat [Peluang dan Penawaran](./guide-opportunities) untuk mengetahui cara mendorong sales funnel.

## Halaman Terkait

- [Ringkasan Panduan Penggunaan CRM](./index.md)
- [Peluang dan Penawaran](./guide-opportunities)
- [Manajemen Pelanggan](./guide-customers-emails)
