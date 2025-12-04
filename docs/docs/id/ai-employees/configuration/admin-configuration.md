:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Karyawan AI · Panduan Konfigurasi Administrator

> Dokumen ini akan membantu Anda memahami cara mengonfigurasi dan mengelola Karyawan AI dengan cepat, memandu Anda langkah demi langkah melalui seluruh proses, mulai dari layanan model hingga penugasan tugas.

## I. Sebelum Memulai

### 1. Persyaratan Sistem

Sebelum melakukan konfigurasi, pastikan lingkungan Anda memenuhi kondisi berikut:

*   **NocoBase 2.0 atau versi lebih tinggi** sudah terinstal
*   **Plugin Karyawan AI** sudah diaktifkan
*   Setidaknya satu **layanan Model Bahasa Besar** yang tersedia (misalnya, OpenAI, Claude, DeepSeek, GLM, dll.)

### 2. Memahami Desain Dua Lapisan Karyawan AI

Karyawan AI dibagi menjadi dua lapisan: **"Definisi Peran"** dan **"Kustomisasi Tugas"**.

| Lapisan            | Deskripsi                               | Karakteristik                     | Fungsi                        |
| :----------------- | :-------------------------------------- | :-------------------------------- | :---------------------------- |
| **Definisi Peran** | Kepribadian dasar dan kemampuan inti karyawan | Stabil dan tidak berubah, seperti "CV" | Memastikan konsistensi peran |
| **Kustomisasi Tugas** | Konfigurasi untuk skenario bisnis yang berbeda  | Fleksibel dan dapat disesuaikan   | Beradaptasi dengan tugas tertentu |

**Sederhananya:**

> "Definisi Peran" menentukan siapa karyawan ini,
> "Kustomisasi Tugas" menentukan apa yang sedang mereka lakukan saat ini.

Manfaat dari desain ini adalah:

*   Peran tetap konstan, tetapi dapat menangani skenario yang berbeda
*   Peningkatan atau penggantian tugas tidak memengaruhi karyawan itu sendiri
*   Latar belakang dan tugas bersifat independen, membuat pemeliharaan lebih mudah

## II. Proses Konfigurasi (5 Langkah Mudah)

### Langkah 1: Konfigurasi Layanan Model

Layanan model adalah seperti otak bagi Karyawan AI dan harus diatur terlebih dahulu.

> 💡 Untuk instruksi konfigurasi terperinci, silakan lihat: [Konfigurasi Layanan LLM](/ai-employees/quick-start/llm-service)

**Jalur:**
`Pengaturan Sistem → Karyawan AI → Layanan Model`

