---
title: "Resource API"
description: "Referensi API Resource FlowEngine NocoBase: signature method lengkap, format parameter, sintaks filter dari MultiRecordResource dan SingleRecordResource."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

FlowEngine NocoBase menyediakan dua class Resource untuk menangani operasi data frontend—`MultiRecordResource` untuk list/tabel (banyak record), `SingleRecordResource` untuk form/detail (satu record). Mereka membungkus pemanggilan REST API, menyediakan manajemen data yang reaktif.

Rantai inheritance: `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Digunakan untuk skenario list, tabel, kanban dengan banyak record. Diimport dari `@nocobase/flow-engine`.

### Operasi Data

| Method | Parameter | Penjelasan |
|------|------|------|
| `getData()` | - | Mengembalikan `TDataItem[]`, nilai awal `[]` |
| `hasData()` | - | Apakah array data tidak kosong |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Membuat record, secara default akan refresh otomatis setelah dibuat |
| `get(filterByTk)` | `filterByTk: string \| number` | Mengambil satu record berdasarkan primary key |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Memperbarui record, otomatis refresh setelah selesai |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Menghapus record, mendukung batch |
| `destroySelectedRows()` | - | Menghapus semua baris yang dipilih |
| `refresh()` | - | Memuat ulang data (memanggil action `list`), pemanggilan berulang dalam event loop yang sama akan digabungkan |

### Pagination

| Method | Penjelasan |
|------|------|
| `getPage()` | Mendapatkan nomor halaman saat ini |
| `setPage(page)` | Mengatur nomor halaman |
| `getPageSize()` | Mendapatkan jumlah record per halaman (default 20) |
| `setPageSize(pageSize)` | Mengatur jumlah record per halaman |
| `getCount()` | Mendapatkan total jumlah record |
| `getTotalPage()` | Mendapatkan total halaman |
| `next()` | Halaman berikutnya dan refresh |
| `previous()` | Halaman sebelumnya dan refresh |
| `goto(page)` | Lompat ke halaman tertentu dan refresh |

### Baris Terpilih

| Method | Penjelasan |
|------|------|
| `setSelectedRows(rows)` | Mengatur baris terpilih |
| `getSelectedRows()` | Mendapatkan baris terpilih |

### Contoh: Penggunaan dalam CollectionBlockModel

Saat extends `CollectionBlockModel`, perlu membuat resource melalui `createResource()`, lalu membaca data di `renderComponent()`:

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Mendeklarasikan menggunakan MultiRecordResource untuk mengelola data
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // Total record

    return (
      <div>
        <h3>Total {count} record (Halaman {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

Untuk contoh lengkap lihat [FlowEngine → Ekstensi Blok](../../plugin-development/client/flow-engine/block.md).

### Contoh: Memanggil CRUD dalam Tombol Action

Di handler `registerFlow` dari `ActionModel`, dapatkan resource blok saat ini melalui `ctx.blockModel?.resource`, lalu panggil method CRUD:

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Mendapatkan resource blok saat ini
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Membuat record, setelah pembuatan resource akan otomatis refresh
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Untuk contoh lengkap lihat [Membuat plugin manajemen data full-stack](../../plugin-development/client/examples/fullstack-plugin.md).

### Contoh: Cheat Sheet Operasi CRUD

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Membuat ---
  await resource.create({ title: 'New item', completed: false });
  // Tidak refresh otomatis
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Membaca ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // Total record
  const item = await resource.get(1);   // Mengambil satu record berdasarkan primary key

  // --- Memperbarui ---
  await resource.update(1, { title: 'Updated' });

  // --- Menghapus ---
  await resource.destroy(1);            // Hapus satu
  await resource.destroy([1, 2, 3]);    // Hapus batch

  // --- Pagination ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // Atau gunakan method shortcut
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Refresh ---
  await resource.refresh();
}
```

## SingleRecordResource

Digunakan untuk skenario form, halaman detail dengan satu record. Diimport dari `@nocobase/flow-engine`.

### Operasi Data

| Method | Parameter | Penjelasan |
|------|------|------|
| `getData()` | - | Mengembalikan `TData` (objek tunggal), nilai awal `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Smart save—saat `isNewRecord` true memanggil create, jika tidak memanggil update |
| `destroy(options?)` | - | Menghapus record saat ini (menggunakan filterByTk yang sudah diatur) |
| `refresh()` | - | Memuat ulang data (memanggil action `get`), saat `isNewRecord` true akan dilewati |

### Properti Kunci

| Properti | Penjelasan |
|------|------|
| `isNewRecord` | Menandai apakah record baru. `setFilterByTk()` akan otomatis mengaturnya menjadi `false` |

### Contoh: Skenario Form Detail

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // Objek tunggal atau null
    if (!data) return <div>Memuat...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Contoh: Membuat dan Mengedit Record

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Membuat record baru ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save secara internal memanggil action create, otomatis refresh setelah selesai

  // --- Mengedit record yang ada ---
  resource.setFilterByTk(1);  // Otomatis mengatur isNewRecord = false
  await resource.refresh();   // Muat data saat ini terlebih dahulu
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save secara internal memanggil action update

  // --- Menghapus record saat ini ---
  await resource.destroy();   // Menggunakan filterByTk yang sudah diatur
}
```

