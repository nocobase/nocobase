:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/ai-employees/configuration/admin-configuration).
:::

# AI Karyawan · Panduan Konfigurasi Administrator

> Dokumen ini membantu Anda memahami dengan cepat cara mengonfigurasi dan mengelola AI Karyawan, mulai dari layanan model hingga penugasan tugas, memandu Anda langkah demi langkah melalui seluruh proses.


## I. Sebelum Memulai

### 1. Persyaratan Sistem

Sebelum melakukan konfigurasi, pastikan lingkungan Anda memenuhi kondisi berikut:

* Sudah terinstal **NocoBase 2.0 atau versi lebih tinggi**
* Sudah mengaktifkan **plugin AI Karyawan**
* Setidaknya memiliki satu **layanan model bahasa besar** (LLM) yang tersedia (seperti OpenAI, Claude, DeepSeek, GLM, dll.)


### 2. Memahami Desain Dua Lapis AI Karyawan

AI Karyawan dibagi menjadi dua lapisan: **"Definisi Peran"** dan **"Kustomisasi Tugas"**.

| Tingkatan | Penjelasan | Karakteristik | Peran |
| -------- | ------------ | ---------- | ------- |
| **Definisi Peran** | Kepribadian dasar dan kemampuan inti karyawan | Stabil, seperti "resume" | Memastikan konsistensi peran |
| **Kustomisasi Tugas** | Konfigurasi untuk berbagai skenario bisnis | Fleksibel | Menyesuaikan dengan tugas spesifik |

**Pemahaman Sederhana:**

> "Definisi Peran" menentukan siapa karyawan ini,
> "Kustomisasi Tugas" menentukan apa yang harus ia lakukan saat ini.

Keuntungan dari desain ini adalah:

* Peran tetap sama, tetapi dapat menangani berbagai skenario
* Memperbarui atau mengganti tugas tidak akan memengaruhi karyawan itu sendiri
* Latar belakang dan tugas saling independen, sehingga pemeliharaan lebih mudah


## II. Alur Konfigurasi (5 Langkah Selesai)

### Langkah 1: Konfigurasi Layanan Model

Layanan model setara dengan otak AI Karyawan, sehingga harus diatur terlebih dahulu.

> 💡 Untuk instruksi konfigurasi terperinci, silakan merujuk ke: [Konfigurasi Layanan LLM](/ai-employees/features/llm-service)

**Jalur:**
`Pengaturan Sistem → AI Karyawan → LLM service`

