:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block

## Pendahuluan

JS Block adalah "blok rendering kustom" yang sangat fleksibel, mendukung penulisan skrip JavaScript secara langsung untuk menghasilkan antarmuka, mengikat event, memanggil antarmuka data, atau mengintegrasikan pustaka pihak ketiga. Cocok untuk visualisasi personal, eksperimen sementara, dan skenario perluasan ringan yang sulit dicakup oleh blok bawaan.

## API Konteks Runtime

Konteks runtime JS Block telah dilengkapi dengan kemampuan umum yang dapat langsung digunakan:

- `ctx.element`: Kontainer DOM blok (ElementProxy yang telah dibungkus dengan aman), mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.;
- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL;
- `ctx.openView`: Membuka tampilan yang telah dikonfigurasi (pop-up/laci/halaman);
- `ctx.useResource(...)` + `ctx.resource`: Mengakses data sebagai sumber daya;
- `ctx.i18n.t()` / `ctx.t()`: Kemampuan internasionalisasi bawaan;
- `ctx.onRefReady(ctx.ref, cb)`: Melakukan rendering setelah kontainer siap untuk menghindari masalah urutan waktu;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Pustaka umum bawaan seperti React / ReactDOM / Ant Design / Ikon Ant Design / dayjs / lodash / math.js / formula.js, digunakan untuk rendering JSX, pemrosesan waktu, operasi data, dan perhitungan matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: Merender elemen React, string HTML, atau node DOM ke kontainer default `ctx.element`; pemanggilan berulang akan menggunakan kembali React Root yang sama dan menimpa konten kontainer yang ada.

## Menambahkan Blok

- Dapat menambahkan JS Block di halaman atau pop-up.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor dan Cuplikan Kode

Editor skrip JS Block mendukung penyorotan sintaksis, petunjuk kesalahan, dan cuplikan kode bawaan (Snippets), untuk menyisipkan contoh umum dengan cepat seperti: merender bagan, mengikat event tombol, memuat pustaka eksternal, merender komponen React/Vue, lini masa, kartu informasi, dll.

- `Snippets`: Membuka daftar cuplikan kode bawaan, dapat mencari dan menyisipkan cuplikan yang dipilih ke posisi kursor saat ini di area edit kode dengan satu klik.
- `Run`: Menjalankan kode dalam editor saat ini secara langsung, dan mengeluarkan log eksekusi ke panel `Logs` di bagian bawah. Mendukung tampilan `console.log/info/warn/error`, kesalahan akan disorot dan dapat diarahkan ke baris serta kolom tertentu.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Selain itu, sudut kanan atas editor dapat langsung memanggil karyawan AI "Frontend Engineer · Nathan", memintanya membantu menulis atau mengubah skrip berdasarkan konteks saat ini, lalu klik "Apply to editor" untuk menerapkannya ke editor sebelum dijalankan untuk melihat hasilnya. Lihat detailnya:

- [Karyawan AI · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Lingkungan Runtime dan Keamanan

- Kontainer: Sistem menyediakan kontainer DOM yang aman `ctx.element` (ElementProxy) untuk skrip, hanya memengaruhi blok saat ini, tidak mengganggu area lain di halaman.
- Sandbox: Skrip berjalan di lingkungan yang terkontrol, `window`/`document`/`navigator` menggunakan objek proksi yang aman, API umum tersedia, perilaku berisiko dibatasi.
- Render ulang: Blok akan otomatis merender ulang setelah disembunyikan dan ditampilkan kembali (menghindari eksekusi berulang pada pemasangan pertama).

## Penggunaan Umum (Contoh Sederhana)

### 1) Merender React (JSX)

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

### 2) Template Permintaan API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Memuat ECharts dan Merender

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

### 4) Membuka Tampilan (Laci)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Membaca Sumber Daya dan Merender JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Catatan

- Pemuatan pustaka eksternal disarankan menggunakan CDN tepercaya.
- Saran penggunaan selektor: Prioritaskan penggunaan selektor atribut `class` atau `[name=...]`; hindari penggunaan `id` tetap untuk mencegah duplikasi `id` di beberapa blok/pop-up yang menyebabkan konflik gaya atau event.
- Pembersihan event: Blok mungkin merender ulang beberapa kali, bersihkan atau hapus duplikasi event sebelum mengikat untuk menghindari pemicuan berulang. Dapat menggunakan cara "hapus dulu baru tambah", atau listener sekali pakai, atau menambahkan penanda untuk mencegah pengulangan.

## Dokumen Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Keterkaitan](/interface-builder/linkage-rule)
- [Tampilan dan Pop-up](/interface-builder/actions/types/view)