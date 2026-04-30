---
title: "Pertanyaan Umum Data Visualization"
description: "Tanya jawab umum tentang pemilihan Chart, interoperabilitas query data Builder/SQL, pemetaan field, preview dan simpan, jenis Chart ECharts."
keywords: "FAQ data visualization,pemilihan chart,line chart,bar chart,pie chart,Builder,mode SQL,preview simpan,NocoBase"
---

# Pertanyaan Umum

## Pertanyaan Pemilihan Chart
### Bagaimana cara memilih Chart yang sesuai?
Jawaban: pilih sesuai dengan tujuan data:
- Tren dan perubahan: line chart atau area chart
- Perbandingan numerik: bar chart atau column chart
- Struktur proporsi: pie chart atau donut chart
- Korelasi dan distribusi: scatter chart
- Struktur hierarki dan perubahan kemajuan: funnel chart

Untuk lebih banyak jenis Chart, lihat [contoh ECharts](https://echarts.apache.org/examples).

### Chart apa saja yang didukung NocoBase?
Jawaban: konfigurasi visualisasi memiliki Chart umum bawaan (line chart, area chart, bar chart, column chart, pie chart, donut chart, funnel chart, scatter chart, dll.); konfigurasi kustom dapat menggunakan semua jenis Chart ECharts.

## Pertanyaan Query Data
### Apakah konfigurasi visualisasi dan konfigurasi SQL saling terhubung?
Jawaban: tidak terhubung, konfigurasi disimpan secara terpisah. Mode konfigurasi pada saat penyimpanan terakhir yang berlaku.

## Pertanyaan Opsi Chart
### Bagaimana cara mengkonfigurasi field Chart?
Jawaban: pada konfigurasi visualisasi, pilih field data yang sesuai berdasarkan jenis Chart. Misalnya, line chart/bar chart memerlukan konfigurasi field sumbu X dan sumbu Y, pie chart memerlukan konfigurasi field kategori dan field nilai.
Disarankan untuk menjalankan "Jalankan Query" terlebih dahulu untuk melihat apakah data sesuai harapan; secara default akan otomatis mencocokkan field Chart.

## Pertanyaan Preview/Simpan
### Apakah perlu preview manual setelah perubahan konfigurasi?
Jawaban: pada mode konfigurasi visualisasi, preview akan otomatis muncul setelah perubahan konfigurasi. Pada mode SQL dan konfigurasi kustom, untuk menghindari refresh yang sering, klik "Preview" secara manual setelah selesai menulis.

### Mengapa efek preview Chart hilang setelah menutup popup?
Jawaban: efek preview hanya untuk tampilan sementara. Simpan terlebih dahulu sebelum menutup setelah perubahan konfigurasi; perubahan yang belum disimpan tidak akan dipertahankan.
