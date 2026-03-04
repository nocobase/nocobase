:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/blocks/data-blocks/form).
:::

# Blok Formulir

## Pengenalan

Blok formulir adalah blok penting yang digunakan untuk membangun antarmuka input dan pengeditan data. Blok ini memiliki kustomisasi tinggi, menggunakan komponen yang sesuai berdasarkan model data untuk menampilkan bidang yang diperlukan. Melalui aliran peristiwa seperti aturan keterkaitan, blok formulir dapat menampilkan bidang secara dinamis. Selain itu, blok ini juga dapat dikombinasikan dengan alur kerja untuk mewujudkan pemicuan proses otomatis dan pemrosesan data, yang selanjutnya meningkatkan efisiensi kerja atau mewujudkan penyusunan logika.

## Menambahkan Blok Formulir

- **Edit formulir**: Digunakan untuk mengubah data yang sudah ada.
- **Tambah formulir**: Digunakan untuk membuat entri data baru.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Item Konfigurasi Blok

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Aturan Keterkaitan Blok

Mengontrol perilaku blok melalui aturan keterkaitan (seperti apakah akan ditampilkan atau menjalankan JavaScript).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Informasi lebih lanjut merujuk ke [Aturan Keterkaitan Blok](/interface-builder/blocks/block-settings/block-linkage-rule)

### Aturan Keterkaitan Bidang

Mengontrol perilaku bidang formulir melalui aturan keterkaitan.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Informasi lebih lanjut merujuk ke [Aturan Keterkaitan Bidang](/interface-builder/blocks/block-settings/field-linkage-rule)

### Tata Letak

Blok formulir mendukung dua jenis tata letak, yang diatur melalui atribut `layout`:

- **horizontal** (tata letak horizontal): Tata letak ini menampilkan label dan konten dalam satu baris, menghemat ruang vertikal, cocok untuk formulir sederhana atau situasi dengan sedikit informasi.
- **vertical** (tata letak vertikal) (default): Label berada di atas bidang, tata letak ini membuat formulir lebih mudah dibaca dan diisi, terutama untuk formulir yang berisi banyak bidang atau item input yang kompleks.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfigurasi Bidang

### Bidang Koleksi Ini

> **Catatan**: Bidang dalam koleksi warisan (yaitu bidang koleksi induk) akan secara otomatis digabungkan dan ditampilkan dalam daftar bidang saat ini.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Bidang Koleksi Relasi

> Bidang koleksi relasi bersifat baca-saja dalam formulir, biasanya digunakan bersama dengan bidang relasi untuk menampilkan beberapa nilai bidang dari data relasi.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Saat ini hanya mendukung relasi to-one (seperti belongsTo / hasOne, dll.).
- Biasanya digunakan bersama dengan bidang relasi (digunakan untuk memilih catatan terkait): komponen bidang relasi bertanggung jawab untuk memilih/mengubah catatan terkait, sedangkan bidang koleksi relasi bertanggung jawab untuk menampilkan informasi lebih lanjut dari catatan tersebut (baca-saja).

**Contoh**: Setelah memilih "Penanggung Jawab", tampilkan nomor ponsel, email, dan informasi lainnya dari penanggung jawab tersebut di dalam formulir.

> Jika bidang relasi "Penanggung Jawab" tidak dikonfigurasi dalam formulir edit, informasi terkait yang sesuai tetap dapat ditampilkan. Saat bidang relasi "Penanggung Jawab" dikonfigurasi, mengubah penanggung jawab akan memperbarui informasi terkait ke catatan yang sesuai.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Bidang Lainnya

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Menulis JavaScript dapat mewujudkan konten tampilan kustom untuk menampilkan konten yang kompleks.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Templat Bidang

Templat bidang digunakan untuk menggunakan kembali konfigurasi area bidang dalam blok formulir. Detailnya lihat [Templat Bidang](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Konfigurasi Operasi

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Submit](/interface-builder/actions/types/submit)
- [Picu Alur Kerja](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)