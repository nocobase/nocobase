---
title: "Drag Sort"
description: "Konfigurasi Block: drag sort, menyesuaikan urutan tampilan Block atau Field melalui drag."
keywords: "drag sort, sort Block, sort Field, interface builder, NocoBase"
---

# Drag Sort

## Pengantar

Drag sort bergantung pada Field sort, digunakan untuk mengurutkan record Block secara manual.


:::info{title=Tips}
* Field sort yang sama digunakan untuk drag sort, mencampur beberapa Block dapat merusak sort yang ada.
* Saat drag sort Table, Field sort tidak dapat mengatur aturan grouping.
* Tree Table hanya mendukung sort node level yang sama.

:::


## Konfigurasi Drag

Tambahkan Field tipe "sort". Saat membuat Table, Field sort tidak lagi otomatis dihasilkan, perlu dibuat secara manual.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Saat drag sort Table, perlu memilih Field sort.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Drag Sort Baris Table


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Penjelasan Aturan Sort

Asumsikan sort saat ini adalah

```
[1,2,3,4,5,6,7,8,9]
```

Ketika suatu elemen (misalnya 5) dipindahkan ke depan ke posisi 3, hanya nilai sort 3, 4, 5 yang akan berubah: 5 menempati posisi 3, 3 dan 4 masing-masing bergeser ke belakang satu posisi.

```
[1,2,5,3,4,6,7,8,9]
```

Saat ini, jika 6 dipindahkan ke belakang ke posisi 8, 6 menempati posisi 8, 7 dan 8 masing-masing bergeser ke depan satu posisi.

```
[1,2,5,3,4,7,8,6,9]
```
