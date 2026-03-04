:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/require-async).
:::

# ctx.requireAsync()

Memuat skrip **UMD/AMD** atau skrip yang dipasang secara global secara asinkron melalui URL, serta dapat memuat **CSS**. Cocok untuk skenario RunJS yang memerlukan pustaka (library) UMD/AMD seperti ECharts, Chart.js, FullCalendar (versi UMD), plugin jQuery, dan lainnya; memasukkan alamat `.css` akan memuat dan menyisipkan gaya (style). Jika pustaka juga menyediakan versi ESM, prioritaskan penggunaan [ctx.importAsync()](./import-async.md).

## Skenario Penggunaan

Dapat digunakan dalam skenario RunJS apa pun yang memerlukan pemuatan skrip UMD/AMD/global atau CSS sesuai kebutuhan, seperti JSBlock, JSField, JSItem, JSColumn, alur kerja, JSAction, dan lain-lain. Kegunaan tipikal: grafik ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), plugin jQuery, dsb.

## Definisi Tipe

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parameter

| Parameter | Tipe | Keterangan |
|-----------|------|-------------|
| `url` | `string` | Alamat skrip atau CSS. Mendukung **singkatan** `<nama-paket>@<versi>/<jalur-file>` (menambahkan `?raw` untuk mengambil file UMD asli saat diurai melalui ESM CDN) atau **URL lengkap**. Memuat dan menyisipkan gaya jika file `.css` dimasukkan. |

## Nilai Kembalian

- Objek pustaka yang dimuat (nilai modul pertama dari callback UMD/AMD). Banyak pustaka UMD yang menempel pada `window` (seperti `window.echarts`), sehingga nilai kembalian mungkin berupa `undefined`; dalam penggunaan praktis, akses variabel global sesuai dokumentasi pustaka tersebut.
- Mengembalikan hasil dari `loadCSS` saat memasukkan file `.css`.

## Penjelasan Format URL

- **Jalur singkatan**: Contohnya `echarts@5/dist/echarts.min.js`, di bawah ESM CDN default (esm.sh) akan meminta `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Parameter `?raw` digunakan untuk mendapatkan file UMD asli, bukan pembungkus (wrapper) ESM.
- **URL lengkap**: Dapat langsung menuliskan alamat CDN apa pun, seperti `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: URL yang berakhiran `.css` akan dimuat dan disisipkan ke dalam halaman.

## Perbedaan dengan ctx.importAsync()

- **ctx.requireAsync()**: Memuat skrip **UMD/AMD/global**, cocok untuk ECharts, Chart.js, FullCalendar (UMD), plugin jQuery, dll.; setelah dimuat, pustaka sering kali menempel pada `window`, dan nilai kembalian bisa berupa objek pustaka atau `undefined`.
- **ctx.importAsync()**: Memuat **modul ESM**, mengembalikan namespace modul. Jika pustaka menyediakan versi ESM, prioritaskan penggunaan `ctx.importAsync()` untuk semantik modul dan *tree-shaking* yang lebih baik.

## Contoh

### Penggunaan Dasar

```javascript
// Jalur singkatan (diurai melalui ESM CDN sebagai ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL lengkap
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Memuat CSS dan menyisipkannya ke dalam halaman
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Grafik ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Ringkasan Penjualan') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Grafik Batang Chart.js

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

- **Bentuk nilai kembalian**: Metode ekspor pustaka UMD bervariasi, nilai kembalian mungkin berupa objek pustaka atau `undefined`; jika `undefined`, akses melalui `window` sesuai dokumentasi pustaka.
- **Ketergantungan jaringan**: Memerlukan akses ke CDN. Untuk lingkungan jaringan internal, Anda dapat mengarahkan ke layanan mandiri melalui **ESM_CDN_BASE_URL**.
- **Pilihan antara importAsync**: Jika pustaka menyediakan ESM dan UMD secara bersamaan, prioritaskan penggunaan `ctx.importAsync()`.

## Terkait

- [ctx.importAsync()](./import-async.md) - Memuat modul ESM, cocok untuk Vue, dayjs (ESM), dll.
- [ctx.render()](./render.md) - Merender grafik dan komponen lainnya ke dalam kontainer.
- [ctx.libs](./libs.md) - React, antd, dayjs bawaan, tidak memerlukan pemuatan asinkron.