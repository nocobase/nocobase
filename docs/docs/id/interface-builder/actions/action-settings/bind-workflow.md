---
title: "Bind Workflow"
description: "Konfigurasi Action: mengikat tombol Action ke workflow, memicu eksekusi workflow tertentu saat diklik."
keywords: "bind workflow, bind workflow, trigger workflow, konfigurasi Action, interface builder, NocoBase"
---

# Bind Workflow

## Pengantar

Pada beberapa tombol Action, Anda dapat mengkonfigurasi bind workflow untuk mengaitkan Action submit dengan workflow guna mengimplementasikan pemrosesan data otomatis.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Tipe Action dan Workflow yang Didukung

Tipe tombol Action dan workflow yang saat ini didukung untuk binding adalah sebagai berikut:

| Tombol Action \ Tipe Workflow | Event Pre-Action | Event Post-Action | Event Approval | Event Custom Action |
| --- | --- | --- | --- | --- |
| Tombol "Submit", "Save" pada Form | OK | OK | OK | Tidak |
| Tombol "Update Data" di baris data (Table, List, dll.) | OK | OK | OK | Tidak |
| Tombol "Hapus" di baris data (Table, List, dll.) | OK | Tidak | Tidak | Tidak |
| Tombol "Trigger Workflow" | Tidak | Tidak | Tidak | OK |

## Bind Beberapa Workflow Bersamaan

Sebuah tombol Action dapat di-bind ke beberapa workflow. Ketika beberapa workflow di-bind, urutan eksekusi workflow mengikuti aturan berikut:

1. Workflow sinkron pada tipe trigger yang sama dieksekusi terlebih dahulu, workflow asinkron dieksekusi setelahnya.
2. Workflow pada tipe trigger yang sama dieksekusi sesuai urutan konfigurasi.
3. Antar workflow tipe trigger berbeda:
    1. Event Pre-Action pasti dieksekusi sebelum event Post-Action dan event Approval
    2. Event Post-Action dan event Approval tidak memiliki urutan tertentu, bisnis tidak boleh bergantung pada urutan konfigurasi.

## Lebih Lanjut

Untuk tipe event workflow yang berbeda, lihat penjelasan detail Plugin terkait:

* [Event Post-Action]
* [Event Pre-Action]
* [Event Approval]
* [Event Custom Action]
