:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/blocks/block-settings/block-height).
:::

# Tinggi Blok

## Pengantar

Tinggi blok mendukung tiga mode: **Tinggi default**, **Tinggi yang ditentukan**, dan **Tinggi penuh**. Sebagian besar blok mendukung pengaturan tinggi.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Mode Tinggi

### Tinggi Default

Strategi tinggi default bervariasi untuk berbagai jenis blok. Sebagai contoh, blok Tabel dan Formulir akan menyesuaikan tingginya secara otomatis berdasarkan konten, dan bilah gulir tidak akan muncul di dalam blok.

### Tinggi yang Ditentukan

Anda dapat menentukan total tinggi bingkai luar blok secara manual. Blok akan secara otomatis menghitung dan mengalokasikan tinggi yang tersedia secara internal.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Tinggi Penuh

Mode tinggi penuh mirip dengan tinggi yang ditentukan, namun tinggi blok dihitung berdasarkan **viewport** (area pandang) browser saat ini untuk mencapai tinggi layar penuh maksimal. Bilah gulir tidak akan muncul pada halaman browser; bilah gulir hanya akan muncul di dalam blok.

Penanganan gulir internal dalam mode tinggi penuh sedikit berbeda di berbagai blok:

- **Tabel**: Gulir internal di dalam `tbody`;
- **Formulir / Detail**: Gulir internal di dalam Grid (gulir konten tidak termasuk area tindakan);
- **Daftar / Kartu Grid**: Gulir internal di dalam Grid (gulir konten tidak termasuk area tindakan dan bilah penomoran halaman);
- **Peta / Kalender**: Tinggi adaptif secara keseluruhan, tanpa bilah gulir;
- **Iframe / Markdown**: Membatasi total tinggi bingkai blok, dengan bilah gulir muncul di dalam blok.

#### Tabel Tinggi Penuh

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formulir Tinggi Penuh

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)