:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/solution/ticket-system/index).
:::

# Ringkasan Solusi Tiket

> **Catatan**: Ini adalah versi pratinjau awal. Fitur masih terus ditingkatkan dan kami terus berupaya melakukan penyempurnaan. Masukan Anda sangat kami harapkan!

## 1. Latar Belakang (Mengapa)

### Masalah Industri / Peran / Manajemen yang Diselesaikan

Perusahaan menghadapi berbagai jenis permintaan layanan dalam operasional sehari-hari: perbaikan peralatan, dukungan IT, keluhan pelanggan, konsultasi, dll. Sumber permintaan ini tersebar (sistem CRM, teknisi lapangan, email, formulir publik, dll.), memiliki alur kerja pemrosesan yang berbeda, dan kurang memiliki mekanisme pelacakan serta manajemen yang terpadu.

**Contoh Skenario Bisnis Tipikal:**

- **Perbaikan Peralatan**: Tim purna jual menangani permintaan perbaikan peralatan, perlu mencatat informasi spesifik perangkat seperti nomor seri, kode kerusakan, suku cadang.
- **Dukungan IT**: Departemen IT menangani permintaan karyawan internal untuk pengaturan ulang kata sandi, instalasi perangkat lunak, masalah jaringan.
- **Keluhan Pelanggan**: Tim layanan pelanggan menangani keluhan dari berbagai saluran, beberapa pelanggan yang emosional memerlukan penanganan prioritas.
- **Layanan Mandiri Pelanggan**: Pelanggan akhir ingin mengirimkan permintaan layanan dengan mudah dan melacak progres pemrosesan.

### Profil Target Pengguna

| Dimensi | Deskripsi |
|------|------|
| Ukuran Perusahaan | UMKM hingga perusahaan menengah-besar dengan kebutuhan layanan pelanggan yang signifikan |
| Struktur Peran | Tim layanan pelanggan, dukungan IT, tim purna jual, manajemen operasional |
| Kematangan Digital | Pemula hingga menengah, sedang berupaya meningkatkan dari manajemen Excel/email ke manajemen sistematis |

### Masalah pada Solusi Utama Saat Ini

- **Biaya Tinggi / Kustomisasi Lambat**: Sistem tiket SaaS mahal, siklus pengembangan kustom lama.
- **Fragmentasi Sistem, Silo Data**: Berbagai data bisnis tersebar di sistem yang berbeda, sulit untuk menyatukan analisis dan pengambilan keputusan.
- **Perubahan Bisnis Cepat, Sistem Sulit Berevolusi**: Saat kebutuhan bisnis berubah, sistem sulit disesuaikan dengan cepat.
- **Respons Layanan Lambat**: Permintaan yang mengalir di antara sistem yang berbeda tidak dapat didisposisikan dengan segera.
- **Proses Tidak Transparan**: Pelanggan tidak dapat melacak progres tiket, pertanyaan yang sering muncul meningkatkan beban layanan pelanggan.
- **Kualitas Sulit Dijamin**: Kurangnya pemantauan SLA, batas waktu yang terlampaui dan umpan balik negatif tidak dapat diperingatkan tepat waktu.

---

## 2. Tolok Ukur Produk (Benchmark)

### Produk Utama di Pasar

- **SaaS**: Seperti Salesforce, Zendesk, Odoo, dll.
- **Sistem Kustom / Sistem Internal**

### Dimensi Tolok Ukur

- Cakupan Fitur
- Fleksibilitas
- Ekstensibilitas
- Pendekatan Penggunaan AI

### Keunggulan Solusi NocoBase

**Keunggulan Tingkat Platform:**

- **Prioritas Konfigurasi**: Dari tabel data dasar hingga jenis bisnis, SLA, perutean keahlian, semuanya dikelola melalui konfigurasi.
- **Pengembangan Cepat Low-Code**: Lebih cepat daripada pengembangan kustom, lebih fleksibel daripada SaaS.

**Hal yang Tidak Bisa Dilakukan Sistem Tradisional atau Membutuhkan Biaya Sangat Tinggi:**

- **Integrasi AI Native**: Memanfaatkan plugin AI NocoBase untuk klasifikasi cerdas, bantuan pengisian formulir, rekomendasi pengetahuan.
- **Semua Desain Dapat Direplikasi oleh Pengguna**: Pengguna dapat melakukan pengembangan mandiri berdasarkan templat.
- **Arsitektur Data Berbentuk T**: Tabel utama + tabel ekstensi bisnis, menambahkan jenis bisnis baru hanya memerlukan penambahan tabel ekstensi.

---

## 3. Prinsip Desain (Principles)

- **Biaya Kognitif Rendah**
- **Bisnis Mendahului Teknologi**
- **Dapat Berevolusi, Bukan Penyelesaian Sekali Jalan**
- **Konfigurasi Diutamakan, Kode Sebagai Cadangan**
- **Kolaborasi Manusia-AI, Bukan AI Menggantikan Manusia**
- **Semua Desain Harus Dapat Direplikasi oleh Pengguna**

---

## 4. Ringkasan Solusi (Solution Overview)

### Pengenalan Singkat

Pusat tiket universal yang dibangun di atas platform low-code NocoBase, mencapai:

