---
pkg: "@nocobase/plugin-ai"
title: "Panduan Konfigurasi Administrator Karyawan AI"
description: "Konfigurasi Karyawan AI dalam 5 langkah: layanan model, membuat karyawan, mengonfigurasi Skills, Basis Pengetahuan, validasi efek; konfigurasi tugas tingkat halaman dan tingkat Block; praktik terbaik dan pertanyaan umum."
keywords: "Konfigurasi Karyawan AI,Panduan Administrator,LLM Service,Konfigurasi Tugas,Konfigurasi Skills,NocoBase"
---

# Karyawan AI · Panduan Konfigurasi Administrator

> Dokumentasi ini membantu Anda memahami dengan cepat cara mengonfigurasi dan mengelola Karyawan AI, dari layanan model hingga deployment tugas, memandu Anda melalui seluruh proses.


## Satu. Sebelum Mulai

### 1. Persyaratan Sistem

Sebelum konfigurasi, harap pastikan lingkungan Anda memenuhi kondisi berikut:

* Telah memasang **NocoBase 2.0 atau versi yang lebih tinggi**
* Telah mengaktifkan **Plugin Karyawan AI**
* Memiliki setidaknya satu **layanan model bahasa besar** yang tersedia (seperti OpenAI, Claude, DeepSeek, GLM, dll)


### 2. Memahami Desain Dua Lapisan Karyawan AI

Karyawan AI dibagi menjadi dua lapisan: **"Definisi Role"** dan **"Kustomisasi Tugas"**.

| Tingkat | Penjelasan | Karakteristik | Fungsi |
| ------- | ---------- | ------------- | ------ |
| **Definisi Role** | Persona dasar dan kemampuan inti karyawan | Stabil tidak berubah, seperti "CV" | Memastikan konsistensi role |
| **Kustomisasi Tugas** | Konfigurasi untuk skenario bisnis berbeda | Penyesuaian fleksibel | Beradaptasi dengan tugas spesifik |

**Pemahaman Sederhana:**

> "Definisi Role" menentukan siapa karyawan ini,
> "Kustomisasi Tugas" menentukan apa yang harus dilakukannya saat ini.

Manfaat desain seperti ini:

* Role tidak berubah, namun dapat menangani skenario berbeda
* Upgrade atau penggantian tugas tidak akan memengaruhi karyawan itu sendiri
* Latar belakang dan tugas saling independen, pemeliharaan lebih mudah


## Dua. Alur Konfigurasi (Selesai dalam 5 Langkah)

### Langkah 1: Konfigurasi Layanan Model

Layanan model setara dengan otak Karyawan AI, harus diatur terlebih dahulu.

> 💡 Penjelasan konfigurasi detail silakan rujuk: [Konfigurasi LLM Service](/ai-employees/features/llm-service)

**Path:**
`Pengaturan Sistem → Karyawan AI → LLM service`

