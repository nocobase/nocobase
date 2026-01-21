:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# JS Field

## Pendahuluan

JS Field digunakan untuk merender konten secara kustom di posisi field menggunakan JavaScript. Ini umumnya digunakan di blok detail, item hanya-baca pada formulir, atau sebagai "Item kustom lainnya" di kolom tabel. Ini cocok untuk tampilan yang dipersonalisasi, kombinasi informasi turunan, rendering badge status, teks kaya, atau grafik.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipe

-   **Hanya-Baca**: Digunakan untuk tampilan yang tidak dapat diedit, membaca `ctx.value` untuk merender output.
-   **Dapat Diedit**: Digunakan untuk interaksi input kustom, menyediakan `ctx.getValue()`/`ctx.setValue(v)` dan event kontainer `js-field:value-change` untuk memfasilitasi sinkronisasi dua arah dengan nilai formulir.

## Kasus Penggunaan

-   **Hanya-Baca**
    -   **Blok Detail**: Menampilkan konten hanya-baca seperti hasil perhitungan, badge status, fragmen teks kaya, grafik, dsb.
    -   **Blok Tabel**: Digunakan sebagai "Kolom kustom lainnya > JS Field" untuk tampilan hanya-baca (jika Anda membutuhkan kolom yang tidak terikat ke field, silakan gunakan JS Column).

-   **Dapat Diedit**
    -   **Blok Formulir (CreateForm/EditForm)**: Digunakan untuk kontrol input kustom atau input komposit, yang divalidasi dan disubmit bersama formulir.
    -   **Cocok untuk skenario seperti**: komponen input dari pustaka eksternal, editor teks kaya/kode, komponen dinamis yang kompleks, dsb.

## API Konteks Runtime

Kode runtime JS Field dapat langsung menggunakan kemampuan konteks berikut:

-   `ctx.element`: Kontainer DOM field (ElementProxy), mendukung `innerHTML`, `querySelector`, `addEventListener`, dsb.
-   `ctx.value`: Nilai field saat ini (hanya-baca).
-   `ctx.record`: Objek record saat ini (hanya-baca).
-   `ctx.collection`: Metadata dari koleksi tempat field berada (hanya-baca).
-   `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL.
-   `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL.
-   `ctx.openView(options)`: Membuka tampilan yang telah dikonfigurasi (pop-up/drawer/halaman).
-   `ctx.i18n.t()` / `ctx.t()`: Internasionalisasi.
-   `ctx.onRefReady(ctx.ref, cb)`: Merender setelah kontainer siap.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Pustaka bawaan React, ReactDOM, Ant Design, ikon Ant Design, dan dayjs untuk rendering JSX dan utilitas tanggal-waktu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` tetap dipertahankan untuk kompatibilitas.)
-   `ctx.render(vnode)`: Merender elemen React, string HTML, atau node DOM ke dalam kontainer default `ctx.element`. Rendering berulang akan menggunakan kembali Root dan menimpa konten kontainer yang sudah ada.

Khusus untuk tipe Dapat Diedit (JSEditableField):

-   `ctx.getValue()`: Mendapatkan nilai formulir saat ini (memprioritaskan status formulir, lalu kembali ke prop field).
-   `ctx.setValue(v)`: Mengatur nilai formulir dan prop field, menjaga sinkronisasi dua arah.
-   Event kontainer `js-field:value-change`: Dipicu ketika nilai eksternal berubah, memudahkan skrip untuk memperbarui tampilan input.

## Editor dan Cuplikan Kode

Editor skrip JS Field mendukung penyorotan sintaks, petunjuk kesalahan, dan cuplikan kode bawaan (Snippets).

-   `Snippets`: Membuka daftar cuplikan kode bawaan, yang dapat dicari dan disisipkan di posisi kursor saat ini dengan sekali klik.
-   `Run`: Langsung mengeksekusi kode saat ini. Log eksekusi ditampilkan di panel `Logs` di bagian bawah, mendukung `console.log/info/warn/error` dan penyorotan kesalahan untuk lokasi yang mudah.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Anda juga dapat menghasilkan kode dengan AI Employee:

-   [AI Employee · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Penggunaan Umum

### 1) Rendering Dasar (Membaca Nilai Field)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Menggunakan JSX untuk Merender Komponen React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Memuat Pustaka Pihak Ketiga (AMD/UMD atau ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Mengklik untuk Membuka Pop-up/Drawer (openView)

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

### 5) Input yang Dapat Diedit (JSEditableFieldModel)

```js
// Merender input sederhana menggunakan JSX dan menyinkronkan nilai formulir
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

// Sinkronkan input ketika nilai eksternal berubah (opsional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Catatan

-   Disarankan untuk menggunakan CDN tepercaya untuk memuat pustaka eksternal dan memiliki mekanisme cadangan untuk skenario kegagalan (misalnya, `if (!lib) return;`).
-   Disarankan untuk memprioritaskan penggunaan `class` atau `[name=...]` untuk selektor, dan hindari penggunaan `id` tetap untuk mencegah duplikasi `id` di beberapa blok atau pop-up.
-   Pembersihan Event: Field mungkin dirender ulang beberapa kali karena perubahan data atau pergantian tampilan. Sebelum mengikat event, Anda harus membersihkannya atau menghilangkan duplikasi untuk menghindari pemicuan berulang. Dapat "menghapus lalu menambahkan".