- **Pintu Masuk Terpadu**: Integrasi multi-sumber, pemrosesan standar.
- **Distribusi Cerdas**: Klasifikasi berbantuan AI, penugasan dengan penyeimbangan beban.
- **Bisnis Polimorfik**: Tabel utama inti + tabel ekstensi bisnis, ekstensi yang fleksibel.
- **Umpan Balik Loop Tertutup**: Pemantauan SLA, penilaian pelanggan, tindak lanjut umpan balik negatif.

### Alur Pemrosesan Tiket

```
Input Multi-Sumber → Pra-pemrosesan/Analisis AI → Penugasan Cerdas → Eksekusi Manual → Loop Umpan Balik
        ↓                       ↓                        ↓                  ↓                ↓
 Pemeriksaan Duplikasi     Pengenalan Niat          Pencocokan Keahlian  Alur Status      Penilaian Kepuasan
                           Analisis Sentimen        Penyeimbangan Beban  Pemantauan SLA   Tindak Lanjut Umpan Balik Negatif
                           Balasan Otomatis         Manajemen Antrean    Komunikasi Komentar  Pengarsipan Data
```

### Daftar Modul Inti

| Modul | Deskripsi |
|------|------|
| Penerimaan Tiket | Formulir publik, portal pelanggan, dibuat oleh agen, API/Webhook, penguraian email |
| Manajemen Tiket | CRUD tiket, alur status, penugasan/pengalihan, komunikasi komentar, log operasi |
| Ekstensi Bisnis | Perbaikan peralatan, dukungan IT, keluhan pelanggan, dan tabel ekstensi bisnis lainnya |
| Manajemen SLA | Konfigurasi SLA, peringatan batas waktu, eskalasi batas waktu |
| Manajemen Pelanggan | Tabel utama pelanggan, manajemen kontak, portal pelanggan |
| Sistem Penilaian | Penilaian multi-dimensi, tag cepat, NPS, peringatan umpan balik negatif |
| Bantuan AI | Klasifikasi niat, analisis sentimen, rekomendasi pengetahuan, bantuan balasan, pemolesan nada bicara |

### Tampilan Antarmuka Inti

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Karyawan AI (AI Employee)

### Tipe dan Skenario Karyawan AI

- **Asisten Layanan Pelanggan**, **Asisten Penjualan**, **Analis Data**, **Auditor**
- Membantu manusia, bukan menggantikannya

### Kuantifikasi Nilai Karyawan AI

Dalam solusi ini, karyawan AI dapat:

| Dimensi Nilai | Efek Spesifik |
|----------|----------|
| Meningkatkan Efisiensi | Klasifikasi otomatis mengurangi waktu pemilahan manual sebesar 50%+; rekomendasi pengetahuan mempercepat penyelesaian masalah |
| Mengurangi Biaya | Pertanyaan sederhana dijawab otomatis, mengurangi beban kerja layanan pelanggan manual |
| Memberdayakan Karyawan Manusia | Peringatan emosi membantu layanan pelanggan bersiap lebih awal; pemolesan balasan meningkatkan kualitas komunikasi |
| Meningkatkan Kepuasan Pelanggan | Respons lebih cepat, penugasan lebih akurat, balasan lebih profesional |

---

## 6. Sorotan Utama (Highlights)

### 1. Arsitektur Data Berbentuk T

- Semua tiket berbagi tabel utama dengan logika alur yang terpadu.
- Tabel ekstensi bisnis membawa bidang khusus tipe, ekstensi fleksibel.
- Menambahkan jenis bisnis baru hanya memerlukan penambahan tabel ekstensi, tanpa memengaruhi alur utama.

### 2. Siklus Hidup Tiket Lengkap

- Baru → Ditugaskan → Diproses → Ditunda → Diselesaikan → Ditutup
- Mendukung skenario kompleks seperti pengalihan, pengembalian, pembukaan kembali.
- Penghitungan waktu SLA akurat hingga jeda penundaan.

### 3. Integrasi Terpadu Multi-Saluran

- Formulir publik, portal pelanggan, API, email, dibuat oleh agen.
- Pemeriksaan idempotensi mencegah pembuatan duplikat.

### 4. Integrasi AI Native

- Bukan sekadar "menambahkan tombol AI", tetapi terintegrasi ke dalam setiap langkah.
- Pengenalan niat, analisis sentimen, rekomendasi pengetahuan, pemolesan balasan.

---

## 7. Roadmap (Terus Diperbarui)

- **Penyematan Sistem**: Mendukung penyematan modul tiket ke dalam berbagai sistem bisnis seperti ERP, CRM, dll.
- **Interkoneksi Tiket**: Integrasi tiket sistem hulu/hilir dan callback status untuk kolaborasi tiket lintas sistem.
- **Otomatisasi AI**: Karyawan AI yang tertanam dalam alur kerja, mendukung eksekusi otomatis di latar belakang untuk pemrosesan tanpa pengawasan.
- **Dukungan Multi-Tenant**: Penskalaan horizontal melalui arsitektur multi-ruang/multi-aplikasi, memungkinkan distribusi ke tim layanan yang berbeda untuk operasional mandiri.
- **RAG Basis Pengetahuan**: Vektorisasi otomatis dari semua data (tiket, pelanggan, produk, dll.) untuk pencarian cerdas dan rekomendasi pengetahuan.
- **Dukungan Multi-Bahasa**: Antarmuka dan konten mendukung berbagai bahasa, memungkinkan kolaborasi tim lintas batas/wilayah.