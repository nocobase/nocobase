---
title: "Block Detail"
description: "Block Detail: menampilkan detail data tunggal dalam bentuk read-only, mendukung layout Field, tampilan data terkait, konfigurasi tombol Action."
keywords: "Block Detail, DetailsBlock, detail data, tampilan read-only, interface builder, NocoBase"
---

# Block Detail

## Pengantar

Block Detail digunakan untuk menampilkan nilai setiap Field dari setiap data. Mendukung layout Field yang fleksibel, dan dilengkapi dengan berbagai fitur operasi data, memudahkan pengguna untuk melihat dan mengelola informasi.

## Konfigurasi Block

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Aturan Linkage Block

Mengontrol perilaku Block melalui aturan linkage (seperti apakah ditampilkan atau menjalankan JavaScript).

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Untuk informasi lebih lanjut, lihat [Aturan Linkage](/interface-builder/linkage-rule)

### Atur Cakupan Data

Contoh: Hanya menampilkan pesanan yang sudah dibayar

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Untuk informasi lebih lanjut, lihat [Atur Cakupan Data](/interface-builder/blocks/block-settings/data-scope)

### Aturan Linkage Field

Aturan linkage di Block Detail mendukung pengaturan tampilan/sembunyi Field secara dinamis.

Contoh: Saat status pesanan adalah "Cancel", tidak menampilkan jumlah.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Untuk informasi lebih lanjut, lihat [Aturan Linkage](/interface-builder/linkage-rule)

## Konfigurasi Field

### Field Table Ini

> **Perhatian**: Field di Table inheritance (yaitu Field Table parent) akan otomatis digabungkan dan ditampilkan di daftar Field saat ini.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Field Table Relasi

> **Perhatian**: Mendukung menampilkan Field Table relasi (saat ini hanya mendukung relasi to-one).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)


### Field Lainnya
- JS Field
- JS Item
- Divider
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Tips**: Anda dapat menulis JavaScript untuk mengimplementasikan konten tampilan kustom, sehingga dapat menampilkan konten yang lebih kompleks.
> Misalnya, dapat merender efek tampilan yang berbeda berdasarkan tipe data, kondisi, atau logika yang berbeda.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)


### Template Field

Template Field digunakan untuk menggunakan kembali konfigurasi area Field di Block Detail. Detail di [Template Field](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)


## Konfigurasi Action

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Edit](/interface-builder/actions/types/edit)
- [Hapus](/interface-builder/actions/types/delete)
- [Link](/interface-builder/actions/types/link)
- [Popup](/interface-builder/actions/types/pop-up)
- [Update Record](/interface-builder/actions/types/update-record)
- [Trigger Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
