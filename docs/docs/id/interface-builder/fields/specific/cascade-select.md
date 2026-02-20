:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pilihan Bertingkat

## Pendahuluan

Pemilih bertingkat dirancang untuk *field* relasi yang *koleksi* targetnya adalah tabel pohon. Ini memungkinkan pengguna memilih data mengikuti struktur hierarkis *koleksi* pohon dan mendukung pencarian *fuzzy* untuk pemfilteran cepat.

## Petunjuk Penggunaan

- Untuk relasi **satu-ke-satu**, pemilih bertingkat adalah **pilihan tunggal**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Untuk relasi **satu-ke-banyak**, pemilih bertingkat adalah **pilihan ganda**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Opsi Konfigurasi Field

### Field Judul

*Field* judul menentukan label yang ditampilkan untuk setiap opsi.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Mendukung pencarian cepat berdasarkan *field* judul

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Untuk detail lebih lanjut, lihat:
[Field Judul](/interface-builder/fields/field-settings/title-field)

### Cakupan Data

Mengontrol cakupan data daftar pohon (jika catatan anak memenuhi kondisi, catatan induknya juga akan disertakan).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Untuk detail lebih lanjut, lihat:
[Cakupan Data](/interface-builder/fields/field-settings/data-scope)

Komponen *field* lainnya:
[Komponen Field](/interface-builder/fields/association-field)