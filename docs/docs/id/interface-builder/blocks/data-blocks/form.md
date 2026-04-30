---
title: "Block Form"
description: "Block Form: menampilkan dan mengedit data tunggal dalam bentuk Form, mendukung mode tambah, edit, lihat, dapat mengkonfigurasi layout dan validasi Field."
keywords: "Block Form, FormBlock, Form, tambah edit, layout Field, interface builder, NocoBase"
---

# Block Form

## Pengantar

Block Form adalah Block penting yang digunakan untuk membangun antarmuka input dan edit data. Memiliki kustomisasi yang tinggi, menampilkan Field yang diperlukan menggunakan komponen yang sesuai berdasarkan model data. Melalui aturan linkage dan event flow lainnya, Block Form dapat menampilkan Field secara dinamis. Selain itu, juga dapat dikombinasikan dengan workflow untuk mengimplementasikan pemicu alur otomatisasi dan pemrosesan data, lebih lanjut meningkatkan efisiensi kerja atau mengimplementasikan orkestrasi logika.

## Tambah Block Form

- **Edit Form**: digunakan untuk memodifikasi data yang sudah ada.
- **Tambah Form**: digunakan untuk membuat entri data baru.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Konfigurasi Block

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Aturan Linkage Block

Mengontrol perilaku Block melalui aturan linkage (seperti apakah ditampilkan atau menjalankan JavaScript).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Untuk informasi lebih lanjut, lihat [Aturan Linkage Block](/interface-builder/blocks/block-settings/block-linkage-rule)

### Aturan Linkage Field

Mengontrol perilaku Field Form melalui aturan linkage.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Untuk informasi lebih lanjut, lihat [Aturan Linkage Field](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

Block Form mendukung dua cara layout, diatur melalui atribut `layout`:

- **horizontal** (Layout Horizontal): Layout ini menampilkan konten label dalam satu baris, menghemat ruang vertikal, cocok untuk Form sederhana atau situasi dengan informasi yang lebih sedikit.
- **vertical** (Layout Vertikal) (default): Label berada di atas Field. Layout ini membuat Form lebih mudah dibaca dan diisi, terutama cocok untuk Form yang berisi banyak Field atau item input yang kompleks.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfigurasi Field

### Field Table Ini

> **Perhatian**: Field di Table inheritance (yaitu Field Table parent) akan otomatis digabungkan dan ditampilkan di daftar Field saat ini.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Field Table Relasi

> Field Table relasi adalah read-only di Form, biasanya digunakan bersama Field relasi, dapat menampilkan beberapa nilai Field dari data relasi.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Saat ini hanya mendukung relasi to-one (seperti belongsTo / hasOne, dll.).
- Biasanya digunakan bersama Field relasi (digunakan untuk memilih record terkait): komponen Field relasi bertanggung jawab untuk memilih/mengubah record terkait, Field Table relasi bertanggung jawab untuk menampilkan informasi lebih lanjut dari record tersebut (read-only).

**Contoh**: Setelah memilih "Penanggung Jawab", tampilkan nomor telepon, email, dan informasi lain dari penanggung jawab tersebut di Form.

> Jika Field relasi "Penanggung Jawab" tidak dikonfigurasi di Edit Form, informasi terkait tetap dapat ditampilkan. Setelah Field relasi "Penanggung Jawab" dikonfigurasi, saat penanggung jawab diubah, informasi terkait akan diupdate ke record yang sesuai.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Field Lainnya

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Menulis JavaScript dapat mengimplementasikan konten tampilan kustom, mengimplementasikan tampilan konten yang kompleks.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Template Field

Template Field digunakan untuk menggunakan kembali konfigurasi area Field di Block Form. Detail di [Template Field](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Konfigurasi Action

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Submit](/interface-builder/actions/types/submit)
- [Trigger Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
