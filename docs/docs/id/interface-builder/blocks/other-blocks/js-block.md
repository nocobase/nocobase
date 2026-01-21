:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# JS Block

## Pendahuluan

JS Block adalah "blok rendering kustom" yang sangat fleksibel. Blok ini mendukung penulisan skrip JavaScript secara langsung untuk menghasilkan antarmuka, mengikat event, memanggil API data, atau mengintegrasikan pustaka pihak ketiga. JS Block cocok untuk skenario visualisasi yang dipersonalisasi, eksperimen sementara, dan ekstensi ringan yang sulit dicakup oleh blok bawaan.

## API Konteks Runtime

Konteks runtime JS Block telah dilengkapi dengan kemampuan umum yang dapat langsung Anda gunakan:

- `ctx.element`: Kontainer DOM blok (dibungkus dengan aman sebagai ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dan lainnya;
- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL;
- `ctx.openView`: Membuka tampilan yang telah dikonfigurasi (popup/drawer/halaman);
- `ctx.useResource(...)` + `ctx.resource`: Mengakses data sebagai sebuah sumber daya;
- `ctx.i18n.t()` / `ctx.t()`: Kemampuan internasionalisasi bawaan;
- `ctx.onRefReady(ctx.ref, cb)`: Merender setelah kontainer siap untuk menghindari masalah waktu;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Pustaka umum bawaan seperti React, ReactDOM, Ant Design, ikon Ant Design, dan dayjs, digunakan untuk rendering JSX dan utilitas waktu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: Merender elemen React, string HTML, atau node DOM ke kontainer default `ctx.element`; beberapa panggilan akan menggunakan kembali React Root yang sama dan menimpa konten yang ada di kontainer.

## Menambahkan Blok

Anda dapat menambahkan JS Block ke halaman atau popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor dan Cuplikan Kode

Editor skrip JS Block mendukung penyorotan sintaksis, petunjuk kesalahan, dan cuplikan kode bawaan (Snippets), memungkinkan Anda untuk dengan cepat menyisipkan contoh umum seperti merender grafik, mengikat event tombol, memuat pustaka eksternal, merender komponen React/Vue, linimasa, kartu informasi, dan lainnya.

- `Snippets`: Membuka daftar cuplikan kode bawaan. Anda dapat mencari dan menyisipkan cuplikan yang dipilih ke editor kode pada posisi kursor saat ini dengan satu klik.
- `Run`: Menjalankan kode secara langsung di editor saat ini dan menampilkan log eksekusi ke panel `Logs` di bagian bawah. Ini mendukung tampilan `console.log/info/warn/error`, dan kesalahan akan disorot dengan tautan ke baris dan kolom tertentu.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Selain itu, Anda dapat langsung memanggil karyawan AI "Frontend Engineer · Nathan" dari sudut kanan atas editor. Nathan dapat membantu Anda menulis atau memodifikasi skrip berdasarkan konteks saat ini. Anda kemudian dapat "Apply to editor" dengan satu klik dan menjalankan kode untuk melihat hasilnya. Untuk detailnya, lihat:

- [AI Karyawan · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Lingkungan Runtime dan Keamanan

- **Kontainer**: Sistem menyediakan kontainer DOM `ctx.element` (ElementProxy) yang aman untuk skrip, yang hanya memengaruhi blok saat ini dan tidak mengganggu area lain di halaman.
- **Sandbox**: Skrip berjalan di lingkungan yang terkontrol. `window`/`document`/`navigator` menggunakan objek proxy yang aman, memungkinkan API umum digunakan sambil membatasi perilaku berisiko.
- **Render Ulang**: Blok secara otomatis merender ulang saat disembunyikan dan kemudian ditampilkan kembali (untuk menghindari eksekusi ulang skrip pemasangan awal).

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

### 4) Membuka Tampilan (Drawer)

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

- Disarankan untuk menggunakan CDN tepercaya untuk memuat pustaka eksternal.
- **Saran Penggunaan Selektor**: Prioritaskan penggunaan selektor atribut `class` atau `[name=...]`. Hindari penggunaan `id` tetap untuk mencegah konflik dari `id` yang duplikat saat menggunakan beberapa blok atau popup.
- **Pembersihan Event**: Karena blok dapat merender ulang beberapa kali, listener event harus dibersihkan atau diduplikasi sebelum mengikat untuk menghindari pemicuan berulang. Anda dapat menggunakan pendekatan "hapus lalu tambahkan", listener satu kali, atau tanda untuk mencegah duplikasi.

## Dokumen Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Keterkaitan](/interface-builder/linkage-rule)
- [Tampilan dan Popup](/interface-builder/actions/types/view)