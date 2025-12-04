:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mengatur Aturan Validasi

## Pendahuluan

Aturan validasi digunakan untuk memastikan data yang dimasukkan pengguna sesuai dengan harapan.

## Di Mana Mengatur Aturan Validasi Bidang

### Mengonfigurasi Aturan Validasi untuk Bidang Koleksi

Sebagian besar bidang mendukung konfigurasi aturan validasi. Setelah bidang dikonfigurasi dengan aturan validasi, validasi *backend* akan terpicu saat data diserahkan. Berbagai jenis bidang mendukung aturan validasi yang berbeda.

- **Bidang Tanggal**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Bidang Angka**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Bidang Teks**

  Selain dapat membatasi panjang teks, bidang teks juga mendukung ekspresi reguler kustom untuk validasi yang lebih detail.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Validasi *Frontend* dalam Konfigurasi Bidang

Aturan validasi yang diatur dalam konfigurasi bidang akan memicu validasi *frontend* untuk memastikan masukan pengguna sesuai dengan ketentuan.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Bidang teks** juga mendukung validasi *regex* kustom untuk memenuhi persyaratan format tertentu.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)