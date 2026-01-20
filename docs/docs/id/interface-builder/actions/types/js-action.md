:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# JS Action

## Pendahuluan

JS Action digunakan untuk menjalankan JavaScript saat tombol diklik, memungkinkan kustomisasi perilaku bisnis apa pun. Ini dapat digunakan di bilah alat formulir, bilah alat tabel (tingkat koleksi), baris tabel (tingkat rekaman), dan lokasi lainnya untuk melakukan operasi seperti validasi, menampilkan notifikasi, memanggil API, membuka pop-up/drawer, dan menyegarkan data.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API Konteks Runtime (Umum Digunakan)

- `ctx.api.request(options)`: Membuat permintaan HTTP;
- `ctx.openView(viewUid, options)`: Membuka tampilan yang telah dikonfigurasi (drawer/dialog/halaman);
- `ctx.message` / `ctx.notification`: Pesan dan notifikasi global;
- `ctx.t()` / `ctx.i18n.t()`: Internasionalisasi;
- `ctx.resource`: Sumber daya data untuk konteks tingkat koleksi (misalnya, bilah alat tabel), termasuk metode seperti `getSelectedRows()` dan `refresh()`;
- `ctx.record`: Rekaman baris saat ini untuk konteks tingkat rekaman (misalnya, tombol baris tabel);
- `ctx.form`: Instans AntD Form untuk konteks tingkat formulir (misalnya, tombol bilah alat formulir);
- `ctx.collection`: Metadata dari koleksi saat ini;
- Editor kode mendukung `Snippets` dan `Run` untuk pra-eksekusi (lihat di bawah).

- `ctx.requireAsync(url)`: Memuat pustaka AMD/UMD secara asinkron dari URL;
- `ctx.importAsync(url)`: Mengimpor modul ESM secara dinamis dari URL;

> Variabel yang tersedia mungkin berbeda tergantung pada lokasi tombol. Daftar di atas adalah gambaran umum kemampuan yang umum.

## Editor dan Snippets

- `Snippets`: Membuka daftar cuplikan kode bawaan yang dapat dicari dan disisipkan di posisi kursor saat ini dengan sekali klik.
- `Run`: Menjalankan kode saat ini secara langsung dan menampilkan log eksekusi ke panel `Logs` di bagian bawah. Ini mendukung `console.log/info/warn/error` dan menyoroti kesalahan untuk lokasi yang mudah.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Anda dapat menggunakan karyawan AI untuk membuat/memodifikasi skrip: [Karyawan AI · Nathan: Insinyur Frontend](/ai-employees/built-in/ai-coding)

## Penggunaan Umum (Contoh Sederhana)

### 1) Permintaan API dan Notifikasi

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Tombol Koleksi: Validasi Pilihan dan Proses

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Implementasikan logika bisnis…
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

### 4) Membuka Tampilan (Drawer/Dialog)

```js
const popupUid = ctx.model.uid + '-open'; // Ikat ke tombol saat ini untuk stabilitas
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Menyegarkan Data Setelah Pengiriman

```js
// Penyegaran umum: Prioritaskan sumber daya tabel/daftar, kemudian sumber daya blok yang berisi formulir
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Catatan

- **Tindakan Idempoten**: Untuk mencegah beberapa pengiriman akibat klik berulang, Anda dapat menambahkan tanda status dalam logika Anda atau menonaktifkan tombol.
- **Penanganan Kesalahan**: Tambahkan blok try/catch untuk panggilan API dan berikan umpan balik yang ramah pengguna.
- **Interaksi Tampilan**: Saat membuka pop-up/drawer dengan `ctx.openView`, disarankan untuk meneruskan parameter secara eksplisit dan, jika perlu, secara aktif menyegarkan sumber daya induk setelah pengiriman berhasil.

## Dokumen Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Keterkaitan](/interface-builder/linkage-rule)
- [Tampilan dan Pop-up](/interface-builder/actions/types/view)