## Method Umum

Method-method berikut tersedia di kedua `MultiRecordResource` dan `SingleRecordResource`:

### Filter

| Method | Penjelasan |
|------|------|
| `setFilter(filter)` | Mengatur objek filter secara langsung |
| `addFilterGroup(key, filter)` | Menambahkan filter group bernama (direkomendasikan, dapat digabungkan dan dihapus) |
| `removeFilterGroup(key)` | Menghapus filter group bernama |
| `getFilter()` | Mendapatkan filter yang sudah diagregasi, beberapa group otomatis digabungkan dengan `$and` |

### Kontrol Field

| Method | Penjelasan |
|------|------|
| `setFields(fields)` | Mengatur field yang dikembalikan |
| `setAppends(appends)` | Mengatur appends untuk field asosiasi |
| `addAppends(appends)` | Menambahkan appends (dengan deduplikasi) |
| `setSort(sort)` | Mengatur sorting, contoh `['-createdAt', 'name']` |
| `setFilterByTk(value)` | Mengatur filter berdasarkan primary key |

### Konfigurasi Resource

| Method | Penjelasan |
|------|------|
| `setResourceName(name)` | Mengatur nama resource, contoh `'users'` atau resource asosiasi `'users.tags'` |
| `setSourceId(id)` | Mengatur ID record parent dari resource asosiasi |
| `setDataSourceKey(key)` | Mengatur data source (menambahkan header request `X-Data-Source`) |

### Metadata dan Status

| Method | Penjelasan |
|------|------|
| `getMeta(key?)` | Mendapatkan metadata, jika tidak memasukkan key akan mengembalikan seluruh objek meta |
| `loading` | Apakah sedang loading (getter) |
| `getError()` | Mendapatkan informasi error |
| `clearError()` | Menghapus error |

### Event

| Event | Waktu Trigger |
|------|----------|
| `'refresh'` | Setelah `refresh()` berhasil mendapatkan data |
| `'saved'` | Setelah operasi `create` / `update` / `save` berhasil |

```ts
resource.on('saved', (data) => {
  console.log('Record telah disimpan:', data);
});
```

## Sintaks Filter

NocoBase menggunakan sintaks filter gaya JSON, operator dimulai dengan `$`:

```ts
// Sama dengan
{ status: { $eq: 'active' } }

// Tidak sama dengan
{ status: { $ne: 'deleted' } }

// Lebih besar dari
{ age: { $gt: 18 } }

// Berisi (fuzzy matching)
{ name: { $includes: 'test' } }

// Kondisi gabungan
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// Kondisi or
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

Pada Resource, direkomendasikan menggunakan `addFilterGroup` untuk mengelola kondisi filter:

```ts
// Menambahkan beberapa filter group
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() otomatis mengagregasi menjadi: { $and: [...] }

// Menghapus filter group tertentu
resource.removeFilterGroup('status');

// Refresh menerapkan filter
await resource.refresh();
```

## Perbandingan MultiRecordResource dan SingleRecordResource

| Fitur | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| Return getData() | `TDataItem[]` (array) | `TData` (objek tunggal) |
| Action refresh default | `list` | `get` |
| Pagination | Mendukung | Tidak mendukung |
| Baris terpilih | Mendukung | Tidak mendukung |
| Membuat | `create(data)` | `save(data)` + `isNewRecord=true` |
| Memperbarui | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Menghapus | `destroy(filterByTk)` | `destroy()` |
| Skenario tipikal | List, tabel, kanban | Form, halaman detail |

## Tautan Terkait

- [Membuat plugin manajemen data full-stack](../../plugin-development/client/examples/fullstack-plugin.md) — Contoh lengkap: penggunaan aktual `resource.create()` dalam tombol action kustom
- [FlowEngine → Ekstensi Blok](../../plugin-development/client/flow-engine/block.md) — Penggunaan `createResource()` dan `resource.getData()` di CollectionBlockModel
- [ResourceManager Manajemen Resource (Server)](../../plugin-development/server/resource-manager.md) — Definisi resource REST API server, yang dipanggil oleh Resource client
- [API FlowContext](./flow-context.md) — Penjelasan method seperti `ctx.makeResource()`, `ctx.initResource()`
