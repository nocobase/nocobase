---
title: "Memperluas Tipe Trigger"
description: "Memperluas tipe Trigger: pengembangan Trigger kustom, antarmuka konfigurasi, logika pemicuan, referensi API."
keywords: "Workflow,memperluas Trigger,Trigger kustom,pengembangan Trigger,NocoBase"
---

# Memperluas Tipe Trigger

Setiap Workflow harus mengonfigurasi Trigger tertentu sebagai pintu masuk untuk memulai eksekusi alur.

Tipe Trigger biasanya merepresentasikan event lingkungan sistem tertentu. Selama siklus runtime aplikasi, setiap titik yang menyediakan event yang dapat di-subscribe dapat digunakan untuk mendefinisikan tipe Trigger. Misalnya menerima request, operasi tabel data, tugas terjadwal, dll.

Tipe Trigger didaftarkan pada tabel Trigger plugin berdasarkan identifier string. Plugin Workflow memiliki beberapa Trigger bawaan:

- `'collection'`: Trigger operasi tabel data;
- `'schedule'`: Trigger tugas terjadwal;
- `'action'`: Trigger event setelah action;


Tipe Trigger yang diperluas perlu memastikan identifier unik. Implementasi subscribe/unsubscribe Trigger didaftarkan di server, dan implementasi antarmuka konfigurasi didaftarkan di client.

## Server

Setiap Trigger perlu di-extend dari kelas dasar `Trigger`, dan mengimplementasikan method `on`/`off`, masing-masing untuk subscribe dan unsubscribe event lingkungan tertentu. Pada method `on`, perlu memanggil `this.workflow.trigger()` di dalam fungsi callback event tertentu untuk akhirnya memicu event. Pada method `off`, perlu melakukan pekerjaan pembersihan unsubscribe terkait.

`this.workflow` adalah instance plugin Workflow yang diteruskan dalam konstruktor kelas dasar `Trigger`.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

Kemudian pada plugin yang memperluas Workflow, daftarkan instance Trigger ke engine Workflow:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

Setelah server di-load saat startup, Trigger dengan tipe `'interval'` dapat ditambahkan dan dieksekusi.

## Client

Bagian client terutama menyediakan antarmuka konfigurasi sesuai item konfigurasi yang dibutuhkan tipe Trigger. Setiap tipe Trigger juga perlu mendaftarkan konfigurasi tipe yang sesuai ke plugin Workflow.

Antarmuka konfigurasi Trigger didefinisikan melalui Loader (fungsi lazy-loading), yang menunjuk ke komponen React biasa yang membangun form menggunakan `Form.Item` dari antd.

### Trigger Paling Sederhana

Misalnya untuk Trigger timer interval yang dijelaskan di atas, definisikan item konfigurasi waktu interval (`interval`) yang dibutuhkan dalam form antarmuka konfigurasi:

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // Trigger config form (lazy-loaded component)
  FieldsetLoader = () => import('./IntervalConfig');

  // Config validation
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

Di sini, `FieldsetLoader` adalah fungsi yang mengembalikan `Promise<{ default: ComponentType }>`, mengimplementasikan lazy loading melalui `import()` dinamis. Komponen yang ditunjuknya adalah komponen fungsi React standar:

```tsx
// IntervalConfig.tsx
import { Form, InputNumber } from 'antd';

export default function IntervalConfig() {
  return (
    <Form.Item
      name={['config', 'interval']}
      label="Interval"
      initialValue={60000}
      rules={[{ required: true }]}
    >
      <InputNumber min={1000} />
    </Form.Item>
  );
}
```

Perhatikan bahwa `name` pada field form menggunakan format array bersarang `['config', 'fieldName']`, yang merupakan konvensi standar antd Form.

### Beberapa Antarmuka Konfigurasi

Sebuah Trigger dapat menyediakan beberapa antarmuka konfigurasi untuk skenario yang berbeda:

- `PresetFieldsetLoader` — Form preset saat membuat Workflow (biasanya hanya berisi field wajib)
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — Form konfigurasi Trigger lengkap (ditampilkan di drawer konfigurasi)
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — Form input untuk eksekusi manual
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Saat Loader perlu menunjuk ke named export (bukan default export) dalam sebuah file, gunakan `.then()` untuk me-remap:

```ts
class MyTrigger extends Trigger {
  title = 'My trigger';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }

  createDefaultConfig() {
    return { mode: 1 };
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

// Preset form for creation (named export)
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// Full config form (default export)
export default function MyTriggerConfig() {
  return (
    <>
      <Form.Item name={['config', 'collection']} label="Collection">
        <CollectionCascader disabled />
      </Form.Item>
      <Form.Item name={['config', 'mode']} label="Mode">
        <Select
          options={[
            { label: 'Created', value: 1 },
            { label: 'Updated', value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}
```

### Mendaftarkan Trigger

Daftarkan tipe Trigger ke instance plugin Workflow di dalam plugin yang diperluas:

```ts
import { Plugin } from '@nocobase/client-v2';
import MyTrigger from './MyTrigger';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Setelah itu, tipe Trigger baru akan terlihat di antarmuka konfigurasi Workflow.

:::info{title=Catatan}
Identifier tipe Trigger yang didaftarkan di client harus konsisten dengan yang ada di server, jika tidak akan menyebabkan error.
:::

Untuk contoh lengkap pada proyek nyata, lihat: [source code CollectionTrigger](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

Untuk detail lain tentang pendefinisian tipe Trigger, lihat bagian [Referensi API Workflow](./api).

:::info{title=Catatan}
Jika sebelumnya Anda menggunakan kode client versi lama (v1) dan ingin bermigrasi ke versi v2 yang baru, lihat [Panduan Migrasi v1 ke v2](./migration).
:::
