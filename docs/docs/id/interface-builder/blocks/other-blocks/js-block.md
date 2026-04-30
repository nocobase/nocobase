---
title: "JSBlock JS Block"
description: "JSBlock JS Block: menjalankan JavaScript kustom di Block independen, mendukung React, ctx, render dinamis, model JS FlowEngine."
keywords: "JSBlock, JS Block, Block JavaScript, Block kustom, FlowEngine, interface builder, NocoBase"
---

# Block JS Block

## Pengantar

JS Block adalah "Block render kustom" yang sangat fleksibel. Mendukung penulisan langsung script JavaScript untuk menghasilkan antarmuka, bind event, memanggil interface data, atau mengintegrasikan library pihak ketiga. Cocok untuk skenario visualisasi personal, eksperimen sementara, dan ekstensi ringan yang sulit dicakup oleh Block bawaan.

## API Konteks Runtime

Konteks runtime JS Block telah menginjeksikan kemampuan umum, dapat langsung digunakan:

- `ctx.element`: container DOM Block (sudah dilakukan secure wrapping, ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.;
- `ctx.requireAsync(url)`: load library AMD/UMD secara asynchronous berdasarkan URL;
- `ctx.importAsync(url)`: import modul ESM secara dinamis berdasarkan URL;
- `ctx.openView`: membuka view yang sudah dikonfigurasi (Popup/drawer/page);
- `ctx.useResource(...)` + `ctx.resource`: mengakses data dengan cara resource;
- `ctx.i18n.t()` / `ctx.t()`: kemampuan internasionalisasi bawaan;
- `ctx.onRefReady(ctx.ref, cb)`: render setelah container siap, hindari masalah timing;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: library umum bawaan seperti React / ReactDOM / Ant Design / icon Ant Design / dayjs / lodash / math.js / formula.js, dll., digunakan untuk render JSX, pemrosesan waktu, operasi data, dan operasi matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` masih dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: render React element, HTML string, atau DOM node ke container default `ctx.element`; multiple call akan menggunakan kembali React Root yang sama, dan menimpa konten container yang ada.

## Tambah Block

- Dapat menambahkan JS Block di Page atau Popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor dan Snippet

Editor script JS Block mendukung syntax highlighting, error prompt, dan snippet kode bawaan (Snippets). Dapat dengan cepat menyisipkan contoh umum, seperti: render chart, bind event tombol, load library eksternal, render komponen React/Vue, timeline, info card, dll.

- `Snippets`: Membuka daftar snippet kode bawaan, dapat dicari dan dengan satu klik menyisipkan snippet yang dipilih ke posisi cursor saat ini di area edit kode.
- `Run`: Langsung menjalankan kode di editor saat ini, dan output log eksekusi ke panel `Logs` di bawah. Mendukung tampilan `console.log/info/warn/error`. Error akan disorot dan dapat dilokasi ke baris dan kolom spesifik.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Selain itu, di sudut kanan atas editor dapat langsung memanggil AI Employee "Frontend Engineer · Nathan", biarkan dia menulis atau memodifikasi script berdasarkan konteks saat ini, satu klik "Apply to editor" untuk diterapkan ke editor kemudian dijalankan untuk melihat efeknya. Detail di:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Lingkungan Runtime dan Keamanan

- Container: Sistem menyediakan container DOM aman `ctx.element` (ElementProxy) untuk script, hanya mempengaruhi Block saat ini, tidak mengganggu area lain di Page.
- Sandbox: Script berjalan dalam lingkungan terkontrol. `window`/`document`/`navigator` menggunakan secure proxy object. API umum dapat digunakan, perilaku berisiko dibatasi.
- Re-render: Setelah Block disembunyikan kemudian ditampilkan kembali akan otomatis re-render (menghindari eksekusi berulang pada mount pertama).

## Penggunaan Umum (Contoh Ringkas)

### 1) Render React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Template Request API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Load ECharts dan Render

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Membuka View (Drawer)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Membaca Resource dan Render JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Perhatian

- Disarankan menggunakan CDN terpercaya untuk load library eksternal.
- Saran penggunaan selector: prioritaskan menggunakan selector atribut `class` atau `[name=...]`; hindari menggunakan `id` tetap, untuk mencegah duplikasi `id` di beberapa Block/Popup yang menyebabkan konflik style atau event.
- Pembersihan event: Block mungkin re-render beberapa kali, sebelum bind event harus melakukan pembersihan atau dedup, hindari trigger berulang. Dapat menggunakan cara "remove dulu kemudian add", atau listener satu kali, atau tambahkan tag untuk mencegah duplikasi.

## Dokumentasi Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Linkage](/interface-builder/linkage-rule)
- [View dan Popup](/interface-builder/actions/types/view)
