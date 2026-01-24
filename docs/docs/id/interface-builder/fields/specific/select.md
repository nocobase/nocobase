:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Dropdown

## Pendahuluan

Dropdown mendukung pengaitan data dengan memilih dari data yang sudah ada di tabel target, atau dengan menambahkan data baru ke tabel tersebut untuk pengaitan. Opsi dropdown mendukung pencarian fuzzy.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Konfigurasi Kolom

### Mengatur Cakupan Data

Mengontrol cakupan data dari daftar dropdown.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Untuk informasi lebih lanjut, lihat [Mengatur Cakupan Data](/interface-builder/fields/field-settings/data-scope)

### Mengatur Aturan Pengurutan

Mengontrol pengurutan data dalam dropdown.

Contoh: Urutkan berdasarkan tanggal layanan secara menurun.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Mengizinkan Penambahan/Pengaitan Beberapa Data

Membatasi relasi banyak-ke-banyak agar hanya mengizinkan pengaitan satu data.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Kolom Judul

Kolom judul adalah kolom label yang ditampilkan dalam opsi.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Mendukung pencarian cepat berdasarkan kolom judul.

Untuk informasi lebih lanjut, lihat [Kolom Judul](/interface-builder/fields/field-settings/title-field)

### Pembuatan Cepat: Tambahkan Dulu, Lalu Pilih

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Tambahkan via Dropdown

Setelah membuat data baru di tabel target, sistem secara otomatis memilihnya dan mengaitkannya saat formulir dikirimkan.

Tabel Pesanan memiliki kolom relasi banyak-ke-satu "Account".

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Tambahkan via Modal

Penambahan via modal cocok untuk skenario entri data yang lebih kompleks dan memungkinkan konfigurasi formulir khusus untuk membuat data baru.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Komponen Kolom](/interface-builder/fields/association-field)