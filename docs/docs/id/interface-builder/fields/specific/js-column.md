---
title: "JSColumn JS Table Column"
description: "JSColumn JS Table Column: menyematkan render kustom dan logika di kolom Table, mendukung React, ctx, data baris."
keywords: "JSColumn, JS Table Column, kolom kustom, render Table, interface builder, NocoBase"
---

# JS Column

## Pengantar

JS Column digunakan untuk "kolom kustom" di Table, merender konten cell setiap baris melalui JavaScript. Tidak terikat Field tertentu, cocok untuk skenario seperti kolom turunan, tampilan kombinasi cross-Field, badge status, Action tombol, agregasi data remote, dll.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API Konteks Runtime

Setiap cell JS Column dapat menggunakan kemampuan konteks berikut saat di-render:

- `ctx.element`: container DOM cell saat ini (ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.;
- `ctx.record`: objek record baris saat ini (read-only);
- `ctx.recordIndex`: index baris di halaman saat ini (mulai dari 0, mungkin dipengaruhi pagination);
- `ctx.collection`: meta info collection yang di-bind Table (read-only);
- `ctx.requireAsync(url)`: load library AMD/UMD secara asynchronous berdasarkan URL;
- `ctx.importAsync(url)`: import modul ESM secara dinamis berdasarkan URL;
- `ctx.openView(options)`: membuka view yang sudah dikonfigurasi (Popup/drawer/page);
- `ctx.i18n.t()` / `ctx.t()`: internasionalisasi;
- `ctx.onRefReady(ctx.ref, cb)`: render setelah container siap;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: library umum bawaan seperti React / ReactDOM / Ant Design / icon Ant Design / dayjs / lodash / math.js / formula.js, dll., digunakan untuk render JSX, pemrosesan waktu, operasi data, dan operasi matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` masih dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: render React element/HTML/DOM ke container default `ctx.element` (cell saat ini), render berulang akan menggunakan kembali Root, dan menimpa konten container yang ada.

## Editor dan Snippet

Editor script JS Column mendukung syntax highlighting, error prompt, dan snippet kode bawaan (Snippets).

- `Snippets`: Membuka daftar snippet kode bawaan, dapat dicari dan dengan satu klik menyisipkan ke posisi cursor saat ini.
- `Run`: Langsung menjalankan kode saat ini, log eksekusi output ke panel `Logs` di bawah, mendukung `console.log/info/warn/error` dan highlight lokasi error.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Dapat dikombinasikan dengan AI Employee untuk generate kode:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Penggunaan Umum

### 1) Render Dasar (Membaca Record Baris Saat Ini)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Menggunakan JSX untuk Render Komponen React

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

### 3) Membuka Popup/Drawer di Cell (Lihat/Edit)

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

### 4) Load Library Pihak Ketiga (AMD/UMD atau ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Perhatian

- Disarankan menggunakan CDN terpercaya untuk load library eksternal, dan siapkan fallback untuk skenario kegagalan (seperti `if (!lib) return;`).
- Saran selector prioritaskan menggunakan `class` atau `[name=...]`, hindari menggunakan `id` tetap, untuk mencegah duplikasi `id` di beberapa Block/Popup.
- Pembersihan event: baris Table mungkin berubah dinamis dengan pagination/refresh, cell akan di-render berulang kali. Sebelum bind event harus melakukan pembersihan atau dedup, hindari trigger berulang.
- Saran performa: hindari memuat library besar berulang di setiap cell; harus melakukan cache library di lapisan atas (seperti melalui variabel global atau variabel level table) kemudian digunakan kembali.
