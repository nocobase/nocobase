---
title: "Pemilihan LLM"
description: "Pelajari hasil pengujian dan panduan pemilihan model flagship terkemuka untuk membangun aplikasi NocoBase, berdasarkan sistem evaluasi terstandar yang mencakup pemodelan data, halaman, Permission, dan Workflow."
keywords: "NocoBase AI Builder,pemilihan LLM,GPT,DeepSeek,Qwen,AI Agent,evaluasi model"
---

# Pemilihan LLM

:::tip Kesimpulan utama

**Model flagship terkemuka yang tersedia di pasaran saat ini semuanya dapat membangun bagian inti aplikasi NocoBase.**

Setiap model memiliki perbedaan dalam kelengkapan hasil awal, waktu pembangunan, dan jumlah masalah. Pilihlah berdasarkan layanan model yang telah tersedia, kondisi jaringan di wilayah Anda, biaya, serta preferensi tim.

:::

Evaluasi ini menggunakan satu set kebutuhan CRM terstandar (sistem peluang penjualan dan tindak lanjut pelanggan) untuk memvalidasi aplikasi yang dibangun oleh berbagai model:

| Dimensi evaluasi | Item evaluasi terstandar |
| :---: | :---: |
| 14 | 61 |

## Dimensi evaluasi

Evaluasi ini mencakup kemampuan inti, kemampuan konfigurasi, dan komponen dasar NocoBase. Evaluasi ini juga memeriksa apakah setiap model dapat memahami kebutuhan dan menjalankan tugas pembangunan yang sesuai.

| Kemampuan | Fokus evaluasi |
| --- | --- |
| Pemodelan data | Collection, tipe Field, relasi, batasan wajib dan unik, serta nilai default |
| Halaman dan fitur | Navigasi, daftar, formulir, detail, pencarian, filter, dan dashboard |
| Logika bisnis | Transisi status, validasi bisnis, aturan perhitungan, dan konsistensi data terkait |
| Permission dan keamanan | Role, Permission menu, Permission tindakan, cakupan data, dan Permission Field |
| Otomatisasi Workflow | Pemicu, node, cabang kondisi, notifikasi, efek samping data, dan percobaan ulang saat gagal |
| Pengalaman pengguna | Arsitektur informasi, pengalaman formulir, umpan balik tindakan, dan layout responsif |
| Ketangguhan | Input tidak valid, pengiriman duplikat, konsistensi saat gagal, volume data, dan pemulihan jaringan |
| Cakupan kebutuhan | Apakah kebutuhan eksplisit dan alur bisnis inti telah diterapkan sepenuhnya |
| Perluasan yang wajar | Apakah fitur yang ditambahkan secara proaktif oleh model memiliki tujuan bisnis yang jelas |
| Kontrol cakupan | Apakah hasil memuat modul bisnis yang duplikat, tidak digunakan, atau berada di luar cakupan |

## Hasil evaluasi

| Dimensi evaluasi | GPT-5.6 Sol | DeepSeek-V4-Flash | Qwen3.8-Max | GPT-5.6 Luna |
| --- | :---: | :---: | :---: | :---: |
| Pemodelan data | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> |
| Penyelesaian fitur | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#d97706;font-weight:600">◐ Lulus sebagian</span> |
| Logika bisnis | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> |
| Permission dan keamanan | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> |
| Otomatisasi Workflow | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> |
| Pengalaman pengguna | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#d97706;font-weight:600">◐ Lulus sebagian</span> |
| Ketangguhan | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> |
| Cakupan kebutuhan | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#d97706;font-weight:600">◐ Lulus sebagian</span> |
| Perluasan yang wajar | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> |
| Kontrol cakupan | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> | <span style="color:#15803d;font-weight:600">✓ Lulus</span> |
| **Kecepatan pembangunan** | <span style="color:#2563eb;font-weight:700">Relatif cepat</span> | <span style="color:#2563eb;font-weight:700">Relatif cepat</span> | <span style="color:#d97706;font-weight:700">Lambat</span> | <span style="color:#15803d;font-weight:700">Paling cepat</span> |
| **Skor kualitas satu kali proses** | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">91</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#c2410c;background:#fff7ed;font-weight:800">77</span> |

:::tip Skor kualitas satu kali proses

Skor kualitas satu kali proses memiliki nilai maksimal 100 poin. Satu poin dikurangi untuk setiap bug yang ditemukan selama pemeriksaan penerimaan lengkap pertama, sehingga memberikan gambaran tentang kualitas hasil pembangunan awal model. Model dapat menyelesaikan masalah tersebut melalui umpan balik dan revisi berikutnya.

:::

