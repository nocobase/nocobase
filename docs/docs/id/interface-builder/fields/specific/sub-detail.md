---
title: "Sub-Detail"
description: "Field Sub-Detail: menampilkan detail data terkait one-to-many dalam bentuk read-only."
keywords: "Sub-Detail, SubDetail, one-to-many, tampilan read-only, interface builder, NocoBase"
---

# Sub-Detail

## Pengantar

Sub-Detail adalah komponen yang sesuai dengan sub-form dalam mode baca. Dibandingkan dengan komponen tag dan judul, Sub-Detail tidak hanya dapat menampilkan lebih banyak data Table ini, tetapi juga dapat dikonfigurasi untuk menampilkan informasi data Table relasi. Data relasi multi-level ditampilkan dengan jelas dalam bentuk Detail bersarang.

## Petunjuk Penggunaan

### Sub-Detail Field Relasi To-Many

![20251027221700](https://static-docs.nocobase.com/20251027221700.png)

Mendukung tampilan bersarang Field relasi multi-level, contoh: Pesanan/Produk Pesanan/Produk.

![20251027221924](https://static-docs.nocobase.com/20251027221924.png)

### Sub-Detail Field Relasi To-One

![20251027222059](https://static-docs.nocobase.com/20251027222059.png)

## Konfigurasi Field

### Komponen Field

![20251027222243](https://static-docs.nocobase.com/20251027222243.png)

![20251027222347](https://static-docs.nocobase.com/20251027222347.png)

[Komponen Field](/interface-builder/fields/association-field): switch ke komponen Field relasi mode baca lainnya, seperti komponen Field judul, Sub-Table (hanya didukung Field relasi to-many), dll.;
