---
title: "Kustomisasi Konfigurasi Chart"
description: "Mode Custom menulis JS untuk mengembalikan option ECharts berdasarkan ctx.data, mendukung dataset, penggabungan multi-seri, tooltip kompleks dan gaya dinamis, kemampuan ECharts lengkap."
keywords: "chart kustom,mode Custom,ECharts option,ctx.data,dataset,NocoBase"
---

# Kustomisasi Konfigurasi Chart

Mode kustomisasi konfigurasi Chart memungkinkan Anda menulis JS pada editor kode, mengembalikan `option` ECharts lengkap berdasarkan `ctx.data`. Cocok untuk penggabungan multi-seri, tooltip kompleks, dan gaya dinamis. Secara teori dapat mendukung fungsi ECharts lengkap dan semua jenis Chart.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Konteks Data
- `ctx.data.objects`: array objek (setiap baris record)
- `ctx.data.rows`: array dua dimensi (termasuk header)
- `ctx.data.columns`: array dua dimensi yang dikelompokkan per kolom

**Penggunaan yang Direkomendasikan:**
Kumpulkan data secara seragam pada `dataset.resource`. Untuk penggunaan rinci, lihat dokumentasi ECharts.

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Axis](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Examples](https://echarts.apache.org/examples/en/index.html)


Mari lihat contoh paling sederhana terlebih dahulu:

## Contoh 1: Bar Chart Jumlah Pesanan per Bulan

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


## Contoh 2: Chart Tren Penjualan

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
- Pertahankan gaya pure function, hanya hasilkan `option` berdasarkan `ctx.data`, hindari side effect.
- Penyesuaian nama kolom query akan mempengaruhi indeks; berikan penamaan yang seragam dan konfirmasikan pada "Lihat Data" sebelum mengubah kode.
- Saat volume data besar, hindari kalkulasi sinkron yang kompleks pada JS; jika perlu, lakukan agregasi pada tahap query.


## Contoh Lainnya

Untuk lebih banyak contoh penggunaan, lihat [Demo Aplikasi](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

Anda juga dapat melihat [Examples](https://echarts.apache.org/examples/en/index.html) resmi ECharts, pilih efek Chart yang Anda inginkan, lalu rujuk dan salin kode konfigurasi JS-nya.


## Preview dan Simpan

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Klik "Preview" di sebelah kanan, atau "Preview" di bagian bawah, untuk merefresh Chart guna memverifikasi konten konfigurasi JS.
- Klik "Simpan" untuk menyimpan konten konfigurasi JS saat ini ke database.
- Klik "Batal" untuk kembali ke status simpan sebelumnya.