:::info Catatan tentang waktu pembangunan

Waktu pembangunan dipengaruhi oleh berbagai faktor, seperti kinerja hardware komputer, instalasi dependensi dan kompilasi Build, kecepatan respons layanan model, serta kondisi jaringan.

:::

## Detail item evaluasi

Sebanyak 61 item evaluasi terstandar disusun dalam tiga lapisan: 46 item untuk kualitas hasil pembangunan, 7 item untuk pemahaman kebutuhan dan perluasan yang wajar, serta 8 item untuk efisiensi proses pembangunan. Setiap item menggunakan metode pemeriksaan dan kriteria kelulusan yang konsisten.

### Lapisan 1: Kualitas hasil pembangunan (46 item)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensi evaluasi</th><th>Item evaluasi terstandar</th></tr></thead>
  <tbody>
    <tr><td>Pemodelan data (8 item)</td><td><code>DM-01</code> Apakah semua Collection yang diperlukan telah dibuat<br /><code>DM-02</code> Apakah semua Field yang diperlukan tersedia<br /><code>DM-03</code> Apakah tipe Field sudah benar<br /><code>DM-04</code> Apakah relasi satu-ke-satu dapat dibuat dan digunakan<br /><code>DM-05</code> Apakah relasi satu-ke-banyak dapat dibuat dan digunakan<br /><code>DM-06</code> Apakah relasi banyak-ke-banyak dapat dibuat dan digunakan<br /><code>DM-07</code> Apakah aturan wajib, unik, dan nilai default berlaku<br /><code>DM-08</code> Apakah data terkait dapat dilihat dan difilter</td></tr>
    <tr><td>Penyelesaian fitur (6 item)</td><td><code>FC-01</code> Apakah semua halaman dan entry navigasi yang diperlukan tersedia<br /><code>FC-02</code> Apakah record dapat dibuat, dilihat, diedit, dan dihapus<br /><code>FC-03</code> Apakah alur pengguna inti dapat diselesaikan dari awal hingga akhir<br /><code>FC-04</code> Apakah tindakan bisnis utama tersedia<br /><code>FC-05</code> Apakah pencarian, filter, dan sorting tersedia<br /><code>FC-06</code> Apakah dashboard memuat konten yang diperlukan</td></tr>
    <tr><td>Logika bisnis (6 item)</td><td><code>BL-01</code> Apakah aturan transisi status peluang sudah benar<br /><code>BL-02</code> Apakah aturan validasi bisnis berlaku<br /><code>BL-03</code> Apakah Field perhitungan dan definisi statistik sudah benar<br /><code>BL-04</code> Apakah data dipetakan dengan benar setelah konversi lead<br /><code>BL-05</code> Apakah pembaruan pada record terkait tetap konsisten<br /><code>BL-06</code> Apakah aturan penghapusan dan pengarsipan sudah benar</td></tr>
    <tr><td>Permission dan keamanan (7 item)</td><td><code>ACL-01</code> Apakah semua Role yang diperlukan telah dibuat<br /><code>ACL-02</code> Apakah Pengguna uji dan penetapan Role sudah benar<br /><code>ACL-03</code> Apakah Permission akses halaman dan menu sudah benar<br /><code>ACL-04</code> Apakah Permission operasi data sudah benar<br /><code>ACL-05</code> Apakah cakupan data pada level record sudah benar<br /><code>ACL-06</code> Apakah Permission melihat dan mengedit pada level Field sudah benar<br /><code>ACL-07</code> Apakah perubahan Role dan kombinasi Role berfungsi dengan benar</td></tr>
    <tr><td>Otomatisasi Workflow (7 item)</td><td><code>WF-01</code> Apakah semua Workflow yang diperlukan telah dibuat dan diaktifkan<br /><code>WF-02</code> Apakah pemicu Workflow dirancang dengan benar<br /><code>WF-03</code> Apakah urutan node dan transfer data sudah benar<br /><code>WF-04</code> Apakah kondisi dan hasil cabang sudah benar<br /><code>WF-05</code> Apakah efek samping pembacaan dan penulisan record sudah benar<br /><code>WF-06</code> Apakah penerima dan isi notifikasi sudah benar<br /><code>WF-07</code> Apakah log kegagalan dan perilaku percobaan ulang dapat ditelusuri</td></tr>
    <tr><td>Pengalaman pengguna (7 item)</td><td><code>UX-01</code> Apakah navigasi dan arsitektur informasi sudah jelas<br /><code>UX-02</code> Apakah informasi daftar dan tindakan umum mudah digunakan<br /><code>UX-03</code> Apakah pengelompokan, urutan, dan panduan formulir sudah jelas<br /><code>UX-04</code> Apakah halaman detail membantu pemahaman dan tindakan tindak lanjut<br /><code>UX-05</code> Apakah umpan balik tindakan dan perubahan status sudah jelas<br /><code>UX-06</code> Apakah aplikasi dapat digunakan pada berbagai lebar layar<br /><code>UX-07</code> Apakah status kosong, loading, dan error sudah lengkap</td></tr>
    <tr><td>Ketangguhan (5 item)</td><td><code>ROB-01</code> Apakah input tidak valid dan input pada nilai batas ditangani dengan aman<br /><code>ROB-02</code> Apakah pengiriman duplikat menimbulkan efek samping duplikat<br /><code>ROB-03</code> Apakah data tetap konsisten saat eksekusi gagal<br /><code>ROB-04</code> Apakah aplikasi tetap dapat digunakan dengan dataset kosong dan berukuran besar<br /><code>ROB-05</code> Apakah aplikasi dapat pulih setelah sesi atau jaringan terputus</td></tr>
  </tbody>
