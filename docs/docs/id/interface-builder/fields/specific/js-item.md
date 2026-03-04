:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Pengenalan

JS Item digunakan untuk "item kustom" (bukan pengikatan bidang) dalam formulir. Anda dapat menggunakan JavaScript/JSX untuk merender konten apa pun (petunjuk, statistik, pratinjau, tombol, dll.), dan berinteraksi dengan formulir serta konteks catatan, cocok untuk skenario seperti pratinjau real-time, petunjuk instruksional, komponen interaksi kecil, dll.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API Konteks Runtime (Sering Digunakan)

- `ctx.element`: Kontainer DOM (ElementProxy) dari item saat ini, mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.;
- `ctx.form`: Instans AntD Form, dapat melakukan `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, dll.;
- `ctx.blockModel`: Model blok formulir tempatnya berada, dapat mendengarkan `formValuesChange` untuk menerapkan keterkaitan;
- `ctx.record` / `ctx.collection`: Informasi metadata catatan dan koleksi saat ini (tersedia dalam beberapa skenario);
- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL;
- `ctx.openView(viewUid, options)`: Membuka tampilan yang telah dikonfigurasi (laci/dialog/halaman);
- `ctx.message` / `ctx.notification`: Petunjuk dan notifikasi global;
- `ctx.t()` / `ctx.i18n.t()`: Internasionalisasi;
- `ctx.onRefReady(ctx.ref, cb)`: Merender setelah kontainer siap;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Pustaka bawaan seperti React / ReactDOM / Ant Design / Ikon Ant Design / dayjs / lodash / math.js / formula.js, digunakan untuk perenderaan JSX, pemrosesan waktu, manipulasi data, dan operasi matematika. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: Merender elemen React/HTML/DOM ke kontainer default `ctx.element`; perenderaan berulang akan menggunakan kembali Root dan menimpa konten kontainer yang ada.

## Editor dan Potongan Kode

- `Snippets`: Membuka daftar potongan kode bawaan, dapat dicari dan dimasukkan ke posisi kursor saat ini dengan satu klik.
- `Run`: Menjalankan kode saat ini secara langsung, dan mengeluarkan log eksekusi ke panel `Logs` di bagian bawah; mendukung `console.log/info/warn/error` dan penentuan lokasi kesalahan dengan penyorotan.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Dapat dikombinasikan dengan Karyawan AI untuk menghasilkan/memodifikasi skrip: [Karyawan AI · Nathan: Insinyur Frontend](/ai-employees/features/built-in-employee)

## Penggunaan Umum (Contoh Sederhana)

### 1) Pratinjau Real-time (Membaca Nilai Formulir)

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

### 2) Membuka Tampilan (Laci)

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

### 3) Memuat Pustaka Eksternal dan Merender

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Catatan

- Pemuatan pustaka eksternal disarankan menggunakan CDN tepercaya, siapkan penanganan cadangan untuk skenario kegagalan (seperti `if (!lib) return;`).
- Selektor disarankan memprioritaskan penggunaan `class` atau `[name=...]`, hindari penggunaan `id` tetap untuk mencegah duplikasi `id` dalam beberapa blok/pop-up.
- Pembersihan event: Perubahan nilai formulir yang sering akan memicu perenderaan berulang, bersihkan atau hapus duplikasi sebelum mengikat event (seperti `remove` sebelum `add`, atau `{ once: true }`, atau gunakan penanda `dataset` untuk mencegah pengulangan).

## Dokumentasi Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Keterkaitan](/interface-builder/linkage-rule)
- [Tampilan dan Pop-up](/interface-builder/actions/types/view)