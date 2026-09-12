---
title: "Sub-Table (Edit Inline)"
description: "Field Sub-Table: mode edit inline, langsung mengedit data terkait one-to-many di Table."
keywords: "Sub-Table, SubTable, edit inline, one-to-many, interface builder, NocoBase"
---

# Sub-Table (Edit Inline)

## Pengantar

Sub-Table cocok untuk menangani Field relasi to-many, mendukung pembuatan batch data Table target untuk diasosiasikan atau memilih dari data yang sudah ada untuk diasosiasikan.

## Petunjuk Penggunaan

![20251027223350](https://static-docs.nocobase.com/20251027223350.png)

Tipe Field yang berbeda di Sub-Table menampilkan komponen Field yang berbeda. Field besar (Field rich text, JSON, multi-line text, dll.) diedit melalui floating Popup.

![20251027223426](https://static-docs.nocobase.com/20251027223426.png)

Field relasi di Sub-Table.

Pesanan (one-to-many) > Order Products (one-to-one) > Opportunity

![20251027223530](https://static-docs.nocobase.com/20251027223530.png)

Komponen Field relasi default adalah Dropdown Select (mendukung Dropdown Select/Data Picker).

![20251027223754](https://static-docs.nocobase.com/20251027223754.png)

## Konfigurasi Field

### Izinkan Memilih Data yang Sudah Ada (Default Aktif)

Mendukung pemilihan data yang sudah ada untuk diasosiasikan.
![20251027224008](https://static-docs.nocobase.com/20251027224008.png)

![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)

### Komponen Field

[Komponen Field](/interface-builder/fields/association-field): switch ke komponen Field relasi lainnya, seperti dropdown select, data picker, dll.;

### Izinkan Melepaskan Asosiasi Data yang Sudah Ada

> Apakah data Field relasi di Edit Form diizinkan untuk dilepaskan asosiasinya

![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)
