:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/model).
:::

# ctx.model

Instance `FlowModel` tempat konteks eksekusi RunJS saat ini berada, yang berfungsi sebagai titik masuk default untuk skenario seperti JSBlock, JSField, dan JSAction. Tipe spesifiknya bervariasi tergantung pada konteks: bisa berupa subkelas seperti `BlockModel`, `ActionModel`, atau `JSEditableFieldModel`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | `ctx.model` adalah model blok saat ini, Anda dapat mengakses `resource`, `koleksi`, `setProps`, dll. |
| **JSField / JSItem / JSColumn** | `ctx.model` adalah model bidang (field), Anda dapat mengakses `setProps`, `dispatchEvent`, dll. |
| **Action Events / ActionModel** | `ctx.model` adalah model tindakan (action), Anda dapat membaca/menulis parameter langkah, mengirimkan event, dll. |

> Tip: Jika Anda perlu mengakses **blok induk yang memuat JS saat ini** (seperti blok Formulir/Tabel), gunakan `ctx.blockModel`; jika Anda perlu mengakses **model lain**, gunakan `ctx.getModel(uid)`.

## Definisi Tipe

```ts
model: FlowModel;
```

`FlowModel` adalah kelas dasar. Pada saat runtime, ini merupakan instance dari berbagai subkelas (seperti `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, dll.). Properti dan metode yang tersedia bergantung pada tipe spesifiknya.

## Properti Umum

| Properti | Tipe | Deskripsi |
|------|------|------|
| `uid` | `string` | Identitas unik model, dapat digunakan untuk `ctx.getModel(uid)` atau pengikatan UID popup. |
| `collection` | `Collection` | Koleksi yang terikat dengan model saat ini (ada ketika blok/bidang terikat pada data). |
| `resource` | `Resource` | Instance resource terkait, digunakan untuk menyegarkan, mendapatkan baris yang dipilih, dll. |
| `props` | `object` | Konfigurasi UI/perilaku model, dapat diperbarui menggunakan `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Kumpulan sub-model (seperti bidang di dalam formulir, kolom di dalam tabel). |
| `parent` | `FlowModel` | Model induk (jika ada). |

## Metode Umum

| Metode | Deskripsi |
|------|------|
| `setProps(partialProps: any): void` | Memperbarui konfigurasi model dan memicu perenderan ulang (misalnya, `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Mengirimkan event ke model, memicu alur kerja yang dikonfigurasi pada model tersebut yang mendengarkan nama event tersebut. `payload` opsional diteruskan ke handler alur kerja; `options.debounce` dapat mengaktifkan fitur debounce. |
| `getStepParams?.(flowKey, stepKey)` | Membaca parameter langkah alur kerja konfigurasi (digunakan dalam panel pengaturan, tindakan kustom, dll.). |
| `setStepParams?.(flowKey, stepKey, params)` | Menulis parameter langkah alur kerja konfigurasi. |

## Hubungan dengan ctx.blockModel dan ctx.getModel

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Model dari konteks eksekusi saat ini** | `ctx.model` |
| **Blok induk dari JS saat ini** | `ctx.blockModel`, sering digunakan untuk mengakses `resource`, `form`, atau `koleksi`. |
| **Mendapatkan model apa pun berdasarkan UID** | `ctx.getModel(uid)` atau `ctx.getModel(uid, true)` (pencarian lintas tumpukan tampilan). |

Dalam JSField, `ctx.model` adalah model bidang, sedangkan `ctx.blockModel` adalah blok Formulir atau Tabel yang memuat bidang tersebut.

## Contoh

### Memperbarui Status Blok/Tindakan

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Mengirimkan Event Model

```ts
// Mengirimkan event untuk memicu alur kerja yang dikonfigurasi pada model ini yang mendengarkan nama event ini
await ctx.model.dispatchEvent('remove');

// Ketika payload diberikan, payload tersebut akan diteruskan ke ctx.inputArgs pada handler alur kerja
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Menggunakan UID untuk Pengikatan Popup atau Akses Lintas Model

```ts
const myUid = ctx.model.uid;
// Dalam konfigurasi popup, Anda dapat memasukkan openerUid: myUid untuk pengaitan
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Terkait

- [ctx.blockModel](./block-model.md): Model blok induk tempat JS saat ini berada.
- [ctx.getModel()](./get-model.md): Mendapatkan model lain berdasarkan UID.