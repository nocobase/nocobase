:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/actions/types/js-action).
:::

# JS Action

## Pendahuluan

JS Action digunakan untuk mengeksekusi JavaScript saat tombol diklik, guna menyesuaikan perilaku bisnis apa pun. Ini dapat digunakan di bilah alat formulir, bilah alat tabel (tingkat koleksi), baris tabel (tingkat rekaman), dan lokasi lainnya, untuk mewujudkan operasi seperti validasi, petunjuk, pemanggilan antarmuka, membuka jendela pop-up/laci, menyegarkan data, dll.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API Konteks Runtime (Umum Digunakan)

- `ctx.api.request(options)`: Melakukan permintaan HTTP;
- `ctx.openView(viewUid, options)`: Membuka tampilan yang telah dikonfigurasi (laci/dialog/halaman);
- `ctx.message` / `ctx.notification`: Petunjuk dan notifikasi global;
- `ctx.t()` / `ctx.i18n.t()`: Internasionalisasi;
- `ctx.resource`: Sumber data konteks tingkat koleksi (seperti bilah alat tabel, termasuk `getSelectedRows()`, `refresh()`, dll.);
- `ctx.record`: Rekaman baris saat ini dari konteks tingkat rekaman (seperti tombol baris tabel);
- `ctx.form`: Instans AntD Form dari konteks tingkat formulir (seperti tombol bilah alat formulir);
- `ctx.collection`: Informasi meta koleksi saat ini;
- Editor kode mendukung fragmen `Snippets` dan pra-eksekusi `Run` (lihat di bawah).


- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron berdasarkan URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis berdasarkan URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Pustaka umum bawaan seperti React / ReactDOM / Ant Design / Ikon Ant Design / dayjs / lodash / math.js / formula.js, digunakan untuk rendering JSX, pemrosesan waktu, operasi data, dan perhitungan matematika.

> Variabel yang sebenarnya tersedia akan bervariasi tergantung pada lokasi tombol, di atas adalah gambaran umum dari kemampuan umum.

## Editor dan Fragmen

- `Snippets`: Membuka daftar fragmen kode bawaan, dapat dicari dan dimasukkan ke posisi kursor saat ini dengan satu klik.
- `Run`: Menjalankan kode saat ini secara langsung, dan mengeluarkan log jalannya ke panel `Logs` di bagian bawah; mendukung `console.log/info/warn/error` dan penentuan posisi sorotan kesalahan.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Dapat dikombinasikan dengan karyawan AI untuk membuat/mengubah skrip: [Karyawan AI · Nathan: Insinyur Frontend](/ai-employees/features/built-in-employee)

## Penggunaan Umum (Contoh Sederhana)

### 1) Permintaan Antarmuka dan Petunjuk

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Tombol Koleksi: Validasi Pilihan dan Pemrosesan

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Jalankan logika bisnis…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Tombol Rekaman: Membaca Rekaman Baris Saat Ini

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Membuka Tampilan (Laci/Dialog)

```js
const popupUid = ctx.model.uid + '-open'; // Terikat ke tombol saat ini untuk menjaga stabilitas
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Menyegarkan Data Setelah Pengiriman

```js
// Penyegaran umum: Prioritaskan sumber daya tabel/daftar, kemudian sumber daya blok tempat formulir berada
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Catatan

- Idempotensi perilaku: Hindari pengiriman berulang yang disebabkan oleh klik ganda, dapat menambahkan sakelar status atau menonaktifkan tombol dalam logika.
- Penanganan kesalahan: Tambahkan try/catch untuk pemanggilan antarmuka dan berikan petunjuk kepada pengguna.
- Kaitan tampilan: Saat membuka jendela pop-up/laci melalui `ctx.openView`, disarankan untuk meneruskan parameter secara eksplisit, dan jika perlu, segarkan sumber daya induk secara aktif setelah pengiriman berhasil.

## Dokumen Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Kaitan](/interface-builder/linkage-rule)
- [Tampilan dan Jendela Pop-up](/interface-builder/actions/types/view)