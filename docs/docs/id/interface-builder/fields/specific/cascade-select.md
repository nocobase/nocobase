---
title: "Cascade Select"
description: "Field Cascade Select: dropdown linkage multi-level, mendukung pemilihan data tree seperti provinsi/kota/kecamatan, level kategori, dll."
keywords: "Cascade Select, CascadeSelect, linkage multi-level, pemilihan tree, interface builder, NocoBase"
---

# Cascade Select

## Pengantar

Cascade Selector cocok untuk Field relasi yang Table targetnya adalah Tree Table. Pengguna dapat memilih data sesuai dengan struktur level Tree Table, mendukung pencarian fuzzy untuk data.

## Petunjuk Penggunaan

- Relasi to-one, cascade adalah single select.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Relasi to-many, cascade adalah multi-select.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Konfigurasi Field

### Field Judul

Field Judul adalah Field label yang ditampilkan di opsi.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Mendukung pencarian cepat berdasarkan Field Judul

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Untuk informasi lebih lanjut, lihat [Field Judul](/interface-builder/fields/field-settings/title-field)

### Atur Cakupan Data

Mengontrol cakupan data list tree (saat sub-record memenuhi kondisi, parent record juga akan muncul).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Untuk informasi lebih lanjut, lihat [Atur Cakupan Data](/interface-builder/fields/field-settings/data-scope)

[Komponen Field](/interface-builder/fields/association-field);
