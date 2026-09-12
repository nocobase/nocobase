---
title: "Referensi API"
description: "Referensi API ekstensi Workflow: Workflow Model, konteks eksekusi Node, API Trigger, passing variabel."
keywords: "Workflow,Referensi API,Workflow Model,konteks Node,API Trigger,NocoBase"
---

# Referensi API

## Server

API yang tersedia pada struktur paket server seperti yang ditunjukkan kode berikut:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Kelas plugin Workflow.

Biasanya saat runtime aplikasi, di tempat mana pun yang dapat memperoleh instance aplikasi `app`, panggil `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` untuk mendapatkan instance plugin Workflow (di bawah ini disebut `plugin`).

#### `registerTrigger()`

Memperluas pendaftaran tipe Trigger baru.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parameter**

| Parameter | Tipe                        | Deskripsi              |
| --------- | --------------------------- | ---------------------- |
| `type`    | `string`                    | Identifier tipe Trigger |
| `trigger` | `typeof Trigger \| Trigger` | Tipe atau instance Trigger |

**Contoh**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Memperluas pendaftaran tipe Node baru.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parameter**

| Parameter     | Tipe                                | Deskripsi              |
| ------------- | ----------------------------------- | ---------------------- |
| `type`        | `string`                            | Identifier tipe instruksi |
| `instruction` | `typeof Instruction \| Instruction` | Tipe atau instance instruksi |

**Contoh**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Memicu Workflow tertentu. Terutama digunakan dalam Trigger kustom, ketika event kustom tertentu didengarkan, memicu Workflow yang sesuai.

**Signature**

`trigger(workflow: Workflow, context: any)`

**Parameter**
| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Objek Workflow yang akan dipicu |
| `context` | `object` | Data konteks yang disediakan saat pemicuan |

:::info{title=Catatan}
`context` saat ini wajib, jika tidak disediakan, Workflow tersebut tidak akan dipicu.
:::

**Contoh**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Memulihkan eksekusi Workflow yang dijeda dengan tugas Node tertentu.

- Hanya Workflow dalam status jeda (`EXECUTION_STATUS.STARTED`) yang dapat dipulihkan eksekusinya.
- Hanya tugas Node dalam status jeda (`JOB_STATUS.PENDING`) yang dapat dipulihkan eksekusinya.

**Signature**

`resume(job: JobModel)`

**Parameter**

| Parameter | Tipe       | Deskripsi              |
| --------- | ---------- | ---------------------- |
| `job`     | `JobModel` | Objek tugas yang sudah diperbarui |

:::info{title=Catatan}
Objek tugas yang diteruskan biasanya adalah objek yang sudah diperbarui, dan biasanya `status` akan diperbarui ke nilai non-`JOB_STATUS.PENDING`, jika tidak akan terus dijeda.
:::

**Contoh**