![Masuk halaman konfigurasi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klik **Tambah**, lalu isi informasi berikut:

| Item          | Deskripsi                                 | Catatan                                       |
| :------------ | :---------------------------------------- | :-------------------------------------------- |
| Tipe Antarmuka | Misalnya, OpenAI, Claude, dll.            | Kompatibel dengan layanan yang menggunakan spesifikasi yang sama |
| Kunci API     | Kunci yang disediakan oleh penyedia layanan | Jaga kerahasiaannya dan ganti secara berkala |
| Alamat Layanan | API Endpoint                              | Perlu dimodifikasi saat menggunakan proxy     |
| Nama Model    | Nama model spesifik (misalnya, gpt-4, claude-opus) | Memengaruhi kemampuan dan biaya               |

![Buat layanan model besar](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Setelah konfigurasi, silakan **uji koneksi**.
Jika gagal, periksa jaringan, kunci API, atau nama model Anda.

![Uji koneksi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Langkah 2: Buat Karyawan AI

> 💡 Untuk instruksi terperinci, silakan lihat: [Buat Karyawan AI](/ai-employees/quick-start/ai-employees)

Jalur: `Manajemen Karyawan AI → Buat Karyawan`

Isi informasi dasar:

| Bidang            | Wajib | Contoh             |
| :---------------- | :-- | :----------------- |
| Nama              | ✓   | viz, dex, cole     |
| Nama Panggilan    | ✓   | Viz, Dex, Cole     |
| Status Aktif      | ✓   | Aktif              |
| Bio               | -   | "Pakar Analisis Data" |
| Prompt Utama      | ✓   | Lihat Panduan Rekayasa Prompt |
| Pesan Selamat Datang | -   | "Halo, saya Viz…"   |

![Konfigurasi informasi dasar](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Kemudian, ikat **layanan model** yang baru saja Anda konfigurasikan.

![Ikat layanan model besar](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Saran Penulisan Prompt:**

*   Jelaskan dengan jelas peran, nada, dan tanggung jawab karyawan
*   Gunakan kata-kata seperti "harus" dan "tidak pernah" untuk menekankan aturan
*   Sertakan contoh jika memungkinkan untuk menghindari deskripsi abstrak
*   Batasi antara 500–1000 karakter

> Semakin jelas prompt, semakin stabil kinerja AI.
> Anda dapat merujuk ke [Panduan Rekayasa Prompt](./prompt-engineering-guide.md).

### Langkah 3: Konfigurasi Keterampilan

Keterampilan menentukan apa yang "bisa dilakukan" oleh seorang karyawan.

> 💡 Untuk instruksi terperinci, silakan lihat: [Keterampilan](/ai-employees/advanced/skill)

| Tipe       | Lingkup Kemampuan        | Contoh                        | Tingkat Risiko      |
| :--------- | :----------------------- | :---------------------------- | :------------------ |
| Frontend   | Interaksi halaman        | Membaca data blok, mengisi formulir | Rendah              |
| Model Data | Kueri dan analisis data  | Statistik agregat             | Sedang              |
| Alur Kerja | Menjalankan proses bisnis | Alat kustom                   | Tergantung pada alur kerja |
| Lainnya    | Ekstensi eksternal       | Pencarian web, operasi file   | Bervariasi          |

**Saran Konfigurasi:**

*   3–5 keterampilan per karyawan adalah yang paling sesuai
*   Tidak disarankan untuk memilih semua keterampilan, karena dapat menyebabkan kebingungan
*   Nonaktifkan penggunaan otomatis (Auto usage) sebelum operasi penting

![Konfigurasi keterampilan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Langkah 4: Konfigurasi Basis Pengetahuan (Opsional)

Jika Karyawan AI Anda perlu mengingat atau merujuk banyak materi, seperti manual produk, FAQ, dll., Anda dapat mengonfigurasi basis pengetahuan.

> 💡 Untuk instruksi terperinci, silakan lihat:
> - [Ikhtisar Basis Pengetahuan AI](/ai-employees/knowledge-base/index)
> - [Database Vektor](/ai-employees/knowledge-base/vector-database)
> - [Konfigurasi Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Ini memerlukan instalasi plugin database vektor tambahan.

![Konfigurasi basis pengetahuan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Skenario yang Berlaku:**

*   Agar AI memahami pengetahuan perusahaan
*   Untuk mendukung tanya jawab dan pengambilan dokumen
*   Untuk melatih asisten khusus domain

### Langkah 5: Verifikasi Hasil

Setelah selesai, Anda akan melihat avatar karyawan baru di sudut kanan bawah halaman.

![Verifikasi konfigurasi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Harap periksa setiap item:

*   ✅ Apakah ikon ditampilkan dengan benar?
*   ✅ Bisakah ia melakukan percakapan dasar?
*   ✅ Bisakah keterampilan dipanggil dengan benar?

Jika semua berhasil, berarti konfigurasi sukses 🎉

## III. Konfigurasi Tugas: Membuat AI Benar-benar Bekerja

Yang telah kita lakukan sejauh ini adalah "membuat karyawan".
Selanjutnya adalah membuat mereka "bekerja".

Tugas AI mendefinisikan perilaku karyawan pada halaman atau blok tertentu.

> 💡 Untuk instruksi terperinci, silakan lihat: [Tugas](/ai-employees/advanced/task)

### 1. Tugas Tingkat Halaman

Berlaku untuk seluruh cakupan halaman, seperti "Analisis data di halaman ini".

**Entri Konfigurasi:**
`Pengaturan Halaman → Karyawan AI → Tambah Tugas`

| Bidang          | Deskripsi                    | Contoh                    |
| :-------------- | :--------------------------- | :------------------------ |
| Judul           | Nama tugas                   | Analisis Konversi Tahap   |
| Konteks         | Konteks halaman saat ini     | Halaman daftar Leads      |
| Pesan Default   | Pembuka percakapan prasetel  | "Harap analisis tren bulan ini" |
| Blok Default    | Otomatis terkait dengan koleksi | tabel leads               |
| Keterampilan    | Alat yang tersedia           | Kueri data, buat bagan    |

![Konfigurasi tugas tingkat halaman](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Dukungan Multi-tugas:**
Satu Karyawan AI dapat dikonfigurasi dengan beberapa tugas, yang disajikan sebagai opsi untuk dipilih pengguna:

![Dukungan multi-tugas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Saran:

*   Satu tugas harus fokus pada satu tujuan
*   Nama harus jelas dan mudah dimengerti
*   Batasi jumlah tugas antara 5–7

### 2. Tugas Tingkat Blok

Cocok untuk beroperasi pada blok tertentu, seperti "Terjemahkan formulir saat ini".

**Metode Konfigurasi:**

1.  Buka konfigurasi tindakan blok
2.  Tambahkan "Karyawan AI"

![Tombol Tambah Karyawan AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Ikat karyawan target

![Pilih Karyawan AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Konfigurasi tugas tingkat blok](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Perbandingan  | Tingkat Halaman | Tingkat Blok            |
| :------------ | :-------------- | :---------------------- |
| Cakupan Data  | Seluruh halaman | Blok saat ini           |
| Granularitas  | Analisis global | Pemrosesan detail       |
| Penggunaan Umum | Analisis tren   | Terjemahan formulir, ekstraksi bidang |

## IV. Praktik Terbaik

### 1. Saran Konfigurasi

| Item               | Saran                           | Alasan                          |
| :----------------- | :------------------------------ | :------------------------------ |
| Jumlah Keterampilan | 3–5                             | Akurasi tinggi, respons cepat   |
| Penggunaan otomatis | Aktifkan dengan hati-hati       | Mencegah operasi yang tidak disengaja |
| Panjang Prompt     | 500–1000 karakter               | Menyeimbangkan kecepatan dan kualitas |
| Tujuan Tugas       | Tunggal dan jelas               | Menghindari kebingungan AI      |
| Alur kerja         | Gunakan setelah mengemas tugas kompleks | Tingkat keberhasilan lebih tinggi |

### 2. Saran Praktis

**Mulai dari kecil, optimalkan secara bertahap:**

1.  Pertama, buat karyawan dasar (misalnya, Viz, Dex)
2.  Aktifkan 1–2 keterampilan inti untuk pengujian
3.  Konfirmasikan bahwa tugas dapat dijalankan dengan normal
4.  Kemudian, secara bertahap perluas dengan lebih banyak keterampilan dan tugas

**Proses optimasi berkelanjutan:**

1.  Jalankan versi awal
2.  Kumpulkan umpan balik pengguna
3.  Optimalkan prompt dan konfigurasi tugas
4.  Uji dan tingkatkan secara berulang

## V. Pertanyaan yang Sering Diajukan (FAQ)

### 1. Tahap Konfigurasi

**T: Bagaimana jika penyimpanan gagal?**
J: Periksa apakah semua bidang wajib sudah diisi, terutama layanan model dan prompt.

**T: Model mana yang harus saya pilih?**

*   Terkait kode → Claude, GPT-4
*   Terkait analisis → Claude, DeepSeek
*   Sensitif biaya → Qwen, GLM
*   Teks panjang → Gemini, Claude

### 2. Tahap Penggunaan

**T: Respons AI terlalu lambat?**

*   Kurangi jumlah keterampilan
*   Optimalkan prompt
*   Periksa latensi layanan model
*   Pertimbangkan untuk mengganti model

**T: Eksekusi tugas tidak akurat?**

*   Prompt tidak cukup jelas
*   Terlalu banyak keterampilan menyebabkan kebingungan
*   Pecah tugas menjadi bagian yang lebih kecil, tambahkan contoh

**T: Kapan penggunaan otomatis (Auto usage) harus diaktifkan?**

*   Dapat diaktifkan untuk tugas-tugas bertipe kueri
*   Disarankan untuk menonaktifkannya untuk tugas-tugas modifikasi data

**T: Bagaimana cara membuat AI memproses formulir tertentu?**

J: Jika ini adalah konfigurasi tingkat halaman, Anda perlu memilih blok secara manual.

![Pilih blok secara manual](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Untuk konfigurasi tugas tingkat blok, konteks data secara otomatis terikat.

## VI. Bacaan Lebih Lanjut

Untuk membuat Karyawan AI Anda lebih kuat, Anda dapat melanjutkan membaca dokumen berikut:

**Terkait Konfigurasi:**

*   [Panduan Rekayasa Prompt](./prompt-engineering-guide.md) - Teknik dan praktik terbaik untuk menulis prompt berkualitas tinggi
*   [Konfigurasi Layanan LLM](/ai-employees/quick-start/llm-service) - Instruksi konfigurasi terperinci untuk layanan model besar
*   [Buat Karyawan AI](/ai-employees/quick-start/ai-employees) - Pembuatan dan konfigurasi dasar Karyawan AI
*   [Berkolaborasi dengan Karyawan AI](/ai-employees/quick-start/collaborate) - Cara melakukan percakapan yang efektif dengan Karyawan AI

**Fitur Lanjutan:**

*   [Keterampilan](/ai-employees/advanced/skill) - Pemahaman mendalam tentang konfigurasi dan penggunaan berbagai keterampilan
*   [Tugas](/ai-employees/advanced/task) - Teknik lanjutan untuk konfigurasi tugas
*   [Pilih Blok](/ai-employees/advanced/pick-block) - Cara menentukan blok data untuk Karyawan AI
*   [Sumber Data](/ai-employees/advanced/datasource) - Konfigurasi dan manajemen sumber data
*   [Pencarian Web](/ai-employees/advanced/web-search) - Mengonfigurasi kemampuan pencarian web untuk Karyawan AI

**Basis Pengetahuan & RAG:**

*   [Ikhtisar Basis Pengetahuan AI](/ai-employees/knowledge-base/index) - Pengantar fitur basis pengetahuan
*   [Database Vektor](/ai-employees/knowledge-base/vector-database) - Konfigurasi database vektor
*   [Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base) - Cara membuat dan mengelola basis pengetahuan
*   [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Aplikasi teknologi RAG

**Integrasi Alur Kerja:**

*   [Node LLM - Obrolan Teks](/ai-employees/workflow/nodes/llm/chat) - Menggunakan obrolan teks dalam alur kerja
*   [Node LLM - Obrolan Multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Menangani input multimodal seperti gambar dan file
*   [Node LLM - Output Terstruktur](/ai-employees/workflow/nodes/llm/structured-output) - Mendapatkan respons AI terstruktur

## Kesimpulan

Hal terpenting saat mengonfigurasi Karyawan AI adalah: **jalankan dulu, lalu optimalkan**.
Pertama, pastikan karyawan pertama Anda berhasil bekerja, lalu secara bertahap perluas dan sesuaikan.

Anda dapat melakukan pemecahan masalah dengan urutan berikut:

1.  Apakah layanan model terhubung?
2.  Apakah jumlah keterampilan terlalu banyak?
3.  Apakah prompt sudah jelas?
4.  Apakah tujuan tugas sudah terdefinisi dengan baik?

Selama Anda melangkah selangkah demi selangkah, Anda dapat membangun tim AI yang benar-benar efisien.