![Masuk ke Halaman Konfigurasi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klik **Tambah**, isi informasi berikut:

| Item | Penjelasan | Catatan |
| ---- | ---------- | ------- |
| Provider | Seperti OpenAI, Claude, Gemini, Kimi, dll | Layanan yang kompatibel dengan standar yang sama |
| API Key | Key yang disediakan oleh penyedia layanan | Rahasiakan dan ganti secara berkala |
| Base URL | API Endpoint (opsional) | Perlu dimodifikasi saat menggunakan proxy |
| Enabled Models | Model rekomendasi / pilih model / input manual | Menentukan cakupan model yang dapat diganti dalam sesi |

![Membuat Layanan Model Besar](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Setelah konfigurasi harap gunakan `Test flight` untuk **menguji koneksi**.
Jika gagal, periksa jaringan, key, atau nama model.

![Test Koneksi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Langkah 2: Buat Karyawan AI

> 💡 Penjelasan detail silakan rujuk: [Buat Karyawan AI](/ai-employees/features/new-ai-employees)

Path: `Manajemen Karyawan AI → Buat Karyawan`

Isi informasi dasar:

| Field | Wajib | Contoh |
| ----- | ----- | ------ |
| Nama | ✓ | viz, dex, cole |
| Nickname | ✓ | Viz, Dex, Cole |
| Status Aktif | ✓ | Aktif |
| Pengantar | - | "Pakar Analisis Data" |
| Prompt Utama | ✓ | Lihat panduan prompt engineering |
| Pesan Sambutan | - | "Halo, saya Viz…" |

![Konfigurasi Informasi Dasar](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Tahap pembuatan karyawan terutama menyelesaikan konfigurasi role dan Skills. Model yang sebenarnya digunakan dapat dipilih dalam sesi melalui `Model Switcher`.

**Saran Penulisan Prompt:**

* Jelaskan dengan jelas role, gaya bahasa, dan tanggung jawab karyawan
* Gunakan kata-kata seperti "harus", "tidak boleh" untuk menekankan aturan
* Sertakan contoh sebanyak mungkin, hindari penjelasan abstrak
* Kontrol antara 500-1000 karakter

> Semakin jelas prompt, semakin stabil kinerja AI.
> Dapat merujuk [Panduan Prompt Engineering](./prompt-engineering-guide.md).


### Langkah 3: Konfigurasi Skills

Skills menentukan "apa yang dapat dilakukan" karyawan.

> 💡 Penjelasan detail silakan rujuk: [Skills](/ai-employees/features/tools)

| Tipe | Cakupan Kemampuan | Contoh | Tingkat Risiko |
| ---- | ----------------- | ------ | -------------- |
| Frontend | Interaksi halaman | Membaca data Block, mengisi formulir | Rendah |
| Model Data | Query dan analisis data | Statistik agregasi | Sedang |
| Workflow | Menjalankan proses bisnis | Tools kustom | Tergantung Workflow |
| Lainnya | Ekstensi eksternal | Pencarian web, operasi file | Tergantung situasi |

**Saran Konfigurasi:**

* Setiap karyawan paling cocok 3-5 Skills
* Tidak disarankan memilih semua, mudah membingungkan
* Operasi penting disarankan menggunakan Permission `Ask`, bukan `Allow`

![Konfigurasi Skills](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Langkah 4: Konfigurasi Basis Pengetahuan (Opsional)

Jika Karyawan AI Anda perlu mengingat atau mereferensikan banyak materi, seperti manual produk, FAQ, dll, Anda dapat mengonfigurasi Basis Pengetahuan.

> 💡 Penjelasan detail silakan rujuk:
> - [Ikhtisar Basis Pengetahuan AI](/ai-employees/knowledge-base/index)
> - [Vector Database](/ai-employees/knowledge-base/vector-database)
> - [Konfigurasi Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base)
> - [RAG Retrieval Augmented Generation](/ai-employees/knowledge-base/rag)

Ini memerlukan instalasi tambahan Plugin vector database.

![Konfigurasi Basis Pengetahuan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Skenario Penggunaan:**

* Membuat AI memahami pengetahuan perusahaan
* Mendukung Q&A dan retrieval dokumen
* Melatih asisten domain khusus


### Langkah 5: Validasi Efek

Setelah selesai, Anda akan melihat avatar karyawan baru di pojok kanan bawah halaman.

![Validasi Konfigurasi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Harap periksa item demi item:

* ✅ Apakah ikon ditampilkan normal
* ✅ Apakah dapat melakukan dialog dasar
* ✅ Apakah Skills dapat dipanggil dengan benar

Jika semuanya lulus, berarti konfigurasi berhasil 🎉


## Tiga. Konfigurasi Tugas: Membuat AI Benar-benar Bekerja

Yang diselesaikan sebelumnya adalah "membuat karyawan",
selanjutnya membuat mereka "bekerja".

Tugas AI mendefinisikan perilaku karyawan di halaman atau Block tertentu.

> 💡 Penjelasan detail silakan rujuk: [Tugas](/ai-employees/features/task)


### 1. Tugas Tingkat Halaman

Cocok untuk seluruh cakupan halaman, seperti "menganalisis data halaman ini".

**Entry Konfigurasi:**
`Pengaturan Halaman → Karyawan AI → Tambah Tugas`

| Field | Penjelasan | Contoh |
| ----- | ---------- | ------ |
| Judul | Nama tugas | Analisis Konversi Tahap |
| Latar Belakang | Konteks halaman saat ini | Halaman daftar Leads |
| Pesan Default | Dialog preset | "Tolong analisis tren bulan ini" |
| Block Default | Tabel data terkait otomatis | Tabel leads |
| Skills | Tools yang tersedia | Query data, hasilkan grafik |

![Konfigurasi Tugas Tingkat Halaman](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Dukungan Multi-Tugas:**
Karyawan AI yang sama dapat dikonfigurasi dengan beberapa tugas, dalam bentuk opsi untuk dipilih Pengguna:

![Dukungan Multi-Tugas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Saran:

* Satu tugas fokus pada satu tujuan
* Nama jelas dan mudah dipahami
* Jumlah tugas dikontrol dalam 5-7

### 2. Tugas Tingkat Block

Cocok untuk mengoperasikan Block tertentu, seperti "menerjemahkan formulir saat ini".

**Cara Konfigurasi:**

1. Buka konfigurasi action Block
2. Tambah "Karyawan AI"

![Tombol Tambah Karyawan AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Ikat karyawan target

![Pilih Karyawan AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Konfigurasi Tugas Tingkat Block](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Item Perbandingan | Tingkat Halaman | Tingkat Block |
| ----------------- | --------------- | ------------- |
| Cakupan Data | Seluruh halaman | Block saat ini |
| Granularitas | Analisis global | Pemrosesan detail |
| Penggunaan Tipikal | Analisis tren | Terjemahan formulir, ekstraksi Field |


## Empat. Praktik Terbaik

### 1. Saran Konfigurasi

| Item | Saran | Alasan |
| ---- | ----- | ------ |
| Jumlah Skills | 3-5 | Akurasi tinggi, respon cepat |
| Mode Permission (Ask / Allow) | Modifikasi data disarankan Ask | Mencegah operasi keliru |
| Panjang Prompt | 500-1000 karakter | Menyeimbangkan kecepatan dan kualitas |
| Tujuan Tugas | Tunggal dan jelas | Hindari AI bingung |
| Workflow | Bungkus tugas kompleks sebelum digunakan | Tingkat keberhasilan lebih tinggi |


### 2. Saran Praktik

**Dari Kecil ke Besar, Optimalkan Bertahap:**

1. Pertama buat karyawan dasar (seperti Viz, Dex)
2. Aktifkan 1-2 Skills inti untuk pengujian
3. Konfirmasi dapat menjalankan tugas dengan normal
4. Kemudian secara bertahap memperluas lebih banyak Skills dan tugas

**Alur Optimasi Berkelanjutan:**

1. Versi awal dapat berjalan
2. Kumpulkan feedback penggunaan
3. Optimalkan prompt dan konfigurasi tugas
4. Test dan perbaikan berulang


## Lima. Pertanyaan Umum

### 1. Tahap Konfigurasi

**Q: Apa yang harus dilakukan jika save gagal?**
A: Periksa apakah semua item wajib telah diisi, terutama layanan model dan prompt.

**Q: Model mana yang harus dipilih?**

* Tipe kode → Claude, GPT-4
* Tipe analisis → Claude, DeepSeek
* Sensitif biaya → Qwen, GLM
* Teks panjang → Gemini, Claude


### 2. Tahap Penggunaan

**Q: Respon AI terlalu lambat?**

* Kurangi jumlah Skills
* Optimalkan prompt
* Periksa latensi layanan model
* Dapat mempertimbangkan ganti model

**Q: Eksekusi tugas tidak akurat?**

* Prompt tidak cukup jelas
* Terlalu banyak Skills menyebabkan kebingungan
* Pecah tugas menjadi lebih kecil, tambahkan contoh

**Q: Kapan memilih Ask / Allow?**

* Tugas tipe query dapat menggunakan `Allow`
* Tugas tipe modifikasi data disarankan menggunakan `Ask`

**Q: Bagaimana membuat AI menangani formulir tertentu?**

A: Jika konfigurasi tingkat halaman, perlu mengklik Block secara manual.

![Klik Block Secara Manual](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Jika konfigurasi tugas tingkat Block, otomatis mengikat konteks data.


## Enam. Bacaan Lanjutan

Untuk membuat Karyawan AI lebih kuat, dapat melanjutkan membaca dokumentasi berikut:

**Terkait Konfigurasi:**

* [Panduan Prompt Engineering](./prompt-engineering-guide.md) - Teknik dan praktik terbaik untuk menulis prompt berkualitas tinggi
* [Konfigurasi LLM Service](/ai-employees/features/llm-service) - Penjelasan detail konfigurasi layanan model besar
* [Buat Karyawan AI](/ai-employees/features/new-ai-employees) - Pembuatan dan konfigurasi dasar Karyawan AI
* [Berkolaborasi dengan Karyawan AI](/ai-employees/features/collaborate) - Bagaimana melakukan dialog efektif dengan Karyawan AI

**Fitur Lanjutan:**

* [Skills](/ai-employees/features/tools) - Pelajari secara mendalam konfigurasi dan penggunaan berbagai jenis Skills
* [Tugas](/ai-employees/features/task) - Teknik lanjutan konfigurasi tugas
* [Pilih Block](/ai-employees/features/pick-block) - Bagaimana menentukan Block data untuk Karyawan AI
* Data Source - Silakan rujuk dokumentasi konfigurasi data source dari Plugin terkait
* [Pencarian Web](/ai-employees/features/web-search) - Konfigurasi kemampuan pencarian web Karyawan AI

**Basis Pengetahuan dan RAG:**

* [Ikhtisar Basis Pengetahuan AI](/ai-employees/knowledge-base/index) - Pengantar fitur Basis Pengetahuan
* [Vector Database](/ai-employees/knowledge-base/vector-database) - Konfigurasi vector database
* [Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base) - Bagaimana membuat dan mengelola Basis Pengetahuan
* [RAG Retrieval Augmented Generation](/ai-employees/knowledge-base/rag) - Aplikasi teknologi RAG

**Integrasi Workflow:**

* [Node LLM - Dialog Teks](/ai-employees/workflow/nodes/llm/chat) - Menggunakan dialog teks dalam Workflow
* [Node LLM - Dialog Multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Memproses input multimodal seperti gambar, file
* [Node LLM - Output Terstruktur](/ai-employees/workflow/nodes/llm/structured-output) - Mendapatkan respons AI terstruktur


## Penutup

Hal terpenting saat mengonfigurasi Karyawan AI adalah: **jalankan dulu, optimalkan kemudian**.
Pertama buat karyawan pertama berhasil bekerja, kemudian secara bertahap perluas dan fine-tune.

Arah troubleshooting dapat dilakukan dalam urutan berikut:

1. Apakah layanan model terhubung
2. Apakah jumlah Skills terlalu banyak
3. Apakah prompt jelas
4. Apakah tujuan tugas jelas

Selama dilakukan secara bertahap, Anda dapat membangun tim AI yang benar-benar efisien.
