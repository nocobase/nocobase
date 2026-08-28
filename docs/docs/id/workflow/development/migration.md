---
title: "Panduan Migrasi v1 ke v2"
description: "Pengembangan ekstensi Workflow: panduan migrasi kode client dari v1 ke v2."
keywords: "Workflow,migrasi,v1,v2,NocoBase"
---

# Panduan Migrasi Client v1 ke v2

Panduan ini menjelaskan cara memigrasikan kode client plugin ekstensi workflow dari v1 ke v2. Perubahan inti pada client v2 adalah mengganti UI konfigurasi deklaratif Formily Schema dengan pendekatan Loader + komponen React/antd murni.

## Ikhtisar

### Perubahan Utama

1. **Perubahan path import**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, base class plugin `@nocobase/client` → `@nocobase/client-v2`
2. **Perubahan pola UI konfigurasi**: Dari objek Formily Schema (`fieldset`) ke komponen React lazy-loaded melalui Loader (`FieldsetLoader`)
3. **Properti `scope`/`components` dihapus**: Tidak lagi perlu meng-inject objek scope atau komponen ke dalam Schema; cukup import dan gunakan langsung di komponen React

### Mapping Path Import

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## Aturan Umum

### Pola Loader

v2 menggunakan properti bertipe `LoaderOf` untuk menggantikan `fieldset` dan objek Formily Schema lainnya di v1. Loader pada dasarnya adalah fungsi yang mengembalikan `Promise<{ default: ComponentType }>`, memungkinkan code splitting dan lazy loading melalui `import()` dinamis:

```ts
// v1: Formily Schema object
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader pointing to a React component
FieldsetLoader = () => import('./MyConfig');
```

Jika perlu menunjuk ke named export (bukan default export), gunakan `.then()` untuk me-remap:

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Sintaks Komponen Konfigurasi

Komponen yang di-load oleh Loader adalah komponen fungsi React standar yang menggunakan `Form.Item` dari antd untuk membangun form. Path field secara konsisten menggunakan format array bersarang `['config', 'fieldName']`:

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React component
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## Migrasi Trigger

### Tabel Mapping Properti

| Properti v1 | Properti v2 | Keterangan |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Form konfigurasi Trigger |
| `presetFieldset` | `PresetFieldsetLoader` | Form preset saat pembuatan |
| `triggerFieldset` | `TriggerFieldsetLoader` | Form input untuk eksekusi manual |
| `scope` | Dihapus | Tidak lagi dibutuhkan; import langsung di komponen |
| `components` | Dihapus | Tidak lagi dibutuhkan; import langsung di komponen |
| `view` | Dihapus | |
| — | `validate(config)` | Baru; validasi konfigurasi |
| — | `createDefaultConfig()` | Baru; menyediakan nilai konfigurasi default |

### Contoh Migrasi

**Sintaks v1:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**Sintaks v2:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

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

### Registrasi Plugin

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## Migrasi Node

### Tabel Mapping Properti

| Properti v1 | Properti v2 | Keterangan |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Form drawer konfigurasi Node |
| `presetFieldset` | `PresetFieldsetLoader` | Form preset saat pembuatan |
| `Component` | `ComponentLoader` | Rendering Node kustom pada kanvas |
| `scope` | Dihapus | Tidak lagi dibutuhkan; import langsung di komponen |
| `components` | Dihapus | Tidak lagi dibutuhkan; import langsung di komponen |
| `view` | Dihapus | |
| — | `createDefaultConfig()` | Baru; menyediakan nilai konfigurasi default |

### Contoh Migrasi

**Sintaks v1:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**Sintaks v2:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## Catatan Lainnya

### Bagian yang Tidak Berubah

Properti dan method berikut pada dasarnya memiliki signature yang sama di v1 dan v2, dan dapat dipertahankan apa adanya saat migrasi:

- `useVariables(node/config, options)` — Menyediakan opsi variable
- `useScopeVariables(node, options)` — Menyediakan variable lokal cabang
- `isAvailable(ctx)` — Pemeriksaan ketersediaan Node (v2 `NodeAvailableContext` menambahkan properti `engine` baru)

### Properti Baru di v2

- `getCreateModelMenuItem` — Mendefinisikan konfigurasi untuk membuat item menu sub-model untuk Node/Trigger di kanvas v2
- `useTempAssociationSource` — Menyediakan informasi sumber data asosiasi sementara
- `validate(config)` — Validasi konfigurasi Trigger (khusus Trigger)
- `branching` — Mendeklarasikan apakah Node adalah Node cabang (khusus Node)
- `end` — Mendeklarasikan apakah Node adalah Node terminal (khusus Node)
- `testable` — Mendeklarasikan apakah Node mendukung uji coba (khusus Node)

### Konsistensi Semantik Nilai

Saat migrasi, pastikan nilai form yang dihasilkan komponen v2 konsisten dengan v1, terutama bentuk payload saat eksekusi manual. Misalnya, jika form eksekusi manual v1 menyimpan objek record lengkap, versi v2 harus mempertahankan struktur nilai yang sama daripada hanya menyimpan primary key.
