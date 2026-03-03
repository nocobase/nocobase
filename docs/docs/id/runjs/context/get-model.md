:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/get-model).
:::

# ctx.getModel()

Mengambil instance model (seperti `BlockModel`, `PageModel`, `ActionModel`, dll.) dari engine saat ini atau tumpukan tampilan (view stack) berdasarkan `uid` model. Ini digunakan dalam RunJS untuk mengakses model lain di berbagai blok, halaman, atau popup.

Jika Anda hanya memerlukan model atau blok tempat konteks eksekusi saat ini berada, prioritaskan penggunaan `ctx.model` atau `ctx.blockModel` daripada `ctx.getModel`.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock / JSAction** | Mendapatkan model dari blok lain berdasarkan `uid` yang diketahui untuk membaca atau menulis `resource`, `form`, `setProps`, dll. |
| **RunJS dalam Popup** | Saat perlu mengakses model pada halaman yang membuka popup, teruskan `searchInPreviousEngines: true`. |
| **Tindakan Kustom** | Menemukan formulir atau sub-model dalam panel pengaturan berdasarkan `uid` di seluruh tumpukan tampilan untuk membaca konfigurasi atau statusnya. |

## Definisi Tipe

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameter

| Parameter | Tipe | Keterangan |
|------|------|------|
| `uid` | `string` | Identitas unik dari instance model target, ditentukan saat konfigurasi atau pembuatan (misalnya, `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Opsional, defaultnya `false`. Jika `true`, pencarian dilakukan dari engine saat ini hingga ke akar (root) dalam "tumpukan tampilan", memungkinkan akses ke model di engine tingkat atas (misalnya, halaman yang membuka popup). |

## Nilai Kembalian

- Mengembalikan instance subclass `FlowModel` yang sesuai (seperti `BlockModel`, `FormBlockModel`, `ActionModel`) jika ditemukan.
- Mengembalikan `undefined` jika tidak ditemukan.

## Cakupan Pencarian

- **Default (`searchInPreviousEngines: false`)**: Hanya mencari di dalam **engine saat ini** berdasarkan `uid`. Dalam popup atau tampilan bertingkat, setiap tampilan memiliki engine independen; secara default, pencarian hanya dilakukan untuk model di dalam tampilan saat ini.
- **`searchInPreviousEngines: true`**: Mencari ke atas sepanjang rantai `previousEngine` mulai dari engine saat ini, mengembalikan kecocokan pertama yang ditemukan. Ini berguna untuk mengakses model pada halaman yang membuka popup saat ini.

## Contoh

### Mendapatkan blok lain dan menyegarkan data

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Mengakses model pada halaman dari dalam popup

```ts
// Mengakses blok pada halaman yang membuka popup saat ini
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Baca/tulis lintas model dan memicu render ulang (rerender)

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Pemeriksaan keamanan

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Model target tidak ditemukan');
  return;
}
```

## Terkait

- [ctx.model](./model.md): Model tempat konteks eksekusi saat ini berada.
- [ctx.blockModel](./block-model.md): Model blok induk tempat JS saat ini berada; biasanya dapat diakses tanpa memerlukan `getModel`.