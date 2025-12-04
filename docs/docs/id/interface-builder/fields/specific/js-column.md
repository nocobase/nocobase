:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kolom JS

## Pendahuluan

Kolom JS digunakan untuk "kolom kustom" dalam tabel, merender konten sel setiap baris melalui JavaScript. Kolom ini tidak terikat pada bidang tertentu dan cocok untuk skenario seperti kolom turunan, tampilan gabungan antar bidang, lencana status, tombol aksi, dan agregasi data jarak jauh.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API Konteks Runtime

Saat setiap sel Kolom JS dirender, Anda dapat menggunakan API konteks berikut:

- `ctx.element`: Kontainer DOM sel saat ini (ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dan lainnya;
- `ctx.record`: Objek catatan baris saat ini (hanya-baca);
- `ctx.recordIndex`: Indeks baris dalam halaman saat ini (dimulai dari 0, dapat dipengaruhi oleh paginasi);
- `ctx.collection`: Metadata koleksi yang terikat pada tabel (hanya-baca);
- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL;
- `ctx.openView(options)`: Membuka tampilan yang telah dikonfigurasi (modal/drawer/halaman);
- `ctx.i18n.t()` / `ctx.t()`: Internasionalisasi;
- `ctx.onRefReady(ctx.ref, cb)`: Merender setelah kontainer siap;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Pustaka umum bawaan seperti React, ReactDOM, Ant Design, ikon Ant Design, dan dayjs, digunakan untuk rendering JSX dan penanganan waktu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: Merender elemen React/HTML/DOM ke kontainer default `ctx.element` (sel saat ini). Beberapa rendering akan menggunakan kembali Root dan menimpa konten kontainer yang ada.

## Editor dan Cuplikan Kode

Editor skrip untuk Kolom JS mendukung penyorotan sintaks, petunjuk kesalahan, dan cuplikan kode bawaan (Snippets).

- `Snippets`: Membuka daftar cuplikan kode bawaan, Anda dapat mencari dan memasukkannya ke posisi kursor saat ini dengan satu klik.
- `Run`: Menjalankan kode saat ini secara langsung. Log eksekusi akan ditampilkan di panel `Logs` di bagian bawah, mendukung `console.log/info/warn/error` dan penyorotan lokasi kesalahan.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Anda juga dapat menggunakan Karyawan AI untuk menghasilkan kode:

- [Karyawan AI · Nathan: Insinyur Frontend](/ai-employees/built-in/ai-coding)

## Penggunaan Umum

### 1) Rendering Dasar (Membaca Catatan Baris Saat Ini)

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

### 3) Membuka Modal/Drawer dari Sel (Lihat/Edit)

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

- Disarankan untuk menggunakan CDN tepercaya untuk memuat pustaka eksternal dan memiliki mekanisme fallback untuk skenario kegagalan (misalnya, `if (!lib) return;`).
- Disarankan untuk memprioritaskan penggunaan selektor `class` atau `[name=...]`, hindari penggunaan `id` tetap untuk mencegah duplikasi `id` di beberapa blok atau modal.
- Pembersihan Event: Baris tabel dapat berubah secara dinamis dengan paginasi atau refresh, menyebabkan sel dirender berkali-kali. Anda harus membersihkan atau menghilangkan duplikasi event listener sebelum mengikatnya untuk menghindari pemicuan berulang.
- Saran Performa: Hindari memuat pustaka besar secara berulang di setiap sel. Sebaliknya, cache pustaka di tingkat yang lebih tinggi (misalnya, menggunakan variabel global atau variabel tingkat tabel) dan gunakan kembali.