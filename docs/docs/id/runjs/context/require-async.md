---
title: "ctx.requireAsync()"
description: "ctx.requireAsync() memuat modul UMD/AMD secara dinamis berdasarkan URL, cocok untuk RunJS yang memerlukan library pihak ketiga, ESM gunakan importAsync."
keywords: "ctx.requireAsync,UMD,AMD,loading dinamis,importAsync,RunJS,NocoBase"
---

# ctx.requireAsync()

Memuat **UMD/AMD** atau script yang di-mount ke global secara async berdasarkan URL, juga dapat memuat **CSS**. Cocok untuk skenario RunJS yang perlu menggunakan library UMD/AMD seperti ECharts, Chart.js, FullCalendar (versi UMD), plugin jQuery; meneruskan alamat `.css` akan memuat dan menyuntikkan style. Jika library juga menyediakan versi ESM, lebih utamakan menggunakan [ctx.importAsync()](./import-async.md).

## Skenario Penggunaan

Semua skenario di RunJS yang perlu memuat UMD/AMD/global script atau CSS sesuai kebutuhan, seperti JSBlock, JSField, JSItem, JSColumn, event flow, JSAction, dll. Penggunaan khas: chart ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), plugin jQuery, dll.

## Definisi Tipe

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parameter

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `url` | `string` | Alamat script atau CSS. Mendukung **format singkat** `<nama-paket>@<versi>/<path-file>` (saat di-resolve oleh ESM CDN ditambahkan `?raw` untuk mengambil file UMD asli) atau **URL lengkap**. Saat meneruskan `.css` akan memuat dan menyuntikkan style. |

## Return Value

- Objek library setelah loading (nilai modul pertama dari callback UMD/AMD). Banyak library UMD akan ter-mount ke `window` (seperti `window.echarts`), return value mungkin `undefined`, saat penggunaan sebenarnya akses variabel global sesuai dokumentasi library.
- Saat meneruskan `.css` mengembalikan hasil `loadCSS`.

## Penjelasan Format URL

- **Path singkat**: seperti `echarts@5/dist/echarts.min.js`, pada ESM CDN default (esm.sh) akan request `https://esm.sh/echarts@5/dist/echarts.min.js?raw`, `?raw` digunakan untuk mendapatkan file UMD asli, bukan wrapper ESM.
- **URL lengkap**: dapat langsung menulis alamat CDN sembarang, seperti `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: meneruskan URL yang berakhiran `.css` akan memuat dan menyuntikkan ke halaman.

## Perbedaan dengan ctx.importAsync()

- **ctx.requireAsync()**: memuat script **UMD/AMD/global**, cocok untuk plugin ECharts, Chart.js, FullCalendar (UMD), jQuery, dll.; library setelah loading sering ter-mount ke `window`, return value mungkin objek library atau `undefined`.
- **ctx.importAsync()**: memuat **modul ESM**, mengembalikan namespace modul. Jika library juga menyediakan ESM, lebih utamakan `ctx.importAsync()` untuk mendapatkan semantik modul yang lebih baik dan Tree-shaking.

## Contoh

### Penggunaan Dasar

```javascript
// Path singkat (di-resolve oleh ESM CDN menjadi ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL lengkap
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Memuat CSS dan menyuntikkan ke halaman
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Chart ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Ikhtisar Penjualan') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Bar Chart Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Jumlah'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Hal yang Perlu Diperhatikan

- **Bentuk return value**: cara ekspor library UMD beragam, return value mungkin objek library atau `undefined`; jika `undefined`, dapat diakses dari `window` sesuai dokumentasi library.
- **Bergantung pada jaringan**: perlu mengakses CDN, environment intranet dapat mengarahkan ke layanan mandiri melalui **ESM_CDN_BASE_URL**.
- **Pemilihan dengan importAsync**: saat library menyediakan ESM dan UMD bersamaan, lebih utamakan `ctx.importAsync()`.

## Terkait

- [ctx.importAsync()](./import-async.md) - Memuat modul ESM, cocok untuk Vue, dayjs (ESM), dll.
- [ctx.render()](./render.md) - Merender chart, dll. ke container
- [ctx.libs](./libs.md) - Bawaan React, antd, dayjs, dll., tidak perlu loading async
