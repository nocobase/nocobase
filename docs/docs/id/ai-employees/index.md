---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/ai-employees/index).
:::

# Ringkasan

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Pegawai AI (`AI Employees`) adalah kemampuan agen cerdas yang terintegrasi secara mendalam dalam sistem bisnis NocoBase.

Ini bukan sekadar robot "yang hanya bisa mengobrol", melainkan "rekan kerja digital" yang dapat memahami konteks secara langsung di antarmuka bisnis dan melakukan tindakan:

- **Memahami konteks bisnis**: Merasakan halaman saat ini, blok, struktur data, dan konten yang dipilih.
- **Dapat langsung mengeksekusi tindakan**: Dapat memanggil keterampilan untuk menyelesaikan tugas seperti kueri, analisis, pengisian, konfigurasi, dan pembuatan.
- **Kolaborasi berbasis peran**: Mengonfigurasi pegawai yang berbeda sesuai posisi, dan beralih model dalam percakapan untuk berkolaborasi.

## Jalur Memulai 5 Menit

Lihat [Memulai Cepat](/ai-employees/quick-start) terlebih dahulu, dan selesaikan konfigurasi minimum yang tersedia sesuai urutan berikut:

1. Konfigurasi setidaknya satu [Layanan LLM](/ai-employees/features/llm-service).
2. Aktifkan setidaknya satu [Pegawai AI](/ai-employees/features/enable-ai-employee).
3. Buka percakapan dan mulai [berkolaborasi dengan Pegawai AI](/ai-employees/features/collaborate).
4. Aktifkan [Pencarian Web](/ai-employees/features/web-search) dan [Tugas Pintasan](/ai-employees/features/task) sesuai kebutuhan.

## Peta Fitur

### A. Konfigurasi Dasar (Administrator)

- [Konfigurasi Layanan LLM](/ai-employees/features/llm-service): Menghubungkan Provider, mengonfigurasi dan mengelola model yang tersedia.
- [Mengaktifkan Pegawai AI](/ai-employees/features/enable-ai-employee): Mengaktifkan/menonaktifkan pegawai bawaan, mengontrol cakupan ketersediaan.
- [Pegawai AI Baru](/ai-employees/features/new-ai-employees): Mendefinisikan peran, pengaturan peran, pesan sambutan, dan batasan kemampuan.
- [Menggunakan Keterampilan](/ai-employees/features/tool): Mengonfigurasi izin keterampilan (`Ask` / `Allow`), mengontrol risiko eksekusi.

### B. Kolaborasi Harian (Pengguna Bisnis)

- [Berkolaborasi dengan Pegawai AI](/ai-employees/features/collaborate): Beralih pegawai dan model dalam percakapan, kolaborasi berkelanjutan.
- [Menambahkan Konteks - Blok](/ai-employees/features/pick-block): Mengirim blok halaman sebagai konteks ke AI.
- [Tugas Pintasan](/ai-employees/features/task): Menyetel tugas umum pada halaman/blok, eksekusi dengan satu klik.
- [Pencarian Web](/ai-employees/features/web-search): Mengaktifkan jawaban yang ditingkatkan dengan pengambilan informasi saat membutuhkan informasi terbaru.

### C. Kemampuan Lanjutan (Ekstensi)

- [Pegawai AI Bawaan](/ai-employees/features/built-in-employee): Memahami posisi dan skenario penggunaan pegawai yang telah ditentukan sebelumnya.
- [Kontrol Izin](/ai-employees/permission): Mengontrol akses pegawai, keterampilan, dan data sesuai model izin organisasi.
- [Basis Pengetahuan AI](/ai-employees/knowledge-base/index): Memasukkan pengetahuan perusahaan, meningkatkan stabilitas dan ketertelusuran jawaban.
- [Node LLM Alur Kerja](/ai-employees/workflow/nodes/llm/chat): Menyusun kemampuan AI ke dalam alur kerja otomatis.

## Konsep Inti (Disarankan untuk diselaraskan terlebih dahulu)

Istilah-istilah berikut konsisten dengan glosarium, disarankan untuk digunakan secara seragam dalam tim:

- **Pegawai AI (AI Employee)**: Agen yang dapat dieksekusi yang terdiri dari pengaturan peran (Role setting) dan keterampilan (Tool / Skill).
- **Layanan LLM (LLM Service)**: Unit akses model dan konfigurasi kemampuan, digunakan untuk mengelola Provider dan daftar model.
- **Penyedia (Provider)**: Pemasok model di balik Layanan LLM.
- **Model yang Diaktifkan (Enabled Models)**: Kumpulan model yang diizinkan untuk dipilih dalam percakapan pada Layanan LLM saat ini.
- **Peralih Pegawai AI (AI Employee Switcher)**: Beralih pegawai kolaborasi saat ini dalam percakapan.
- **Peralih Model (Model Switcher)**: Beralih model dalam percakapan, dan mengingat preferensi berdasarkan dimensi pegawai.
- **Keterampilan (Tool / Skill)**: Unit kemampuan eksekusi yang dapat dipanggil oleh AI.
- **Izin Keterampilan (Permission: Ask / Allow)**: Apakah memerlukan konfirmasi manual sebelum pemanggilan keterampilan.
- **Konteks (Context)**: Informasi lingkungan bisnis seperti halaman, blok, dan struktur data.
- **Percakapan (Chat)**: Proses interaksi berkelanjutan antara pengguna dan Pegawai AI.
- **Pencarian Web (Web Search)**: Kemampuan untuk melengkapi informasi waktu nyata berdasarkan pengambilan eksternal.
- **Basis Pengetahuan (Knowledge Base / RAG)**: Memasukkan pengetahuan perusahaan melalui Retrieval-Augmented Generation.
- **Penyimpanan Vektor (Vector Store)**: Penyimpanan tervektorisasi yang menyediakan kemampuan pencarian semantik untuk basis pengetahuan.

## Instruksi Instalasi

Pegawai AI adalah plugin bawaan NocoBase (`@nocobase/plugin-ai`), siap digunakan tanpa perlu instalasi terpisah.