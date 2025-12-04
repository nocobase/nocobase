:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# JS Item

## Pendahuluan

JS Item digunakan untuk "item kustom" (tidak terikat pada bidang) dalam sebuah formulir. Anda dapat menggunakan JavaScript/JSX untuk merender konten apa pun (seperti tips, statistik, pratinjau, tombol, dll.) dan berinteraksi dengan konteks formulir dan catatan. Ini cocok untuk skenario seperti pratinjau real-time, petunjuk instruksional, dan komponen interaktif kecil.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API Konteks Runtime (Sering Digunakan)

- `ctx.element`: Kontainer DOM (ElementProxy) dari item saat ini, mendukung `innerHTML`, `querySelector`, `addEventListener`, dll.
- `ctx.form`: Instans Formulir AntD, memungkinkan operasi seperti `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, dll.
- `ctx.blockModel`: Model blok formulir tempatnya berada, yang dapat mendengarkan `formValuesChange` untuk mengimplementasikan keterkaitan.
- `ctx.record` / `ctx.collection`: Catatan saat ini dan metadata koleksi (tersedia dalam beberapa skenario).
- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL.
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL.
- `ctx.openView(viewUid, options)`: Membuka tampilan yang telah dikonfigurasi (drawer/dialog/halaman).
- `ctx.message` / `ctx.notification`: Pesan dan notifikasi global.
- `ctx.t()` / `ctx.i18n.t()`: Internasionalisasi.
- `ctx.onRefReady(ctx.ref, cb)`: Merender setelah kontainer siap.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Pustaka bawaan seperti React, ReactDOM, Ant Design, ikon Ant Design, dan dayjs, digunakan untuk rendering JSX dan utilitas waktu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
- `ctx.render(vnode)`: Merender elemen React/HTML/DOM ke kontainer default `ctx.element`. Beberapa rendering akan menggunakan kembali Root dan menimpa konten yang ada di kontainer.

## Editor dan Cuplikan Kode

- `Snippets`: Membuka daftar cuplikan kode bawaan, memungkinkan Anda mencari dan menyisipkannya di posisi kursor saat ini dengan satu klik.
- `Run`: Menjalankan kode saat ini secara langsung dan menampilkan log eksekusi ke panel `Logs` di bagian bawah. Ini mendukung `console.log/info/warn/error` dan penyorotan kesalahan.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Dapat digunakan bersama dengan Karyawan AI untuk menghasilkan/memodifikasi skrip: [Karyawan AI · Nathan: Insinyur Frontend](/ai-employees/built-in/ai-coding)

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

### 2) Membuka Tampilan (Drawer)

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

### 3) Memuat dan Merender Pustaka Eksternal

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Catatan

- Disarankan untuk menggunakan CDN tepercaya untuk memuat pustaka eksternal, dan memiliki mekanisme fallback untuk skenario kegagalan (misalnya, `if (!lib) return;`).
- Disarankan untuk memprioritaskan penggunaan `class` atau `[name=...]` untuk selektor dan menghindari penggunaan `id` tetap untuk mencegah duplikasi `id` di beberapa blok/popup.
- Pembersihan event: Perubahan nilai formulir yang sering akan memicu beberapa rendering. Sebelum mengikat event, event tersebut harus dibersihkan atau diduplikasi (misalnya, `remove` sebelum `add`, gunakan `{ once: true }`, atau gunakan atribut `dataset` untuk mencegah duplikasi).

## Dokumentasi Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Keterkaitan](/interface-builder/linkage-rule)
- [Tampilan dan Popup](/interface-builder/actions/types/view)