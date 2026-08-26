---
title: "Field Collection"
description: "Tipe field Collection: Interface dan tipe data, field skalar, field relasi, konfigurasi terkait, aturan validasi field."
keywords: "field collection,tipe field,Field Interface,field Collection,NocoBase"
---

# Field Collection

## Tipe Interface Field

NocoBase membagi field dari perspektif Interface menjadi beberapa kategori berikut:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipe Data Field

Setiap Field Interface memiliki tipe data default. Misalnya, field dengan Interface Number (Number), tipe datanya secara default adalah double, tetapi juga bisa float, decimal, dan lainnya. Tipe data yang saat ini didukung meliputi:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Pemetaan Tipe Field

Alur penambahan field di database utama:

1. Pilih tipe Interface
2. Konfigurasi tipe data yang dapat dipilih untuk Interface saat ini

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Alur pemetaan field data source eksternal:

1. Otomatis memetakan tipe data (Field type) dan tipe UI (Field Interface) yang sesuai berdasarkan tipe field database eksternal.
2. Memodifikasi sesuai kebutuhan menjadi tipe data dan tipe Interface yang lebih cocok.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)
