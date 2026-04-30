---
title: "Ikhtisar Block"
description: "Block Interface Builder NocoBase: Data Block, Filter Block, Block Lainnya, dapat ditempatkan di Page, dialog, drawer, mendukung drag layout, event flow, konfigurasi parameter."
keywords: "Block, Blocks, Data Block, Filter Block, drag layout, event flow, interface builder, NocoBase"
---

# Block

Block adalah container untuk data dan konten, dapat ditempatkan di Page, dialog (Modal), atau drawer (Drawer). Beberapa Block dapat di-drag dan diatur dengan bebas.

## Tipe Block

![Tipe Block](https://static-docs.nocobase.com/f71af45b5cd914ea0558f760ddbbba58.png)

- Data Block: digunakan untuk menampilkan data dari data source di antarmuka.
- Filter Block: digunakan untuk menggunakan data dari data source sebagai kondisi filter, untuk memfilter Data Block lainnya.
- Block Lainnya: digunakan untuk membawa konten tertentu atau independen seperti todo workflow, audit log, Markdown, dll.

## Menambahkan Block

Block dapat ditempatkan di Page, dialog (Modal), atau drawer (Drawer).

### Block di Page

Saat ini tipe Block di Page meliputi: Data Block, Filter Block, Block Lainnya.

![20251023222441](https://static-docs.nocobase.com/20251023222441.png)

### Block di Popup (Dialog atau Drawer)

Popup memiliki dua tipe yaitu dialog dan drawer. Sama seperti Page, juga dapat menambahkan Block. Perbedaannya adalah Block Form di Popup biasanya untuk tambah, edit, atau lihat record tunggal. Tipe Block meliputi Data Block dan Block Lainnya.

![20251023222613](https://static-docs.nocobase.com/20251023222613.png)

## Designer Block

Setiap Block memiliki tiga ikon kecil di sudut kanan atas, dari kiri ke kanan masing-masing:

1. Drag layout
2. [Event Flow](/interface-builder/event-flow)
3. Konfigurasi parameter Block

![20251023224032](https://static-docs.nocobase.com/20251023224032.png)

Block sederhana semua item konfigurasi terpusat di "Konfigurasi parameter Block", seperti JS Block

![20251023224903](https://static-docs.nocobase.com/20251023224903.png)

Block tipe data yang kompleks juga akan menyediakan "Konfigurasi Field" dan "Konfigurasi Action" yang independen dan tertanam.

![20251023225141](https://static-docs.nocobase.com/20251023225141.png)

Selain itu, Anda juga dapat mengeksplorasi secara bebas, menyediakan kemungkinan nesting yang lebih banyak, seperti Block Chart.

![](https://static-docs.nocobase.com/07588190b3f41ae3060e71d8b76b4447.png)

## Layout Block

Beberapa Block dapat di-drag untuk menyesuaikan layout.

![20251029201501](https://static-docs.nocobase.com/20251029201501.gif)
