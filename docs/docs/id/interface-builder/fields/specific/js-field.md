:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/fields/specific/js-field).
:::

# JS Field

## 介绍

JS Field digunakan untuk merender konten secara kustom dengan JavaScript pada posisi field, sering ditemukan dalam blok detail, item formulir hanya-baca, atau "Item kustom lainnya" pada kolom tabel. Cocok untuk tampilan personalisasi, kombinasi informasi turunan, badge status, teks kaya, atau rendering grafik.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## 类型

- Tipe Hanya-baca: Digunakan untuk tampilan yang tidak dapat diedit, membaca `ctx.value` untuk merender output.
- Tipe Dapat Diedit: Digunakan untuk interaksi input kustom, menyediakan `ctx.getValue()`/`ctx.setValue(v)` dan event kontainer `js-field:value-change`, memudahkan sinkronisasi dua arah dengan nilai formulir.

## 使用场景

- Hanya-baca
  - Blok detail: Menampilkan hasil perhitungan, badge status, fragmen teks kaya, grafik, dan konten hanya-baca lainnya;
  - Blok tabel: Digunakan sebagai "Kolom kustom lainnya > JS Field" untuk tampilan hanya-baca (jika memerlukan kolom yang tidak terikat dengan field, silakan gunakan JS Column);

- Dapat Diedit
  - Blok formulir (CreateForm/EditForm): Digunakan untuk kontrol input kustom atau input komposit, mengikuti validasi dan pengiriman formulir;
  - Skenario yang cocok: Komponen input pustaka eksternal, editor teks kaya/kode, komponen dinamis yang kompleks, dll;

## 运行时上下文 API

Kode runtime JS Field dapat langsung menggunakan kemampuan konteks berikut:

- `ctx.element`: Kontainer DOM field (ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dll;
- `ctx.value`: Nilai field saat ini (hanya-baca);
- `ctx.record`: Objek record saat ini (hanya-baca);
- `ctx.collection`: Meta-informasi dari koleksi tempat field berada (hanya-baca);
- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL;
- `ctx.openView(options)`: Membuka tampilan yang telah dikonfigurasi (pop-up/drawer/halaman);
- `ctx.i18n.t()` / `ctx.t()`: Internasionalisasi;
- `ctx.onRefReady(ctx.ref, cb)`: Merender setelah kontainer siap;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Pustaka umum bawaan seperti React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, digunakan untuk rendering JSX, pemrosesan waktu, manipulasi data, dan operasi matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: Merender elemen React, string HTML, atau node DOM ke kontainer default `ctx.element`; rendering berulang akan menggunakan kembali Root dan menimpa konten kontainer yang ada.

Khusus Tipe Dapat Diedit (JSEditableField):

- `ctx.getValue()`: Mendapatkan nilai formulir saat ini (memprioritaskan status formulir, lalu kembali ke props field).
- `ctx.setValue(v)`: Mengatur nilai formulir dan props field, menjaga sinkronisasi dua arah.
- Event kontainer `js-field:value-change`: Dipicu saat nilai eksternal berubah, memudahkan skrip untuk memperbarui tampilan input.

## 编辑器与片段

Editor skrip JS Field mendukung penyorotan sintaks, petunjuk kesalahan, dan cuplikan kode bawaan (Snippets).

- `Snippets`: Membuka daftar cuplikan kode bawaan, dapat dicari dan disisipkan ke posisi kursor saat ini dengan satu klik.
- `Run`: Menjalankan kode saat ini secara langsung, log eksekusi dikeluarkan ke panel `Logs` di bagian bawah, mendukung `console.log/info/warn/error` dan penyorotan lokasi kesalahan.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Dapat dikombinasikan dengan Karyawan AI untuk menghasilkan kode:

- [Karyawan AI · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## 常见用法

### 1) 基础渲染（读取字段值）

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) 使用 JSX 渲染 React 组件

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) 加载第三方库（AMD/UMD 或 ESM）

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) 点击打开弹窗/抽屉（openView）

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

### 5) 可编辑输入（JSEditableFieldModel)

```js
// Merender input sederhana dengan JSX dan menyinkronkan nilai formulir
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

## 注意事项

- Pemuatan pustaka eksternal disarankan menggunakan CDN tepercaya, dan siapkan penanganan untuk skenario kegagalan (seperti `if (!lib) return;`).
- Selektor disarankan memprioritaskan penggunaan `class` atau `[name=...]`, hindari penggunaan `id` tetap untuk mencegah duplikasi `id` pada beberapa blok/pop-up.
- Pembersihan event: Field mungkin dirender ulang beberapa kali karena perubahan data atau perpindahan tampilan, sebelum mengikat event harus dibersihkan atau dihilangkan duplikasinya untuk menghindari pemicuan berulang. Dapat dilakukan dengan "remove dulu baru add".