</table>

### Lapisan 2: Pemahaman kebutuhan dan perluasan yang wajar (7 item)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensi evaluasi</th><th>Item evaluasi terstandar</th></tr></thead>
  <tbody>
    <tr><td>Cakupan kebutuhan (3 item)</td><td><code>COV-01</code> Apakah semua halaman dan tindakan yang diminta dalam prompt telah diterapkan<br /><code>COV-02</code> Apakah semua data, Permission, dan Workflow yang diminta dalam prompt telah diterapkan<br /><code>COV-03</code> Apakah kemampuan yang diperlukan oleh proses utama tetapi tidak disebutkan satu per satu dalam prompt tersedia</td></tr>
    <tr><td>Perluasan yang wajar (2 item)</td><td><code>EXT-01</code> Apakah Field, relasi, dan aturan yang ditambahkan secara proaktif memang diperlukan<br /><code>EXT-02</code> Apakah halaman, tindakan, dan statistik yang ditambahkan secara proaktif memiliki tujuan yang jelas</td></tr>
    <tr><td>Kontrol cakupan (2 item)</td><td><code>SCOPE-01</code> Apakah fitur dan konfigurasi yang duplikat atau tidak digunakan telah dihasilkan<br /><code>SCOPE-02</code> Apakah modul bisnis yang tidak terkait dengan cakupan tugas telah ditambahkan</td></tr>
  </tbody>
</table>

### Lapisan 3: Efisiensi proses pembangunan (8 item)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensi evaluasi</th><th>Item evaluasi terstandar</th></tr></thead>
  <tbody>
    <tr><td>Waktu hingga hasil pertama yang dapat digunakan (1 item)</td><td><code>EFF-FIRST-01</code> Waktu yang diperlukan untuk mencapai hasil pertama yang dapat digunakan</td></tr>
    <tr><td>Efisiensi konvergensi (3 item)</td><td><code>EFF-FINAL-01</code> Jumlah iterasi yang diperlukan untuk mencapai penerimaan akhir<br /><code>EFF-FINAL-02</code> Total waktu yang diperlukan untuk mencapai status akhir<br /><code>EFF-FINAL-03</code> Token yang digunakan untuk mencapai status akhir</td></tr>
    <tr><td>Intervensi manusia (1 item)</td><td><code>EFF-HUMAN-01</code> Jumlah intervensi manusia selama evaluasi</td></tr>
    <tr><td>Keterulangan (3 item)</td><td><code>EFF-STABLE-01</code> Apakah pengulangan tugas yang sama menghasilkan hasil penerimaan yang konsisten<br /><code>EFF-STABLE-02</code> Apakah Collection, relasi, Role, dan Workflow konsisten dalam tiga kali pengujian<br /><code>EFF-STABLE-03</code> Apakah variasi jumlah iterasi dan waktu tetap terkendali</td></tr>
  </tbody>
</table>

## Langkah berikutnya

- [Membangun Bersama AI Agent](./agent-workflow.md) — Deskripsikan halaman dan interaksi dengan bahasa natural, lalu lakukan iterasi secara berkelanjutan bersama AI Agent
- [Mulai Cepat AI Portal](./index.md) — Buat dan jalankan AI Portal pertama Anda
- [Pemodelan Data](../data-modeling.md) — Buat Collection, Field, dan relasi dengan bahasa natural
- [Manajemen Workflow](../workflow.md) — Buat, edit, aktifkan, dan lakukan diagnosis pada Workflow
- [Konfigurasi Permission](../acl.md) — Kelola Role, kebijakan Permission, penetapan Pengguna, dan penilaian risiko
