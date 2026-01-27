:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pencarian RAG

## Pendahuluan

Setelah mengkonfigurasi basis pengetahuan, Anda dapat mengaktifkan fitur RAG di pengaturan karyawan AI.

Ketika RAG diaktifkan, saat pengguna berinteraksi dengan karyawan AI, karyawan AI akan menggunakan pencarian RAG untuk mengambil dokumen dari basis pengetahuan berdasarkan pesan pengguna dan membalas berdasarkan dokumen yang ditemukan.

## Mengaktifkan RAG

Buka halaman konfigurasi plugin karyawan AI, klik tab `AI employees` untuk masuk ke halaman manajemen karyawan AI.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Pilih karyawan AI yang ingin Anda aktifkan RAG-nya, klik tombol `Edit` untuk masuk ke halaman pengeditan karyawan AI.

Di tab `Knowledge base`, aktifkan sakelar `Enable`.

- Pada `Knowledge Base Prompt`, masukkan prompt untuk mereferensikan basis pengetahuan. `{knowledgeBaseData}` adalah placeholder tetap dan tidak boleh diubah;
- Pada `Knowledge Base`, pilih basis pengetahuan yang telah dikonfigurasi. Lihat: [Basis Pengetahuan](/ai-employees/knowledge-base/knowledge-base);
- Pada kolom input `Top K`, masukkan jumlah dokumen yang akan diambil, nilai defaultnya adalah 3;
- Pada kolom input `Score`, masukkan ambang batas relevansi dokumen untuk pencarian.

Klik tombol `Submit` untuk menyimpan pengaturan karyawan AI.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)