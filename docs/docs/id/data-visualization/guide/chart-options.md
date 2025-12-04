:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Opsi Bagan

Konfigurasi cara bagan ditampilkan. Dua mode didukung: Basic (visual) dan Custom (JS). Mode Basic ideal untuk pemetaan cepat dan properti umum; mode Custom cocok untuk skenario kompleks dan kustomisasi tingkat lanjut.

## Struktur Panel

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tips: Untuk konfigurasi yang lebih mudah, lipat panel lain terlebih dahulu.

Bilah tindakan teratas
Pilihan Mode:
- Basic: Konfigurasi visual. Pilih jenis dan selesaikan pemetaan bidang; sesuaikan properti umum dengan tombol.
- Custom: Tulis JS di editor dan kembalikan `option` ECharts.

## Mode Basic

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Pilih Jenis Bagan
- Didukung: bagan garis, area, kolom, batang, pai, donat, corong, sebar, dll.
- Bidang yang diperlukan bervariasi berdasarkan jenis bagan. Pertama, konfirmasikan nama dan jenis kolom di “Kueri data → Lihat data”.

### Pemetaan Bidang
- Garis/area/kolom/batang:
  - `xField`: dimensi (tanggal, kategori, wilayah)
  - `yField`: ukuran (nilai numerik teragregasi)
  - `seriesField` (opsional): pengelompokan seri (untuk beberapa garis/kelompok)
- Pai/donat:
  - `Category`: dimensi kategorikal
  - `Value`: ukuran
- Corong:
  - `Category`: tahap/kategori
  - `Value`: nilai (biasanya jumlah atau persentase)
- Sebar:
  - `xField`, `yField`: dua ukuran atau dimensi untuk sumbu

> Untuk opsi bagan lainnya, lihat dokumentasi ECharts: [Sumbu](https://echarts.apache.org/handbook/en/concepts/axis) dan [Contoh](https://echarts.apache.org/examples/en/index.html)

**Catatan:**
- Setelah mengubah dimensi atau ukuran, periksa kembali pemetaan untuk menghindari bagan kosong atau tidak sejajar.
- Bagan pai/donat dan corong harus menyediakan kombinasi “kategori + nilai”.

### Properti Umum

![20251026191332](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

- Tumpuk, haluskan (garis/area)
- Tampilan label, tooltip, legenda
- Rotasi label sumbu, garis pemisah
- Radius dan radius dalam pai/donat, urutan pengurutan corong

**Rekomendasi:**
- Gunakan garis/area untuk deret waktu dengan penghalusan sedang; gunakan kolom/batang untuk perbandingan kategori.
- Dengan data padat, hindari menampilkan semua label untuk mencegah tumpang tindih.

## Mode Custom

Digunakan untuk mengembalikan `option` ECharts lengkap. Cocok untuk kustomisasi tingkat lanjut seperti penggabungan beberapa seri, tooltip kompleks, dan gaya dinamis.
Pendekatan yang direkomendasikan: konsolidasikan data dalam `dataset.source`. Untuk detailnya, lihat dokumentasi ECharts: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Konteks Data
- `ctx.data.objects`: array objek (setiap baris sebagai objek, direkomendasikan)
- `ctx.data.rows`: array 2D (dengan header)
- `ctx.data.columns`: array 2D yang dikelompokkan berdasarkan kolom

### Contoh: Bagan Garis Pesanan Bulanan
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

### Pratinjau dan Simpan
- Dalam mode Custom, setelah selesai mengedit, Anda dapat mengeklik tombol Pratinjau di sebelah kanan untuk memperbarui pratinjau bagan.
- Di bagian bawah, klik “Simpan” untuk menerapkan dan menyimpan konfigurasi; klik “Batal” untuk mengembalikan semua perubahan yang dibuat kali ini.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Untuk informasi lebih lanjut tentang opsi bagan, lihat Lanjutan — Konfigurasi bagan kustom.