Lihat detailnya di [source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Kelas dasar Trigger, digunakan untuk memperluas tipe Trigger kustom.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Parameter      | Tipe                                                        | Penjelasan                |
| -------------- | ----------------------------------------------------------- | ------------------------- |
| `constructor`  | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor               |
| `on?`          | `(workflow: WorkflowModel): void`                           | Event handling setelah Workflow diaktifkan |
| `off?`         | `(workflow: WorkflowModel): void`                           | Event handling setelah Workflow dinonaktifkan |

`on`/`off` digunakan untuk pendaftaran/pencabutan listener event saat Workflow diaktifkan/dinonaktifkan, parameter yang diteruskan adalah instance Workflow dari Trigger yang sesuai, dapat ditangani sesuai konfigurasi yang sesuai. Beberapa tipe Trigger jika sudah men-listen event secara global, juga tidak perlu mengimplementasikan kedua method ini. Misalnya pada Trigger terjadwal, Anda dapat mendaftarkan timer di `on`, dan mencabut timer di `off`.

### `Instruction`

Kelas dasar tipe instruksi, digunakan untuk memperluas tipe instruksi kustom.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| Parameter      | Tipe                                                            | Penjelasan                          |
| -------------- | --------------------------------------------------------------- | ----------------------------------- |
| `constructor`  | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor                         |
| `run`          | `Runner`                                                        | Logika eksekusi saat pertama kali masuk Node |
| `resume?`      | `Runner`                                                        | Logika eksekusi setelah masuk Node setelah dipulihkan dari interupsi |
| `getScope?`    | `(node: FlowNodeModel, data: any, processor: Processor): any`  | Menyediakan konten variabel lokal cabang yang dihasilkan Node yang sesuai |

**Tipe Terkait**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

`getScope` dapat dirujuk pada [implementasi Node loop](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), digunakan untuk menyediakan konten variabel lokal cabang.

### `EXECUTION_STATUS`

Tabel konstanta status rencana eksekusi Workflow, digunakan untuk mengidentifikasi status saat ini dari rencana eksekusi yang sesuai.

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

| Nama Konstanta                  | Arti                  |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING`     | Dalam antrian        |
| `EXECUTION_STATUS.STARTED`      | Sedang dieksekusi    |
| `EXECUTION_STATUS.RESOLVED`     | Berhasil selesai     |
| `EXECUTION_STATUS.FAILED`       | Gagal                |
| `EXECUTION_STATUS.ERROR`        | Eksekusi error       |
| `EXECUTION_STATUS.ABORTED`      | Diinterupsi          |
| `EXECUTION_STATUS.CANCELED`     | Dibatalkan           |
| `EXECUTION_STATUS.REJECTED`     | Ditolak              |
| `EXECUTION_STATUS.RETRY_NEEDED` | Tidak berhasil dieksekusi, perlu coba ulang |

Selain tiga yang pertama, lainnya merepresentasikan status gagal, tetapi dapat digunakan untuk mengekspresikan alasan kegagalan yang berbeda.

### `JOB_STATUS`

Tabel konstanta status tugas Node Workflow, digunakan untuk mengidentifikasi status saat ini dari tugas Node yang sesuai. Status yang dihasilkan Node juga akan memengaruhi status seluruh rencana eksekusi.

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| Nama Konstanta            | Arti                                                |
| ------------------------- | --------------------------------------------------- |
| `JOB_STATUS.PENDING`      | Jeda: sudah dieksekusi sampai Node ini, tetapi instruksi meminta jeda menunggu |
| `JOB_STATUS.RESOLVED`     | Berhasil selesai                                    |
| `JOB_STATUS.FAILED`       | Gagal: eksekusi Node ini tidak dapat memenuhi kondisi konfigurasi |
| `JOB_STATUS.ERROR`        | Error: terjadi error yang tidak tertangkap selama eksekusi Node ini |
| `JOB_STATUS.ABORTED`      | Penghentian: Node ini dihentikan eksekusinya oleh logika lain setelah dijeda |
| `JOB_STATUS.CANCELED`     | Dibatalkan: Node ini dibatalkan eksekusinya secara manual setelah dijeda |
| `JOB_STATUS.REJECTED`     | Ditolak: Node ini ditolak untuk dilanjutkan secara manual setelah dijeda |
| `JOB_STATUS.RETRY_NEEDED` | Tidak berhasil dieksekusi, perlu coba ulang        |

## Client

API yang tersedia pada struktur paket client seperti yang ditunjukkan kode berikut:

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Kelas plugin Workflow client. Biasanya diperoleh melalui `this.app.pm.get('workflow')`.

#### `registerTrigger()`

Mendaftarkan panel konfigurasi yang sesuai dengan tipe Trigger.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameter**

| Parameter | Tipe                        | Penjelasan                                  |
| --------- | --------------------------- | ------------------------------------------- |
| `type`    | `string`                    | Identifier tipe Trigger, konsisten dengan identifier yang didaftarkan di server |
| `trigger` | `typeof Trigger \| Trigger` | Tipe atau instance Trigger                  |

#### `registerInstruction()`

Mendaftarkan panel konfigurasi yang sesuai dengan tipe Node.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameter**

| Parameter     | Tipe                                | Penjelasan                                |
| ------------- | ----------------------------------- | ----------------------------------------- |
| `type`        | `string`                            | Identifier tipe Node, konsisten dengan identifier yang didaftarkan di server |
| `instruction` | `typeof Instruction \| Instruction` | Tipe atau instance Node                   |

#### `registerInstructionGroup()`

Mendaftarkan grup tipe Node. NocoBase secara default menyediakan 4 grup tipe Node:

* `'control'`: Kontrol
* `'collection'`: Operasi tabel data
* `'manual'`: Penanganan manual
* `'extended'`: Ekstensi lainnya

Jika perlu memperluas grup lain, Anda dapat menggunakan method ini untuk mendaftarkan.

**Signature**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameter**

| Parameter | Tipe                | Penjelasan                                          |
| --------- | ------------------- | --------------------------------------------------- |
| `type`    | `string`            | Identifier grup Node |
| `group`   | `{ label: string }` | Informasi grup, saat ini hanya mengandung judul     |

**Contoh**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Menentukan apakah sebuah Workflow dalam mode sinkron.

**Signature**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

Kelas dasar Trigger, digunakan untuk memperluas tipe Trigger kustom.

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `title` | `string` | Nama tipe Trigger |
| `description?` | `string` | Deskripsi tipe Trigger |
| `PresetFieldsetLoader?` | `LoaderOf` | Form konfigurasi preset saat pembuatan (lazy-loaded) |
| `FieldsetLoader?` | `LoaderOf` | Form konfigurasi Trigger lengkap (lazy-loaded) |
| `TriggerFieldsetLoader?` | `LoaderOf` | Form input untuk eksekusi manual (lazy-loaded) |
| `validate` | `(config: Record<string, unknown>) => boolean` | Validasi konfigurasi; mengembalikan `true` jika konfigurasi valid |
| `createDefaultConfig?` | `() => Record<string, unknown>` | Menyediakan nilai konfigurasi default |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | Opsi variable untuk data konteks Trigger |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | Item menu untuk membuat sub-model di kanvas |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | Menyediakan sumber data asosiasi sementara |

**Tipe Terkait**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- Jika `useVariables` tidak diatur, artinya tipe Trigger ini tidak menyediakan fungsi pengambilan nilai, dan data konteks Trigger tidak dapat dipilih di Node workflow.

### `Instruction`

Kelas dasar instruksi, digunakan untuk memperluas tipe Node kustom.

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `title` | `string` | Nama tipe Node |
| `type` | `string` | Identifier tipe Node |
| `group` | `string` | Identifier grup tipe Node, opsi: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | Deskripsi tipe Node |
| `icon?` | `JSX.Element` | Ikon Node |
| `FieldsetLoader?` | `LoaderOf` | Form drawer konfigurasi Node (lazy-loaded) |
| `PresetFieldsetLoader?` | `LoaderOf` | Form konfigurasi preset saat pembuatan (lazy-loaded) |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | Rendering Node kustom pada kanvas (lazy-loaded), digunakan untuk Node cabang dan kasus lain yang membutuhkan rendering khusus |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | Mendeklarasikan apakah Node adalah Node cabang |
| `end?` | `boolean \| ((node) => boolean)` | Mendeklarasikan apakah Node adalah Node terminal |
| `testable?` | `boolean` | Mendeklarasikan apakah Node mendukung uji coba |
| `createDefaultConfig?` | `() => object` | Menyediakan nilai konfigurasi default |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | Method Node menyediakan opsi variable |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | Method Node menyediakan opsi variable lokal cabang |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Method untuk menentukan apakah Node tersedia |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | Item menu untuk membuat sub-model di kanvas |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | Menyediakan sumber data asosiasi sementara |

**Tipe Terkait**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Jika `useVariables` tidak diatur, artinya tipe Node ini tidak menyediakan fungsi pengambilan nilai, dan data hasil tipe Node ini tidak dapat dipilih di Node workflow. Jika nilai hasil tunggal (tidak dapat dipilih), maka cukup mengembalikan konten statis yang dapat mengekspresikan informasi yang sesuai (lihat: [source code Node komputasi](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). Jika perlu dapat dipilih (seperti suatu properti dalam Object), Anda dapat menyesuaikan output komponen pemilihan yang sesuai (lihat: [source code Node query data](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` adalah komponen rendering kustom Node. Saat rendering Node default tidak mencukupi, dapat sepenuhnya di-override untuk rendering tampilan Node kustom. Misalnya untuk menyediakan rendering cabang tambahan pada Node tipe cabang (lihat: [source code Node kondisi](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` terutama digunakan untuk menentukan apakah Node dapat digunakan (ditambahkan) di lingkungan saat ini. Lingkungan saat ini termasuk instance plugin Workflow, Workflow saat ini, Node upstream, dan indeks cabang saat ini.

### Komponen Input Variable

Plugin Workflow menyediakan sekumpulan komponen input variable untuk memungkinkan pengguna memilih variable workflow di form konfigurasi Node/Trigger.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Input variable yang mendukung pemilihan variable dan melanjutkan mengetik konten. Cocok untuk skenario input satu baris yang membutuhkan campuran referensi variable dan teks bebas.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `value?` | `string` | Nilai path variable, contoh `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | Callback perubahan nilai |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opsi filter variable (filter tipe, kedalaman, dll.) |
| `disabled?` | `boolean` | Apakah dinonaktifkan |
| `placeholder?` | `string` | Teks placeholder |

#### `WorkflowVariableTextArea`

Area teks multi-baris yang mendukung penyisipan referensi variable di posisi kursor mana pun. Cocok untuk skenario teks bebas seperti HTTP Body, teks template, dll.

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `value?` | `string` | Nilai teks (mungkin berisi referensi variable) |
| `onChange?` | `(value: string) => void` | Callback perubahan nilai |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opsi filter variable |
| `delimiters?` | `readonly [string, string]` | Delimiter variable, default `['{{', '}}']` |

Mewarisi Props lain dari antd `TextArea` (seperti `autoSize`, `placeholder`, dll.).

#### `WorkflowTypedVariableInput`

Input bertipe yang beralih antara mode "konstanta" dan "referensi variable". Dalam mode variable, hanya dapat memilih variable; tidak dapat melanjutkan mengetik setelah pemilihan. Dalam mode konstanta, lima tipe didukung: `string`, `number`, `boolean`, `date`, dan `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opsi filter variable |

Mewarisi Props lain dari `TypedVariableInput` (tidak termasuk `extraNodes`, `metaTree`, `namespaces` yang digunakan secara internal).

#### `WorkflowVariableWrapper`

Wrapper generik untuk mengganti komponen input berbeda dalam konteks berbeda. Misalnya saat field yang sama memerlukan metode input berbeda di konfigurasi Node Trigger dan drawer konfigurasi Node, Anda dapat menggunakan komponen ini untuk membungkus input native menjadi input yang dapat beralih ke mode variable.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | Nilai saat ini (nilai konstanta atau string path variable) |
| `onChange?` | `(value: TValue \| string \| null) => void` | Callback perubahan nilai |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opsi filter variable |
| `render` | `(props: { value?, onChange? }) => ReactNode` | Merender komponen input native |
| `clearValue?` | `TValue \| null` | Nilai awal saat beralih dari mode variable kembali ke mode konstanta, default `null` |

### Komponen Terkait Collection

Plugin Workflow juga menyediakan sekumpulan komponen helper terkait collection:

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — Pemilih collection yang aware terhadap data source (cascader)
- `AppendsSelect` — Pemilih preloading field asosiasi (tree select)
- `FieldsSelect` — Pemilih multi field collection
- `SortFieldsInput` — Input field pengurutan
- `PaginationFields` — Item form parameter paginasi
