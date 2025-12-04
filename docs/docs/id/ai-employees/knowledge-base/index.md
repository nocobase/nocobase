:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum

## Pendahuluan

Plugin Basis Pengetahuan AI menyediakan kemampuan pengambilan RAG untuk agen AI.

Kemampuan pengambilan RAG memungkinkan agen AI untuk memberikan jawaban yang lebih akurat, profesional, dan relevan dengan internal perusahaan saat menjawab pertanyaan pengguna.

Dengan menggunakan dokumen domain profesional dan internal perusahaan yang disediakan dari basis pengetahuan yang dikelola administrator, akurasi dan ketertelusuran jawaban agen AI dapat ditingkatkan.

### Apa itu RAG

RAG (Retrieval Augmented Generation) adalah singkatan dari "Retrieval-Augmented-Generation".

- Pengambilan (Retrieval): Pertanyaan pengguna diubah menjadi vektor oleh model Embedding (misalnya, BERT). Blok teks Top-K yang relevan diambil dari pustaka vektor melalui pengambilan padat (kesamaan semantik) atau pengambilan jarang (pencocokan kata kunci).
- Augmentasi (Augmentation): Hasil pengambilan digabungkan dengan pertanyaan asli untuk membentuk prompt yang diperkaya (Augmented Prompt), yang kemudian disuntikkan ke jendela konteks LLM.
- Generasi (Generation): LLM menggabungkan prompt yang diperkaya untuk menghasilkan jawaban akhir, memastikan faktualitas dan ketertelusuran.

## Instalasi

1. Buka halaman Manajer Plugin.
2. Cari plugin `AI: Knowledge base` dan aktifkan.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)