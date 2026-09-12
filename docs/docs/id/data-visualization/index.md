---
pkg: "@nocobase/plugin-data-visualization"
title: "Ikhtisar Data Visualization"
description: "NocoBase Data Visualization: blok Chart, query data Builder/SQL, ukuran dan dimensi, konfigurasi ECharts, event interaksi, linkage filter halaman, analisis multi-dimensi."
keywords: "data visualization,blok chart,ECharts,dashboard,ukuran,dimensi,Builder,query SQL,NocoBase"
---

# Ikhtisar

Plugin Data Visualization NocoBase menyediakan query data visual dan komponen Chart yang kaya.
Pengguna dapat dengan cepat membangun panel visualisasi melalui konfigurasi sederhana untuk menampilkan wawasan data, serta mendukung analisis dan tampilan data multi-dimensi.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Konsep Dasar
- Blok Chart: komponen Chart yang dapat dikonfigurasi pada halaman, mendukung query data, opsi Chart, dan event interaksi.
- Query Data (Builder / SQL): mengambil data melalui konfigurasi grafis Builder, atau dengan menulis SQL.
- Ukuran (Measures) dan Dimensi (Dimensions): ukuran digunakan untuk agregasi numerik, dimensi digunakan untuk pengelompokan (seperti tanggal, kategori, wilayah).
- Pemetaan Field: memetakan kolom hasil query ke field inti Chart, seperti `xField`, `yField`, `seriesField` atau `Category / Value`.
- Opsi Chart (Basic / Custom): Basic mengkonfigurasi properti umum secara grafis; Custom mengembalikan `option` ECharts lengkap melalui JS.
- Menjalankan Query: jalankan query di panel konfigurasi untuk meminta data, dapat beralih antara Table / JSON untuk melihat data yang dikembalikan.
- Preview dan Simpan: preview adalah efek sementara; setelah klik "Simpan", konfigurasi ditulis ke database dan resmi berlaku.
- Variabel Konteks: gunakan kembali informasi konteks halaman, pengguna, filter, dll. (seperti `{{ ctx.user.id }}`) untuk query dan konfigurasi Chart.
- Filter Halaman dan Linkage: "Blok Filter" tingkat halaman menyediakan input kondisi terpadu, secara otomatis digabung ke query Chart dan refresh secara terhubung.
- Event Interaksi: daftarkan event melalui `chart.on` untuk mengimplementasikan perilaku seperti highlight, navigasi, drill-down.

## Instalasi
Data Visualization adalah Plugin bawaan NocoBase, siap pakai tanpa instalasi terpisah.
