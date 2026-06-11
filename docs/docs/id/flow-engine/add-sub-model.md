---
title: "AddSubModelButton"
description: "AddSubModelButton: menambahkan subModel ke FlowModel yang ditentukan, mendukung menu asynchronous, group, sub-menu, filter kelas turunan, dan bentuk toggle."
keywords: "AddSubModelButton,subModel,FlowModel,FlowEngine,Menu asynchronous,Menu group"
---

# AddSubModelButton

Digunakan untuk menambahkan sub-model (subModel) ke `FlowModel` yang ditentukan. Mendukung berbagai cara konfigurasi seperti loading asynchronous, group, sub-menu, aturan inheritance model kustom, dan sebagainya.

## Props

```ts pure
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `model` | `FlowModel` | **Wajib**. Model target yang akan ditambahi sub-model. |
| `subModelKey` | `string` | **Wajib**. Nama key untuk sub-model di `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | Tipe struktur data sub-model, default `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Definisi item menu, mendukung pembuatan statis atau asynchronous. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Menentukan satu kelas dasar, semua model yang mewarisi kelas ini akan ditampilkan sebagai item menu. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Menentukan beberapa kelas dasar, secara otomatis menampilkan model turunan dalam grup. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Callback setelah sub-model diinisialisasi. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Callback setelah sub-model ditambahkan. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Callback setelah sub-model dihapus. |
| `children` | `React.ReactNode` | Konten tombol, dapat dikustomisasi sebagai teks atau ikon. |
| `keepDropdownOpen` | `boolean` | Apakah dropdown tetap terbuka setelah ditambahkan. Default tertutup secara otomatis. |

## Definisi Tipe SubModelItem

```ts pure
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  hide?: boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| `key` | `string` | Identifier unik. |
| `label` | `string` | Teks tampilan. |
| `type` | `'group' \| 'divider'` | Group atau divider. Jika dihilangkan, ini adalah item biasa atau sub-menu. |
| `disabled` | `boolean` | Apakah item ini dinonaktifkan. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Sembunyikan secara dinamis (return `true` untuk menyembunyikan). |
| `icon` | `React.ReactNode` | Konten ikon. |
| `children` | `SubModelItemsType` | Item sub-menu, digunakan untuk nesting group atau sub-menu. |
| `useModel` | `string` | Menentukan tipe Model yang digunakan (nama terdaftar). |
| `createModelOptions` | `object` | Parameter saat menginisialisasi model. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Bentuk toggle, hapus jika sudah ditambahkan, tambahkan jika belum (hanya satu yang diperbolehkan). |

## Contoh

### Menggunakan `<AddSubModelButton />` untuk Menambahkan subModels

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- Menggunakan `<AddSubModelButton />` untuk menambahkan subModels, tombol harus ditempatkan di dalam suatu FlowModel agar dapat digunakan;
- Menggunakan `model.mapSubModels()` untuk iterasi subModels, metode `mapSubModels` akan menyelesaikan masalah missing, sorting, dan sebagainya;
- Menggunakan `<FlowModelRenderer />` untuk merender subModels.

### Bentuk AddSubModelButton yang Berbeda

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- Anda dapat menggunakan komponen tombol `<Button>Add block</Button>`, dapat ditempatkan di mana saja;
- Atau menggunakan ikon `<PlusOutlined />`;
- Atau menempatkannya di posisi Flow Settings di pojok kanan atas.

### Mendukung Bentuk Toggle

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- Untuk skenario sederhana cukup menggunakan `toggleable: true`, secara default mencari berdasarkan nama kelas, instance dari kelas yang sama hanya diperbolehkan muncul satu kali;
- Aturan pencarian kustom: `toggleable: (model: FlowModel) => boolean`.

### Items Asynchronous

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

Anda dapat memperoleh items dinamis dari context, misalnya:

- Dapat berupa remote `ctx.api.request()`;
- Atau dapat memperoleh data yang diperlukan dari API yang disediakan oleh `ctx.dataSourceManager`;
- Atau dapat berupa properti atau metode context kustom;
- `items` dan `children` keduanya mendukung pemanggilan async.

### Menyembunyikan Item Menu Secara Dinamis (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` mendukung `boolean` atau function (mendukung async); return `true` untuk menyembunyikan;
- Akan berlaku secara recursive untuk group dan children.

### Menggunakan Group, Sub-menu, dan Divider

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- `type: divider` adalah divider;
- `type: group` dengan `children` adalah grup menu;
- Memiliki `children` tetapi tidak memiliki `type` adalah sub-menu.

### Menghasilkan Items Secara Otomatis Melalui Kelas Turunan

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- Semua FlowModel yang mewarisi `subModelBaseClass` akan ditampilkan;
- Metadata terkait dapat didefinisikan melalui `Model.define()`;
- Item dengan `hide: true` akan otomatis disembunyikan.

### Mengimplementasikan Group Melalui Kelas Turunan

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- Semua FlowModel yang mewarisi `subModelBaseClasses` akan ditampilkan;
- Otomatis di-grup berdasarkan `subModelBaseClasses` dan di-deduplikasi.

### Mengimplementasikan Menu Dua Tingkat Melalui Kelas Turunan + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Tentukan bentuk tampilan untuk kelas dasar melalui `Model.define({ menuType: 'submenu' })`;
- Muncul sebagai item tingkat pertama, di-expand menjadi sub-menu tingkat dua; dapat digabungkan dengan grup lain dan disorting berdasarkan `meta.sort`.

### Sub-menu Kustom Melalui `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### Children Group Kustom Melalui `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Mengaktifkan Pencarian dalam Sub-menu

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- Item menu apa pun yang mengandung `children`, asalkan diatur `searchable: true`, akan menampilkan kotak pencarian pada level tersebut;
- Mendukung struktur campuran group dan non-group pada level yang sama, pencarian hanya berlaku untuk level saat ini.
