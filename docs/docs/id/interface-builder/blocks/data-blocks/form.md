:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Blok Formulir

## Pendahuluan

Blok Formulir adalah blok penting untuk membangun antarmuka input dan pengeditan data. Blok ini sangat dapat disesuaikan, menggunakan komponen yang sesuai untuk menampilkan bidang yang diperlukan berdasarkan model data. Melalui alur peristiwa seperti aturan keterkaitan (linkage rules), Blok Formulir dapat menampilkan bidang secara dinamis. Selain itu, blok ini dapat digabungkan dengan alur kerja untuk memicu proses otomatis dan menangani data, sehingga meningkatkan efisiensi kerja atau mengimplementasikan orkestrasi logika.

## Menambahkan Blok Formulir

- **Formulir Edit**: Digunakan untuk memodifikasi data yang sudah ada.
- **Formulir Tambah Baru**: Digunakan untuk membuat entri data baru.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Pengaturan Blok

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Aturan Keterkaitan Blok

Kontrol perilaku blok (seperti apakah akan ditampilkan atau menjalankan JavaScript) melalui aturan keterkaitan.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Untuk detail lebih lanjut, lihat [Aturan Keterkaitan Blok](/interface-builder/blocks/block-settings/block-linkage-rule)

### Aturan Keterkaitan Bidang

Kontrol perilaku bidang formulir melalui aturan keterkaitan.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Untuk detail lebih lanjut, lihat [Aturan Keterkaitan Bidang](/interface-builder/blocks/block-settings/field-linkage-rule)

### Tata Letak

Blok Formulir mendukung dua mode tata letak, yang dapat diatur melalui atribut `layout`:

- **horizontal** (Tata Letak Horizontal): Tata letak ini menampilkan label dan konten dalam satu baris, menghemat ruang vertikal, cocok untuk formulir sederhana atau kasus dengan informasi yang lebih sedikit.
- **vertical** (Tata Letak Vertikal) (default): Label ditempatkan di atas bidang. Tata letak ini membuat formulir lebih mudah dibaca dan diisi, terutama untuk formulir dengan banyak bidang atau item input yang kompleks.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfigurasi Bidang

### Bidang Koleksi Ini

> **Catatan**: Bidang dari koleksi yang diwarisi (yaitu, bidang koleksi induk) secara otomatis digabungkan dan ditampilkan dalam daftar bidang saat ini.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Bidang Lain

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Tulis JavaScript untuk menyesuaikan konten tampilan dan menampilkan informasi yang kompleks.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Konfigurasi Aksi

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Kirim](/interface-builder/actions/types/submit)
- [Picu Alur Kerja](/interface-builder/actions/types/trigger-workflow)
- [Aksi JS](/interface-builder/actions/types/js-action)
- [Karyawan AI](/interface-builder/actions/types/ai-employee)