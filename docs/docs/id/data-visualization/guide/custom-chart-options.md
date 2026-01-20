:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Konfigurasi Bagan Kustom

Dalam mode Kustom, Anda dapat mengonfigurasi bagan dengan menulis kode JS di editor. Berdasarkan `ctx.data`, Anda dapat mengembalikan `option` ECharts yang lengkap. Mode ini cocok untuk menggabungkan beberapa seri, membuat tooltip yang kompleks, dan gaya dinamis. Secara teori, semua fitur ECharts dan semua jenis bagan dapat didukung.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Konteks Data
- `ctx.data.objects`: array objek (setiap baris sebagai objek)
- `ctx.data.rows`: array 2D (dengan header)
- `ctx.data.columns`: array 2D yang dikelompokkan berdasarkan kolom

**Penggunaan yang Direkomendasikan:**
Konsolidasikan data dalam `dataset.source`. Untuk penggunaan lebih lanjut, silakan lihat dokumentasi ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Sumbu](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Contoh](https://echarts.apache.org/examples/en/index.html)


Mari kita mulai dengan contoh yang paling sederhana:

## Contoh 1: Bagan Batang Jumlah Pesanan Bulanan

![20251027082816](https://static-docs.nocobase.com/20251027082816.png)

```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'bar',
      showSymbol: false,
    },
  ],
}
```


## Contoh 2: Bagan Tren Penjualan

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monthly Sales Trend",
    subtext: "Last 12 Months",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Revenue", "Order Count", "Avg Order Value"],
    bottom: 0
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "60",
    top: "80",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: [
    {
      type: "value",
      name: "Amount(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Order Count",
      position: "right"
    }
  ],
  series: [
    {
      name: "Revenue",
      type: "line",
      smooth: true,
      encode: {
        x: "month",
        y: "monthly_revenue"
      },
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: "#5470c6"
      }
    },
    {
      name: "Order Count",
      type: "bar",
      yAxisIndex: 1,
      encode: {
        x: "month",
        y: "order_count"
      },
      itemStyle: {
        color: "#91cc75",
        opacity: 0.6
      }
    },
    {
      name: "Avg Order Value",
      type: "line",
      encode: {
        x: "month",
        y: "avg_order_value"
      },
      itemStyle: {
        color: "#fac858"
      },
      lineStyle: {
        type: "dashed"
      }
    }
  ]
}
```

**Saran:**
- Pertahankan gaya fungsi murni: hasilkan `option` hanya dari `ctx.data` dan hindari efek samping.
- Perubahan pada nama kolom kueri akan memengaruhi pengindeksan; standarkan nama dan konfirmasi di "Lihat data" sebelum memodifikasi kode.
- Untuk kumpulan data yang besar, hindari perhitungan sinkron yang kompleks dalam JS; lakukan agregasi pada tahap kueri jika diperlukan.


## Contoh Lain

Untuk contoh penggunaan lebih lanjut, Anda dapat merujuk ke [aplikasi Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

Anda juga dapat menelusuri [Contoh](https://echarts.apache.org/examples/en/index.html) resmi ECharts untuk menemukan efek bagan yang Anda inginkan, lalu merujuk dan menyalin kode konfigurasi JS-nya.
 

## Pratinjau dan Simpan

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Klik "Pratinjau" di sisi kanan atau di bagian bawah untuk menyegarkan bagan dan memvalidasi konfigurasi JS.
- Klik "Simpan" untuk menyimpan konfigurasi JS saat ini ke dalam basis data.
- Klik "Batal" untuk kembali ke status penyimpanan terakhir.