---
title: "Filter Halaman dan Linkage"
description: "Blok Filter (Filter Block) memberikan input kondisi filter terpadu, secara otomatis digabung ke query Chart untuk mencapai filter konsisten dan refresh terhubung pada beberapa Chart, mendukung mode Builder/SQL."
keywords: "filter halaman,Filter Block,linkage filter,linkage chart,filter beberapa chart,NocoBase"
---

# Filter Halaman dan Linkage

Filter halaman (Filter Block) digunakan untuk menyediakan input kondisi filter terpadu pada tingkat halaman, dan menggabungkannya ke query Chart, untuk mencapai filter konsisten dan linkage pada beberapa Chart.

## Ikhtisar Fitur
- Tambahkan "Blok Filter" pada halaman untuk menyediakan entri filter terpadu untuk semua Chart pada halaman saat ini.
- Lakukan operasi penerapan, pengosongan, dan penyembunyian melalui tombol "Filter", "Reset", "Lipat".
- Jika field yang terkait dengan Chart dipilih pada filter, nilainya akan otomatis digabung ke permintaan query Chart, memicu refresh Chart.
- Filter juga dapat membuat field kustom, mendaftarkan ke variabel konteks, dan dapat dirujuk pada blok data seperti Chart, tabel, formulir, dll.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Untuk informasi lebih lanjut tentang penggunaan filter halaman dan linkage dengan blok data seperti Chart, lihat dokumentasi Filter Halaman.

## Menggunakan Nilai Filter Halaman pada Query Chart
- Mode Builder (direkomendasikan)
  - Penggabungan otomatis: ketika sumber data dan koleksi sama, tidak perlu menulis variabel tambahan pada query Chart, filter halaman akan digabung dengan `$and`.
  - Pemilihan manual: Anda juga dapat secara aktif memilih nilai "field kustom" dari filter halaman pada kondisi filter.

- Mode SQL (melalui injeksi variabel)
  - Pada statement SQL, "Pilih Variabel" untuk menyisipkan nilai "field kustom" dari filter halaman.
