:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mulai Cepat

## Pendahuluan

Sebelum menggunakan AI Employee, Anda perlu menghubungkan ke layanan LLM online. NocoBase saat ini mendukung layanan LLM online utama seperti OpenAI, Gemini, Claude, DepSeek, Qwen, dll.
Selain layanan LLM online, NocoBase juga mendukung koneksi ke model lokal Ollama.

## Konfigurasi Layanan LLM

Buka halaman konfigurasi `plugin` AI Employee, klik tab `LLM service` untuk masuk ke halaman manajemen layanan LLM.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

Arahkan kursor ke tombol `Add New` di pojok kanan atas daftar layanan LLM, lalu pilih layanan LLM yang ingin Anda gunakan.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

Sebagai contoh, kita akan menggunakan OpenAI. Pada jendela pop-up, masukkan `title` yang mudah diingat, lalu masukkan `API key` yang Anda dapatkan dari OpenAI. Klik `Submit` untuk menyimpan, dan konfigurasi layanan LLM pun selesai.

`Base URL` biasanya bisa dibiarkan kosong. Jika Anda menggunakan layanan LLM pihak ketiga yang kompatibel dengan antarmuka OpenAI API, harap isi `Base URL` yang sesuai.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Uji Ketersediaan

Pada halaman konfigurasi layanan LLM, klik tombol `Test flight`, masukkan nama model yang ingin Anda gunakan, lalu klik tombol `Run` untuk menguji apakah layanan LLM dan model tersebut tersedia.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)