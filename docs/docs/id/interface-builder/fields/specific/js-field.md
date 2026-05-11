---
title: "JSField JS Field"
description: "JSField JS Field: menyematkan logika JavaScript kustom di Field Form, mendukung React, konteks ctx."
keywords: "JSField, JS Field, Field kustom, JavaScript, interface builder, NocoBase"
---

# JS Field

## Pengantar

JS Field digunakan untuk merender konten kustom di posisi Field dengan JavaScript. Sering ditemui di Block Detail, item read-only di Form, atau "item kustom lainnya" di kolom Table. Cocok untuk tampilan personal, kombinasi informasi turunan, badge status, render rich text atau chart, dll.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipe

- Read-only: digunakan untuk tampilan tidak dapat diedit, membaca `ctx.value` untuk render output.
- Editable: digunakan untuk interaksi input kustom, menyediakan `ctx.getValue()`/`ctx.setValue(v)` dan event container `js-field:value-change`, memudahkan sinkronisasi dua arah dengan nilai Form.

## Skenario Penggunaan

- Read-only
  - Block Detail: menampilkan hasil perhitungan, badge status, snippet rich text, chart, dan konten read-only lainnya;
  - Block Table: digunakan sebagai "kolom kustom lainnya > JS Field" untuk tampilan read-only (jika perlu kolom yang tidak terikat Field, gunakan JS Column);

- Editable
  - Block Form (CreateForm/EditForm): digunakan untuk control input kustom atau input gabungan, mengikuti validasi dan submit Form;
  - Skenario yang cocok: komponen input library eksternal, rich text/code editor, komponen dinamis kompleks, dll.;

## API Konteks Runtime

Kode runtime JS Field dapat langsung menggunakan kemampuan konteks berikut:

- `ctx.element`: container DOM Field (ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.;
- `ctx.value`: nilai Field saat ini (read-only);
- `ctx.record`: objek record saat ini (read-only);
- `ctx.collection`: meta info collection tempat Field berada (read-only);
- `ctx.requireAsync(url)`: load library AMD/UMD secara asynchronous berdasarkan URL;
- `ctx.importAsync(url)`: import modul ESM secara dinamis berdasarkan URL;
- `ctx.openView(options)`: membuka view yang sudah dikonfigurasi (Popup/drawer/page);
- `ctx.i18n.t()` / `ctx.t()`: internasionalisasi;
- `ctx.onRefReady(ctx.ref, cb)`: render setelah container siap;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: library umum bawaan seperti React / ReactDOM / Ant Design / icon Ant Design / dayjs / lodash / math.js / formula.js, dll., digunakan untuk render JSX, pemrosesan waktu, operasi data, dan operasi matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` masih dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: render React element, HTML string, atau DOM node ke container default `ctx.element`; render berulang akan menggunakan kembali Root, dan menimpa konten container yang ada.

Khusus Editable (JSEditableField):

- `ctx.getValue()`: mendapatkan nilai Form saat ini (prioritas menggunakan state Form, kemudian fallback ke props Field).
- `ctx.setValue(v)`: mengatur nilai Form dan props Field, menjaga sinkronisasi dua arah.
- Event container `js-field:value-change`: dipicu saat nilai eksternal berubah, memudahkan script update tampilan input.

## Editor dan Snippet

Editor script JS Field mendukung syntax highlighting, error prompt, dan snippet kode bawaan (Snippets).

- `Snippets`: Membuka daftar snippet kode bawaan, dapat dicari dan dengan satu klik menyisipkan ke posisi cursor saat ini.
- `Run`: Langsung menjalankan kode saat ini, log eksekusi output ke panel `Logs` di bawah, mendukung `console.log/info/warn/error` dan highlight lokasi error.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Dapat dikombinasikan dengan AI Employee untuk generate kode:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Penggunaan Umum

### 1) Render Dasar (Membaca Nilai Field)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Menggunakan JSX untuk Render Komponen React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Load Library Pihak Ketiga (AMD/UMD atau ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Klik untuk Membuka Popup/Drawer (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Lihat Detail</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Input Editable (JSEditableFieldModel)

```js
// Render input sederhana dengan JSX, dan sinkronisasi nilai Form
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Sinkronisasi ke input saat nilai eksternal berubah (opsional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Perhatian

- Disarankan menggunakan CDN terpercaya untuk load library eksternal, dan siapkan fallback untuk skenario kegagalan (seperti `if (!lib) return;`).
- Saran selector prioritaskan menggunakan `class` atau `[name=...]`, hindari menggunakan `id` tetap, untuk mencegah duplikasi `id` di beberapa Block/Popup.
- Pembersihan event: Field mungkin di-render berulang kali karena perubahan data atau peralihan view. Sebelum bind event harus melakukan pembersihan atau dedup, hindari trigger berulang. Dapat menggunakan "remove dulu kemudian add".
