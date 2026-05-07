---
title: "JSItem JS Item"
description: "JSItem JS Item: menyematkan logika kustom di sub-table item, mendukung React, ctx, akses data baris."
keywords: "JSItem, JS Item, sub-table, logika kustom, interface builder, NocoBase"
---

# JS Item

## Pengantar

JS Item digunakan untuk "item kustom" di Form (tidak terikat Field). Anda dapat menggunakan JavaScript/JSX untuk merender konten apa pun (prompt, statistik, preview, tombol, dll.), dan berinteraksi dengan Form, konteks record. Cocok untuk skenario seperti preview real-time, prompt penjelasan, komponen interaksi kecil, dll.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API Konteks Runtime (Umum)

- `ctx.element`: container DOM item saat ini (ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.;
- `ctx.form`: instance AntD Form, dapat `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, dll.;
- `ctx.blockModel`: model Block Form tempat berada, dapat listen `formValuesChange` untuk mengimplementasikan linkage;
- `ctx.record` / `ctx.collection`: record saat ini dan meta info collection (tersedia di beberapa skenario);
- `ctx.requireAsync(url)`: load library AMD/UMD secara asynchronous berdasarkan URL;
- `ctx.importAsync(url)`: import modul ESM secara dinamis berdasarkan URL;
- `ctx.openView(viewUid, options)`: membuka view yang sudah dikonfigurasi (drawer/dialog/page);
- `ctx.message` / `ctx.notification`: prompt dan notifikasi global;
- `ctx.t()` / `ctx.i18n.t()`: internasionalisasi;
- `ctx.onRefReady(ctx.ref, cb)`: render setelah container siap;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: library umum bawaan seperti React / ReactDOM / Ant Design / icon Ant Design / dayjs / lodash / math.js / formula.js, dll., digunakan untuk render JSX, pemrosesan waktu, operasi data, dan operasi matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` masih dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: render React element/HTML/DOM ke container default `ctx.element`; render berulang akan menggunakan kembali Root, dan menimpa konten container yang ada.

## Editor dan Snippet

- `Snippets`: Membuka daftar snippet kode bawaan, dapat dicari dan dengan satu klik menyisipkan ke posisi cursor saat ini.
- `Run`: Langsung menjalankan kode saat ini, dan output log eksekusi ke panel `Logs` di bawah; mendukung `console.log/info/warn/error` dan highlight lokasi error.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Dapat dikombinasikan dengan AI Employee untuk generate/modify script: [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Penggunaan Umum (Contoh Ringkas)

### 1) Preview Real-Time (Membaca Nilai Form)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Membuka View (Drawer)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Load Library Eksternal dan Render

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Perhatian

- Disarankan menggunakan CDN terpercaya untuk load library eksternal, dan siapkan fallback untuk skenario kegagalan (seperti `if (!lib) return;`).
- Saran selector prioritaskan menggunakan `class` atau `[name=...]`, hindari menggunakan `id` tetap, untuk mencegah duplikasi `id` di beberapa Block/Popup.
- Pembersihan event: nilai Form sering berubah akan memicu render berulang, sebelum bind event harus melakukan pembersihan atau dedup (seperti `remove` dulu kemudian `add`, atau `{ once: true }`, atau menggunakan `dataset` tag untuk mencegah duplikasi).

## Dokumentasi Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Linkage](/interface-builder/linkage-rule)
- [View dan Popup](/interface-builder/actions/types/view)
