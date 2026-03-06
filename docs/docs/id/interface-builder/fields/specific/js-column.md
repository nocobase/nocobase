:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Pendahuluan

JS Column digunakan untuk "kolom kustom" dalam tabel, merender konten sel setiap baris melalui JavaScript. Tidak terikat pada bidang tertentu, cocok untuk skenario seperti kolom turunan, kombinasi lintas bidang, lencana status, operasi tombol, ringkasan data jarak jauh, dll.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API Konteks Runtime

Setiap sel JS Column dapat menggunakan kemampuan konteks berikut saat dirender:

- `ctx.element`: Kontainer DOM sel saat ini (ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.;
- `ctx.record`: Objek catatan baris saat ini (hanya-baca);
- `ctx.recordIndex`: Indeks baris dalam halaman saat ini (dimulai dari 0, mungkin dipengaruhi oleh paginasi);
- `ctx.collection`: Meta informasi dari koleksi yang terikat pada tabel (hanya-baca);
- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL;
- `ctx.openView(options)`: Membuka tampilan yang telah dikonfigurasi (pop-up/drawer/halaman);
- `ctx.i18n.t()` / `ctx.t()`: Internasionalisasi;
- `ctx.onRefReady(ctx.ref, cb)`: Merender setelah kontainer siap;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Pustaka bawaan seperti React / ReactDOM / Ant Design / Ikon Ant Design / dayjs / lodash / math.js / formula.js, digunakan untuk rendering JSX, pemrosesan waktu, manipulasi data, dan operasi matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: Merender elemen React/HTML/DOM ke kontainer default `ctx.element` (sel saat ini), rendering berulang akan menggunakan kembali Root dan menimpa konten kontainer yang ada.

## Editor dan Cuplikan Kode

Editor skrip JS Column mendukung penyorotan sintaks, petunjuk kesalahan, dan cuplikan kode bawaan (Snippets).

- `Snippets`: Membuka daftar cuplikan kode bawaan, dapat dicari dan dimasukkan ke posisi kursor saat ini dengan satu klik.
- `Run`: Menjalankan kode saat ini secara langsung, log eksekusi dikeluarkan ke panel `Logs` di bagian bawah, mendukung `console.log/info/warn/error` dan penentuan lokasi kesalahan dengan penyorotan.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Dapat dikombinasikan dengan Karyawan AI untuk menghasilkan kode:

- [Karyawan AI · Nathan: Insinyur Frontend](/ai-employees/features/built-in-employee)

## Penggunaan Umum

### 1) Rendering Dasar (Membaca catatan baris saat ini)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Menggunakan JSX untuk Merender Komponen React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Membuka Pop-up/Drawer dalam Sel (Lihat/Edit)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Lihat</a>
);
```

### 4) Memuat Pustaka Pihak Ketiga (AMD/UMD atau ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Catatan Penting

- Pemuatan pustaka eksternal disarankan menggunakan CDN tepercaya, dan siapkan penanganan cadangan untuk skenario kegagalan (seperti `if (!lib) return;`).
- Selektor disarankan memprioritaskan penggunaan `class` atau `[name=...]`, hindari penggunaan `id` tetap untuk mencegah duplikasi `id` dalam beberapa blok/pop-up.
- Pembersihan event: Baris tabel mungkin berubah secara dinamis seiring paginasi/penyegaran, sel akan dirender berkali-kali. Sebelum mengikat event, harus dibersihkan atau dilakukan deduplikasi untuk menghindari pemicuan berulang.
- Saran performa: Hindari memuat pustaka besar secara berulang di setiap sel; sebaiknya simpan pustaka ke dalam cache di tingkat atas (seperti melalui variabel global atau variabel tingkat tabel) kemudian gunakan kembali.