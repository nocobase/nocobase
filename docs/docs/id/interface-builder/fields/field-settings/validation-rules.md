---
title: "Aturan Validasi"
description: "Konfigurasi Field: mengkonfigurasi aturan validasi Field, mendukung wajib diisi, format, panjang, validasi kustom, dll."
keywords: "aturan validasi, validation, validasi Form, validasi Field, interface builder, NocoBase"
---

# Atur Aturan Validasi

## Pengantar

Aturan validasi digunakan untuk memastikan data yang diinput pengguna sesuai dengan ekspektasi.

## Di Mana Dapat Mengatur Aturan Validasi Field

### Konfigurasi Aturan Validasi di Field Collection

Sebagian besar Field mendukung konfigurasi aturan validasi. Setelah Field dikonfigurasi aturan validasi, akan memicu validasi backend saat submit data. Tipe Field yang berbeda mendukung aturan validasi yang berbeda.

- **Field Tanggal**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Field Numerik**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Field Teks**

  Field teks selain dapat membatasi panjang teks, juga mendukung regular expression kustom untuk validasi yang lebih halus.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Validasi Frontend di Konfigurasi Field

Aturan validasi yang diatur di konfigurasi Field akan memicu validasi frontend, memastikan input pengguna sesuai dengan ketentuan.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Field teks** juga mendukung validasi regex kustom untuk memenuhi persyaratan format tertentu.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)
