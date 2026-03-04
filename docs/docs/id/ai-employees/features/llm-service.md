:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/ai-employees/features/llm-service).
:::

# Konfigurasi Layanan LLM

Sebelum menggunakan AI Employee, Anda perlu mengonfigurasi layanan LLM yang tersedia terlebih dahulu.

Saat ini, penyedia yang didukung meliputi OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, serta model lokal Ollama.

## Membuat Layanan Baru

Buka `Pengaturan Sistem -> AI Employee -> LLM service`.

1. Klik `Add New` untuk membuka jendela pembuatan baru.
2. Pilih `Provider`.
3. Isi `Title`, `API Key`, dan `Base URL` (opsional).
4. Konfigurasi `Enabled Models`:
   - `Recommended models`: Menggunakan model yang direkomendasikan secara resmi.
   - `Select models`: Memilih dari daftar model yang disediakan oleh Provider.
   - `Manual input`: Memasukkan ID model dan nama tampilan secara manual.
5. Klik `Submit` untuk menyimpan.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Mengaktifkan dan Mengurutkan Layanan

Di dalam daftar layanan LLM, Anda dapat secara langsung:

- Menggunakan sakelar `Enabled` untuk mengaktifkan atau menonaktifkan layanan.
- Menyeret (drag) untuk mengurutkan urutan layanan (mempengaruhi urutan tampilan model).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Uji Ketersediaan

Gunakan `Test flight` di bagian bawah jendela konfigurasi layanan untuk menguji ketersediaan layanan dan model.

Disarankan untuk melakukan pengujian terlebih dahulu sebelum digunakan dalam operasional bisnis.