![Masuk halaman konfigurasi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klik **Tambah**, lalu isi informasi berikut:

| Item | Penjelasan | Catatan |
| ------ | -------------------------- | --------- |
| Provider | Seperti OpenAI, Claude, Gemini, Kimi, dll. | Kompatibel dengan layanan berspesifikasi sama |
| API Key | Kunci yang disediakan oleh penyedia layanan | Rahasiakan dan ganti secara berkala |
| Base URL | API Endpoint (opsional) | Perlu diubah jika menggunakan proxy |
| Enabled Models | Model yang direkomendasikan / Pilih model / Input manual | Menentukan rentang model yang dapat dialihkan dalam obrolan |

![Membuat layanan model besar](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Setelah konfigurasi, silakan gunakan `Test flight` untuk **menguji koneksi**.
Jika gagal, periksa jaringan, kunci API, atau nama model.

![Uji koneksi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Langkah 2: Membuat AI Karyawan

> 💡 Untuk instruksi terperinci, silakan merujuk ke: [Membuat AI Karyawan](/ai-employees/features/new-ai-employees)

Jalur: `Manajemen AI Karyawan → Membuat Karyawan`

Isi informasi dasar:

| Bidang | Wajib | Contoh |
| ----- | -- | -------------- |
| Nama | ✓ | viz, dex, cole |
| Nama Panggilan | ✓ | Viz, Dex, Cole |
| Status Aktif | ✓ | Aktif |
| Bio | - | "Pakar Analisis Data" |
| Prompt Utama | ✓ | Lihat Panduan Rekayasa Prompt |
| Pesan Selamat Datang | - | "Halo, saya Viz…" |

![Konfigurasi informasi dasar](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Pada tahap pembuatan karyawan, fokus utama adalah konfigurasi peran dan keterampilan. Model yang sebenarnya digunakan dapat dipilih melalui `Model Switcher` di dalam obrolan.

**Saran Penulisan Prompt:**

* Jelaskan dengan jelas peran, nada bicara, dan tanggung jawab karyawan
* Gunakan kata "harus" atau "tidak boleh" untuk menekankan aturan
* Usahakan menyertakan contoh untuk menghindari penjelasan yang abstrak
* Kontrol panjang teks antara 500–1000 karakter

> Semakin jelas prompt, semakin stabil performa AI.
> Anda dapat merujuk ke [Panduan Rekayasa Prompt](./prompt-engineering-guide.md).


### Langkah 3: Konfigurasi Keterampilan

Keterampilan menentukan apa yang "bisa dilakukan" oleh karyawan.

> 💡 Untuk instruksi terperinci, silakan merujuk ke: [Keterampilan](/ai-employees/features/tool)

| Tipe | Lingkup Kemampuan | Contoh | Tingkat Risiko |
| ---- | ------- | --------- | ------ |
| Frontend | Interaksi halaman | Membaca data blok, mengisi formulir | Rendah |
| Model Data | Kueri dan analisis data | Statistik agregat | Sedang |
| Alur Kerja | Menjalankan proses bisnis | Alat kustom | Tergantung alur kerja |
| Lainnya | Ekstensi eksternal | Pencarian web, operasi file | Tergantung situasi |

**Saran Konfigurasi:**

* 3–5 keterampilan per karyawan adalah yang paling sesuai
* Tidak disarankan memilih semua keterampilan karena dapat menyebabkan kebingungan
* Untuk operasi penting, disarankan menggunakan izin `Ask` (Tanya), bukan `Allow` (Izinkan)

![Konfigurasi keterampilan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Langkah 4: Konfigurasi Basis Pengetahuan (Opsional)

Jika AI Karyawan Anda perlu mengingat atau merujuk pada banyak materi, seperti manual produk, FAQ, dll., Anda dapat mengonfigurasi basis pengetahuan.

> 💡 Untuk instruksi terperinci, silakan merujuk ke:
> - [Ikhtisar Basis Pengetahuan AI](/ai-employees/knowledge-base/index)
> - [Database Vektor](/ai-employees/knowledge-base/vector-database)
> - [Konfigurasi Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Ini memerlukan instalasi plugin database vektor tambahan.

![Konfigurasi basis pengetahuan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Skenario Penggunaan:**

* Membuat AI memahami pengetahuan perusahaan
* Mendukung tanya jawab dokumen dan pencarian
* Melatih asisten khusus domain tertentu


### Langkah 5: Verifikasi Efek

Setelah selesai, Anda akan melihat avatar karyawan baru di pojok kanan bawah halaman.

![Verifikasi konfigurasi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Harap periksa setiap poin:

* ✅ Apakah ikon ditampilkan dengan normal
* ✅ Apakah dapat melakukan percakapan dasar
* ✅ Apakah keterampilan dapat dipanggil dengan benar

Jika semua terpenuhi, berarti konfigurasi berhasil 🎉


## III. Konfigurasi Tugas: Membuat AI Benar-benar Bekerja

Langkah sebelumnya adalah "membuat karyawan",
selanjutnya adalah membuat mereka "mulai bekerja".

Tugas AI mendefinisikan perilaku karyawan pada halaman atau blok tertentu.

> 💡 Untuk instruksi terperinci, silakan merujuk ke: [Tugas](/ai-employees/features/task)


### 1. Tugas Tingkat Halaman

Berlaku untuk seluruh cakupan halaman, misalnya "Analisis data halaman ini".

**Entri Konfigurasi:**
`Pengaturan Halaman → AI Karyawan → Tambah Tugas`

| Bidang | Penjelasan | Contoh |
| ---- | -------- | --------- |
| Judul | Nama tugas | Analisis Konversi Tahap |
| Konteks | Konteks halaman saat ini | Halaman daftar Leads |
| Pesan Default | Percakapan prasetel | "Tolong analisis tren bulan ini" |
| Blok Default | Mengaitkan otomatis dengan koleksi | tabel leads |
| Keterampilan | Alat yang tersedia | Kueri data, buat bagan |

![Konfigurasi tugas tingkat halaman](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Dukungan Multi-tugas:**
Satu AI Karyawan dapat dikonfigurasi dengan beberapa tugas yang akan muncul sebagai opsi untuk dipilih pengguna:

![Dukungan multi-tugas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Saran:

* Satu tugas fokus pada satu tujuan
* Nama harus jelas dan mudah dimengerti
* Kontrol jumlah tugas dalam rentang 5–7


### 2. Tugas Tingkat Blok

Cocok untuk mengoperasikan blok tertentu, seperti "Terjemahkan formulir ini".

**Metode Konfigurasi:**

1. Buka konfigurasi operasi blok
2. Tambahkan "AI Karyawan"

![Tombol Tambah AI Karyawan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Ikat dengan karyawan target

![Pilih AI Karyawan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Konfigurasi tugas tingkat blok](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Item Perbandingan | Tingkat Halaman | Tingkat Blok |
| ---- | ---- | --------- |
| Cakupan Data | Seluruh halaman | Blok saat ini |
| Granularitas | Analisis global | Pemrosesan detail |
| Penggunaan Tipikal | Analisis tren | Terjemahan formulir, ekstraksi bidang |


## IV. Praktik Terbaik

### 1. Saran Konfigurasi

| Item | Saran | Alasan |
| ---------- | ----------- | -------- |
| Jumlah Keterampilan | 3–5 buah | Akurasi tinggi, respons cepat |
| Mode Izin (Ask / Allow) | Modifikasi data disarankan Ask | Mencegah kesalahan operasi |
| Panjang Prompt | 500–1000 karakter | Menyeimbangkan kecepatan dan kualitas |
| Tujuan Tugas | Tunggal dan jelas | Menghindari kebingungan AI |
| Alur Kerja | Gunakan setelah membungkus tugas kompleks | Tingkat keberhasilan lebih tinggi |


### 2. Saran Implementasi

**Mulai dari kecil, optimalkan bertahap:**

1. Buat karyawan dasar terlebih dahulu (seperti Viz, Dex)
2. Aktifkan 1–2 keterampilan inti untuk pengujian
3. Pastikan tugas dapat dijalankan dengan normal
4. Baru kemudian perluas keterampilan dan tugas lainnya secara bertahap

**Optimasi alur secara berkelanjutan:**

1. Versi awal dapat berjalan
2. Kumpulkan umpan balik penggunaan
3. Optimalkan prompt dan konfigurasi tugas
4. Uji dan lakukan perbaikan berulang


## V. Tanya Jawab (FAQ)

### 1. Tahap Konfigurasi

**Q: Mengapa gagal menyimpan?**
A: Periksa apakah semua bidang wajib telah diisi, terutama layanan model dan prompt.

**Q: Model mana yang harus dipilih?**

* Jenis kode → Claude, GPT-4
* Jenis analisis → Claude, DeepSeek
* Sensitif biaya → Qwen, GLM
* Teks panjang → Gemini, Claude


### 2. Tahap Penggunaan

**Q: Balasan AI terlalu lambat?**

* Kurangi jumlah keterampilan
* Optimalkan prompt
* Periksa latensi layanan model
* Pertimbangkan untuk mengganti model

**Q: Eksekusi tugas tidak akurat?**

* Prompt kurang spesifik
* Terlalu banyak keterampilan menyebabkan kebingungan
* Pecah menjadi tugas kecil, tambahkan contoh

**Q: Kapan memilih Ask / Allow?**

* Tugas jenis kueri dapat menggunakan `Allow`
* Tugas jenis modifikasi data disarankan menggunakan `Ask`

**Q: Bagaimana cara membuat AI memproses formulir tertentu?**

A: Jika menggunakan konfigurasi tingkat halaman, Anda perlu memilih blok secara manual.

![Pilih blok secara manual](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Jika menggunakan konfigurasi tugas tingkat blok, konteks data akan terikat secara otomatis.


## VI. Bacaan Lanjutan

Untuk membuat AI Karyawan lebih kuat, silakan baca dokumen berikut:

**Terkait Konfigurasi:**

* [Panduan Rekayasa Prompt](./prompt-engineering-guide.md) - Teknik dan praktik terbaik menulis prompt berkualitas tinggi
* [Konfigurasi Layanan LLM](/ai-employees/features/llm-service) - Penjelasan detail konfigurasi layanan model besar
* [Membuat AI Karyawan](/ai-employees/features/new-ai-employees) - Pembuatan dan konfigurasi dasar AI Karyawan
* [Berkolaborasi dengan AI Karyawan](/ai-employees/features/collaborate) - Cara melakukan dialog efektif dengan AI Karyawan

**Fitur Lanjutan:**

* [Keterampilan](/ai-employees/features/tool) - Memahami lebih dalam konfigurasi dan penggunaan berbagai keterampilan
* [Tugas](/ai-employees/features/task) - Teknik tingkat lanjut konfigurasi tugas
* [Memilih Blok](/ai-employees/features/pick-block) - Cara menentukan blok data untuk AI Karyawan
* Sumber Data - Silakan merujuk pada dokumen konfigurasi sumber data plugin terkait
* [Pencarian Web](/ai-employees/features/web-search) - Mengonfigurasi kemampuan pencarian internet AI Karyawan

**Basis Pengetahuan dan RAG:**

* [Ikhtisar Basis Pengetahuan AI](/ai-employees/knowledge-base/index) - Pengenalan fitur basis pengetahuan
* [Database Vektor](/ai-employees/knowledge-base/vector-database) - Konfigurasi database vektor
* [Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base) - Cara membuat dan mengelola basis pengetahuan
* [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Penerapan teknologi RAG

**Integrasi Alur Kerja:**

* [Node LLM - Dialog Teks](/ai-employees/workflow/nodes/llm/chat) - Menggunakan dialog teks dalam alur kerja
* [Node LLM - Dialog Multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Menangani input gambar, file, dan multimodal lainnya
* [Node LLM - Output Terstruktur](/ai-employees/workflow/nodes/llm/structured-output) - Mendapatkan respons AI yang terstruktur


## Kesimpulan

Hal terpenting dalam mengonfigurasi AI Karyawan adalah: **jalankan dulu, baru optimalkan**.
Biarkan karyawan pertama Anda mulai bekerja, kemudian lakukan perluasan dan penyesuaian secara bertahap.

Urutan pemeriksaan masalah dapat dilakukan sebagai berikut:

1. Apakah layanan model terhubung
2. Apakah jumlah keterampilan terlalu banyak
3. Apakah prompt sudah spesifik
4. Apakah tujuan tugas sudah jelas

Dengan melangkah secara bertahap, Anda dapat membangun tim AI yang benar-benar efisien.