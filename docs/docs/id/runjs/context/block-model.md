:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/block-model).
:::

# ctx.blockModel

Model blok induk (instansi BlockModel) tempat JS Field / JS Block saat ini berada. Dalam skenario seperti JSField, JSItem, dan JSColumn, `ctx.blockModel` merujuk pada blok formulir atau blok tabel yang memuat logika JS saat ini. Dalam JSBlock mandiri, nilainya mungkin `null` atau sama dengan `ctx.model`.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSField** | Mengakses `form`, `koleksi`, dan `resource` dari blok formulir induk di dalam bidang formulir untuk menerapkan keterkaitan (linkage) atau validasi. |
| **JSItem** | Mengakses informasi sumber daya dan koleksi dari blok tabel/formulir induk di dalam item sub-tabel. |
| **JSColumn** | Mengakses `resource` (misalnya, `getSelectedRows`) dan `koleksi` dari blok tabel induk di dalam kolom tabel. |
| **Operasi Formulir / Alur Peristiwa** | Mengakses `form` untuk validasi sebelum pengiriman, `resource` untuk penyegaran, dll. |

> Catatan: `ctx.blockModel` hanya tersedia dalam konteks RunJS di mana terdapat blok induk. Pada JSBlock mandiri (tanpa formulir/tabel induk), nilainya mungkin `null`. Disarankan untuk melakukan pemeriksaan nilai kosong (null check) sebelum digunakan.

## Definisi Tipe

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Tipe spesifik bergantung pada tipe blok induk: blok formulir biasanya berupa `FormBlockModel` atau `EditFormModel`, sedangkan blok tabel biasanya berupa `TableBlockModel`.

## Properti Umum

| Properti | Tipe | Keterangan |
|------|------|------|
| `uid` | `string` | Pengidentifikasi unik dari model blok. |
| `collection` | `Collection` | Koleksi yang terikat dengan blok saat ini. |
| `resource` | `Resource` | Instansi sumber daya yang digunakan oleh blok (`SingleRecordResource` / `MultiRecordResource`, dll.). |
| `form` | `FormInstance` | Blok Formulir: Instansi Ant Design Form, mendukung `getFieldsValue`, `validateFields`, `setFieldsValue`, dll. |
| `emitter` | `EventEmitter` | Pemancar acara (event emitter), dapat mendengarkan `formValuesChange`, `onFieldReset`, dll. |

## Hubungan dengan ctx.model dan ctx.form

| Kebutuhan | Penggunaan yang Disarankan |
|------|----------|
| **Blok induk dari JS saat ini** | `ctx.blockModel` |
| **Baca/tulis bidang formulir** | `ctx.form` (setara dengan `ctx.blockModel?.form`, lebih praktis dalam blok formulir) |
| **Model dari konteks eksekusi saat ini** | `ctx.model` (Model bidang dalam JSField, model blok dalam JSBlock) |

Dalam JSField, `ctx.model` adalah model bidang, dan `ctx.blockModel` adalah blok formulir atau tabel yang memuat bidang tersebut; `ctx.form` biasanya adalah `ctx.blockModel.form`.

## Contoh

### Tabel: Mendapatkan baris yang dipilih dan memprosesnya

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Silakan pilih data terlebih dahulu');
  return;
}
```

### Skenario Formulir: Validasi dan Segarkan

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Mendengarkan Perubahan Formulir

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Melakukan keterkaitan atau render ulang berdasarkan nilai formulir terbaru
});
```

### Memicu Render Ulang Blok

```ts
ctx.blockModel?.rerender?.();
```

## Catatan

- Dalam **JSBlock mandiri** (tanpa blok formulir atau tabel induk), `ctx.blockModel` mungkin bernilai `null`. Disarankan untuk menggunakan optional chaining saat mengakses propertinya: `ctx.blockModel?.resource?.refresh?.()`.
- Dalam **JSField / JSItem / JSColumn**, `ctx.blockModel` merujuk pada blok formulir atau tabel yang memuat bidang saat ini. Dalam **JSBlock**, ini bisa berupa dirinya sendiri atau blok tingkat atas, tergantung pada hierarki sebenarnya.
- `resource` hanya ada pada blok data; `form` hanya ada pada blok formulir. Blok tabel biasanya tidak memiliki `form`.

## Terkait

- [ctx.model](./model.md): Model dari konteks eksekusi saat ini.
- [ctx.form](./form.md): Instansi formulir, umum digunakan dalam blok formulir.
- [ctx.resource](./resource.md): Instansi sumber daya (setara dengan `ctx.blockModel?.resource`, gunakan langsung jika tersedia).
- [ctx.getModel()](./get-model.md): Mendapatkan model blok lain berdasarkan UID.