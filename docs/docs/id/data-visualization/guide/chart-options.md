---
title: "Opsi Chart"
description: "Konfigurasi tampilan Chart: mode grafis Basic dan mode JS Custom, pemetaan field xField/yField/seriesField, pemilihan jenis seperti line chart, bar chart, pie chart."
keywords: "opsi chart,mode Basic,mode Custom,ECharts,pemetaan field,xField,yField,NocoBase"
---

# Opsi Chart

Konfigurasikan cara tampilan Chart, mendukung dua mode: Basic (grafis) dan Custom (JS kustom). Basic cocok untuk pemetaan cepat dan properti umum; Custom cocok untuk skenario kompleks dan kustomisasi lanjutan.


## Struktur Panel

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tips: Untuk lebih mudah mengkonfigurasi konten saat ini, Anda dapat melipat panel lainnya terlebih dahulu.

Bagian paling atas adalah toolbar
Pemilihan Mode
- Basic: konfigurasi grafis, pilih jenis dan selesaikan pemetaan field, atur sakelar properti umum secara langsung.
- Custom: tulis JS pada editor, kembalikan `option` ECharts.

## Mode Basic

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Pilih Jenis Chart
- Mendukung: line chart, area chart, bar chart, column chart, pie chart, donut chart, funnel chart, scatter chart, dll.
- Field yang dibutuhkan oleh berbagai jenis Chart mungkin berbeda; konfirmasikan terlebih dahulu nama dan tipe kolom pada "Query Data → Lihat Data".

### Pemetaan Field
- Line/Area/Bar/Column:
  - `xField`: dimensi (seperti tanggal, kategori, wilayah)
  - `yField`: ukuran (nilai numerik setelah agregasi)
  - `seriesField` (opsional): pengelompokan seri (untuk beberapa garis/beberapa kelompok bar)
- Pie/Donut:
  - `Category`: dimensi kategori
  - `Value`: ukuran
- Funnel:
  - `Category`: tahap/kategori
  - `Value`: nilai (biasanya jumlah atau proporsi)
- Scatter:
  - `xField`, `yField`: dua ukuran atau dimensi, untuk sumbu koordinat


> Untuk lebih banyak konfigurasi opsi Chart, lihat dokumentasi ECharts [Axis](https://echarts.apache.org/handbook/en/concepts/axis) dan [Examples](https://echarts.apache.org/examples/en/index.html)


**Perhatian:**
- Konfirmasikan ulang pemetaan setelah dimensi atau ukuran berubah, untuk menghindari Chart kosong atau salah posisi.
- Pie/Donut, Funnel harus menyediakan kombinasi "kategori + nilai".

### Properti Umum

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Stack, smooth (line/area)
- Tampilan label, tooltip, legend
- Rotasi label sumbu, garis pemisah
- Radius dan inner radius pie/donut, cara sortir funnel


**Saran:**
- Gunakan line/area dengan smooth yang dihidupkan secara wajar untuk time series; gunakan bar/column untuk perbandingan kategori besar.
- Saat data padat, tidak perlu menghidupkan semua label untuk menghindari obstruksi.

## Mode Custom

Digunakan untuk mengembalikan `option` ECharts lengkap, cocok untuk penggabungan multi-seri, tooltip kompleks, gaya dinamis, dan kustomisasi lanjutan lainnya.
Penggunaan yang direkomendasikan: kumpulkan data secara seragam pada `dataset.resource`. Untuk penggunaan rinci, lihat dokumentasi ECharts [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Konteks Data
- `ctx.data.objects`: array objek (setiap baris record, direkomendasikan)
- `ctx.data.rows`: array dua dimensi (termasuk header)
- `ctx.data.columns`: array dua dimensi yang dikelompokkan per kolom


### Contoh: Line Chart Pesanan per Bulan
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Preview dan Simpan
- Setelah perubahan pada mode Custom, Anda dapat klik tombol Preview di sebelah kanan untuk memperbarui preview Chart.
- Klik "Simpan" di bagian bawah untuk membuat konfigurasi berlaku dan menyimpannya; klik "Batal" untuk membatalkan semua perubahan konfigurasi.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Untuk informasi lebih lanjut tentang opsi Chart, lihat Penggunaan Lanjutan — Kustomisasi Konfigurasi Chart.
