---
title: "Membuat Plugin Manajemen Data Frontend-Backend Terintegrasi"
description: "Praktik plugin NocoBase: Server mendefinisikan tabel data + Client menampilkan data dengan TableBlockModel + Field dan Action kustom, plugin frontend-backend yang lengkap."
keywords: "Frontend-Backend Terintegrasi,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Membuat Plugin Manajemen Data Frontend-Backend Terintegrasi

Contoh-contoh sebelumnya entah pure client (Block, Field, Action) atau client + interface sederhana (halaman pengaturan). Contoh ini menunjukkan skenario yang lebih lengkap — server mendefinisikan tabel data, client mewarisi `TableBlockModel` untuk mendapatkan kapabilitas tabel lengkap, ditambah Component Field kustom dan tombol Action kustom, membentuk plugin manajemen data dengan operasi CRUD.

Contoh ini menggabungkan Block, Field, Action yang sudah dipelajari sebelumnya, menampilkan alur pengembangan plugin yang lengkap.

:::tip Bacaan Pendahuluan

Disarankan memahami konten berikut terlebih dahulu agar pengembangan lebih lancar:

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Pembuatan plugin dan struktur direktori
- [Plugin](../plugin) — Entry point Plugin dan lifecycle `load()`
- [FlowEngine → Ekstensi Block](../flow-engine/block) — BlockModel, CollectionBlockModel, TableBlockModel
- [FlowEngine → Ekstensi Field](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Ekstensi Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan `tExpr()`
- [Ikhtisar Pengembangan Server](../../server) — Dasar plugin server

:::

## Hasil Akhir

Yang akan kita buat adalah plugin manajemen data "Todo Items", mencakup kapabilitas berikut:

- Server mendefinisikan tabel data `todoItems`, plugin akan secara otomatis menulis data contoh saat instalasi
- Client mewarisi `TableBlockModel`, Block tabel siap pakai (kolom Field, paginasi, action bar, dll.)
- Component Field kustom — merender Field priority dengan Tag berwarna
- Tombol Action kustom — tombol "New Todo", klik untuk membuka dialog mengisi form dan membuat record

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

Source code lengkap lihat [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). Jika Anda ingin langsung menjalankannya secara lokal untuk melihat hasilnya:

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

Berikutnya, mari kita bangun plugin ini dari nol, langkah demi langkah.

## Langkah 1: Membuat Skeleton Plugin

Eksekusi di direktori root repository:

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

Untuk penjelasan detail lihat [Menulis Plugin Pertama Anda](../../write-your-first-plugin).

## Langkah 2: Mendefinisikan Tabel Data (Server)

Buat `src/server/collections/todoItems.ts`. NocoBase akan secara otomatis memuat definisi collection di direktori ini:

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

Berbeda dengan contoh halaman pengaturan, di sini tidak perlu mendaftarkan resource secara manual — NocoBase akan secara otomatis menghasilkan interface CRUD standar (`list`, `get`, `create`, `update`, `destroy`) untuk setiap collection.

## Langkah 3: Mengonfigurasi Hak Akses dan Data Contoh (Server)

Edit `src/server/plugin.ts`, konfigurasikan hak akses ACL di `load()`, dan masukkan data contoh di `install()`:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // User yang sudah login dapat melakukan CRUD pada todoItems
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // Saat plugin pertama kali diinstal, masukkan beberapa data contoh
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

Beberapa poin penting:

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` membuka hak akses CRUD penuh, `'loggedIn'` artinya user yang sudah login dapat mengaksesnya
- **`install()`** — Hanya dieksekusi saat plugin pertama kali diinstal, cocok untuk menulis data awal
- **`this.db.getRepository()`** — Mendapatkan object operasi data berdasarkan nama collection
- Tidak perlu `resourceManager.define()` — NocoBase akan secara otomatis menghasilkan interface CRUD untuk collection

## Langkah 4: Membuat Model Block (Client)

Buat `src/client-v2/models/TodoBlockModel.tsx`. Mewarisi `TableBlockModel` dapat langsung mendapatkan kapabilitas Block tabel lengkap — kolom Field, action bar, paginasi, sorting, dll., tidak perlu menulis `renderComponent` sendiri.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Tips

Dalam pengembangan plugin yang sebenarnya, jika tidak perlu kustomisasi `TableBlockModel`, sebenarnya Anda dapat tidak mewarisi dan mendaftarkan Block ini, langsung biarkan user memilih "Tabel" saat menambahkan Block. Artikel ini membuat `TodoBlockModel` yang mewarisi `TableBlockModel` hanya untuk mendemonstrasikan alur definisi dan registrasi model Block. `TableBlockModel` akan menangani semua hal lainnya (kolom Field, action bar, paginasi, dll.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // Membatasi hanya berlaku untuk collection todoItems
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Membatasi Block ini hanya berlaku untuk collection `todoItems` melalui `filterCollection` — saat user menambahkan "Todo block", hanya `todoItems` yang akan muncul di daftar pemilihan collection, tidak akan muncul collection lain yang tidak terkait.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Langkah 5: Membuat Component Field Kustom (Client)

Buat `src/client-v2/models/PriorityFieldModel.tsx`. Merender Field priority dengan Tag berwarna jauh lebih intuitif daripada teks biasa:

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// Mengikat ke interface Field tipe input (single-line text)
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

Setelah didaftarkan, di konfigurasi kolom priority pada tabel, di dropdown menu "Component Field" Anda dapat berpindah ke "Priority tag".

## Langkah 6: Membuat Tombol Action Kustom (Client)

Buat `src/client-v2/models/NewTodoActionModel.tsx`. Setelah klik tombol "New Todo", buka dialog dengan `ctx.viewer.dialog()`, isi form lalu buat record:

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// Mengelola state loading dengan observable, menggantikan useState
const formState = observable({
  loading: false,
});

// Component form di dalam dialog, dibungkus dengan observer untuk merespons perubahan observable
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
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
  on: 'click', // Mendengarkan event klik tombol
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // Menggunakan ctx.viewer.dialog untuk membuka dialog
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
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

Beberapa poin penting:

- **`ActionSceneEnum.collection`** — Tombol muncul di action bar atas Block
- **`on: 'click'`** — Mendengarkan event `click` tombol melalui `registerFlow`
- **`ctx.viewer.dialog()`** — Kapabilitas dialog built-in NocoBase, `content` menerima sebuah function, parameter `view` dapat memanggil `view.close()` untuk menutup dialog
- **`resource.create(values)`** — Memanggil interface create collection untuk membuat record, setelah dibuat tabel akan otomatis refresh
- **`observable` + `observer`** — Menggunakan manajemen state reaktif dari flow-engine sebagai pengganti `useState`, Component akan otomatis merespons perubahan `formState.loading`

## Langkah 7: Menambahkan File Multibahasa

Edit file terjemahan di `src/locale/` plugin:

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning Perhatian

Pertama kali menambahkan file bahasa perlu restart aplikasi agar berlaku.

:::

Untuk cara penulisan file terjemahan dan penggunaan `tExpr()` lebih lanjut, lihat [i18n Internasionalisasi](../component/i18n).

## Langkah 8: Mendaftarkan di Plugin (Client)

Edit `src/client-v2/plugin.tsx`. Perlu melakukan dua hal: mendaftarkan model, dan mendaftarkan `todoItems` ke data source client.

:::warning Perhatian

Mendaftarkan tabel data secara manual melalui `addCollection` di code plugin adalah **praktik yang jarang dilakukan**, di sini hanya untuk mendemonstrasikan alur frontend-backend lengkap. Dalam proyek nyata, tabel data biasanya dibuat dan dikonfigurasi oleh user di antarmuka NocoBase, atau dikelola melalui API / MCP, dll., dan tidak perlu didaftarkan secara eksplisit di code client plugin.

:::

Tabel yang didefinisikan melalui `defineCollection` adalah tabel internal server, secara default tidak akan muncul di daftar pemilihan collection Block. Setelah didaftarkan secara manual melalui `addCollection`, user dapat memilih `todoItems` saat menambahkan Block.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey harus diatur, jika tidak collection tidak akan muncul di daftar pemilihan collection Block
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // Mendaftarkan model Block, Field, Action
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Register todoItems to the client-side data source.
    // Must listen to 'dataSource:loaded' event because ensureLoaded() runs after load(),
    // and it calls setCollections() which clears all collections before re-setting from server.
    // Re-register in the event callback to ensure addCollection survives reload.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

Beberapa poin penting:

- **`registerModelLoaders`** — Mendaftarkan tiga model dengan lazy loading: Block, Field, Action
- **`this.app.eventBus`** — Event bus level aplikasi, digunakan untuk mendengarkan event lifecycle
- **Event `dataSource:loaded`** — Dipicu setelah data source selesai dimuat. Harus memanggil `addCollection` di callback event ini, karena `ensureLoaded()` berjalan setelah `load()`, dan akan menghapus semua collection terlebih dahulu sebelum mengatur ulang — memanggil `addCollection` langsung di `load()` akan ditimpa
- **`addCollection()`** — Mendaftarkan collection ke data source client. Field perlu memiliki properti `interface` dan `uiSchema`, sehingga NocoBase tahu cara merendernya
- **`filterTargetKey: 'id'`** — Harus diatur, menentukan Field yang digunakan untuk identifier unik record (biasanya primary key). Jika tidak diatur, collection tidak akan muncul di daftar pemilihan collection Block
- `defineCollection` di server bertanggung jawab membuat tabel fisik dan ORM mapping, `addCollection` di client bertanggung jawab memberi tahu UI tentang keberadaan tabel ini — keduanya bekerja sama untuk menyelesaikan integrasi frontend-backend

## Langkah 9: Mengaktifkan Plugin

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

Setelah diaktifkan:

1. Buat halaman baru, klik "Tambah Block", pilih "Todo block", ikat ke collection `todoItems`
2. Tabel akan secara otomatis memuat data, menampilkan kolom Field, paginasi, dll.
3. Di "Konfigurasi Action" tambahkan tombol "New todo", klik untuk membuka dialog mengisi form dan membuat record
4. Di "Component Field" pada kolom priority pindah ke "Priority tag", priority akan ditampilkan dengan Tag berwarna

<!-- Perlu screenshot fungsi lengkap setelah diaktifkan -->

## Source Code Lengkap

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — Contoh lengkap plugin manajemen data frontend-backend terintegrasi

## Ringkasan

Kapabilitas yang digunakan dalam contoh ini:

| Kapabilitas             | Penggunaan                                            | Dokumentasi                                                    |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Definisi Tabel Data       | `defineCollection()`                            | [Server → Collections](../../server/collections) |
| Kontrol Hak Akses         | `acl.allow()`                                   | [Server → ACL](../../server/acl)               |
| Data Awal         | `install()` + `repo.createMany()`               | [Server → Plugin](../../server/plugin)             |
| Block Tabel         | `TableBlockModel`                               | [FlowEngine → Ekstensi Block](../flow-engine/block)           |
| Registrasi Tabel Data Client | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin](../plugin)                                |
| Field Kustom       | `ClickableFieldModel` + `bindModelToInterface`  | [FlowEngine → Ekstensi Field](../flow-engine/field)           |
| Action Kustom       | `ActionModel` + `registerFlow({ on: 'click' })` | [FlowEngine → Ekstensi Action](../flow-engine/action)          |
| Dialog             | `ctx.viewer.dialog()`                           | [Context → Kapabilitas Umum](../ctx/common-capabilities)        |
| State Reaktif       | `observable` + `observer`                       | [Pengembangan Component](../component/index.md)             |
| Registrasi Model         | `this.flowEngine.registerModelLoaders()`        | [Plugin](../plugin)                                |
| Terjemahan Tertunda         | `tExpr()`                                       | [i18n Internasionalisasi](../component/i18n)                        |

## Tautan Terkait

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Membuat skeleton plugin dari nol
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel dan registerFlow
- [FlowEngine → Ekstensi Block](../flow-engine/block) — BlockModel, TableBlockModel
- [FlowEngine → Ekstensi Field](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Ekstensi Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Membuat Block Tampilan Kustom](./custom-block) — Contoh dasar BlockModel
- [Membuat Component Field Kustom](./custom-field) — Contoh dasar FieldModel
- [Membuat Tombol Action Kustom](./custom-action) — Contoh dasar ActionModel
- [Ikhtisar Pengembangan Server](../../server) — Dasar plugin server
- [Server → Collections](../../server/collections) — defineCollection dan addCollection
- [Cheat Sheet Resource API](../../../api/flow-engine/resource.md) — Signature method lengkap MultiRecordResource / SingleRecordResource
- [Plugin](../plugin) — Entry point Plugin dan lifecycle load()
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan tExpr
- [Server → ACL](../../server/acl) — Konfigurasi hak akses
- [Server → Plugin](../../server/plugin) — Lifecycle plugin server
- [Context → Kapabilitas Umum](../ctx/common-capabilities) — ctx.viewer, ctx.message, dll.
- [Pengembangan Component](../component/index.md) — Penggunaan Antd Form dan Component lainnya
- [Dokumentasi FlowEngine Lengkap](../../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
