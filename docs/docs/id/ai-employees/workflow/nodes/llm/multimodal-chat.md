---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Percakapan Multimodal

## Gambar

Jika model mendukungnya, node LLM dapat mengirim gambar ke model. Saat menggunakannya, Anda perlu memilih bidang lampiran atau catatan **koleksi** file terkait melalui variabel. Saat memilih catatan **koleksi** file, Anda dapat memilihnya di tingkat objek atau memilih bidang URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Ada dua opsi untuk format pengiriman gambar:

- Kirim melalui URL - Semua gambar, kecuali yang disimpan secara lokal, akan dikirim dalam bentuk URL. Gambar yang disimpan secara lokal akan dikonversi ke format base64 sebelum dikirim.
- Kirim melalui base64 - Semua gambar, baik yang disimpan secara lokal maupun di cloud, akan dikirim dalam format base64. Ini cocok untuk kasus di mana URL gambar tidak dapat diakses langsung oleh layanan LLM online.

![](https://static-docs.nocobase.com/202503041200638.png)