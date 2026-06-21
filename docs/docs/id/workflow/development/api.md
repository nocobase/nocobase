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

:::info{title=Tips}
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

:::info{title=Tips}
Objek tugas yang diteruskan biasanya adalah objek yang sudah diperbarui, dan biasanya `status` akan diperbarui ke nilai non-`JOB_STATUS.PENDING`, jika tidak akan terus dijeda.
:::

**Contoh**

Lihat detailnya di [source code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Kelas dasar Trigger, digunakan untuk memperluas tipe Trigger kustom.

| Parameter      | Tipe                                                        | Penjelasan                |
| -------------- | ----------------------------------------------------------- | ------------------------- |
| `constructor`  | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor               |
| `on?`          | `(workflow: WorkflowModel): void`                           | Event handling setelah Workflow diaktifkan |
| `off?`         | `(workflow: WorkflowModel): void`                           | Event handling setelah Workflow dinonaktifkan |

`on`/`off` digunakan untuk pendaftaran/pencabutan listener event saat Workflow diaktifkan/dinonaktifkan, parameter yang diteruskan adalah instance Workflow dari Trigger yang sesuai, dapat ditangani sesuai konfigurasi yang sesuai. Beberapa tipe Trigger jika sudah men-listen event secara global, juga tidak perlu mengimplementasikan kedua method ini. Misalnya pada Trigger terjadwal, Anda dapat mendaftarkan timer di `on`, dan mencabut timer di `off`.

### `Instruction`

Kelas dasar tipe instruksi, digunakan untuk memperluas tipe instruksi kustom.

| Parameter      | Tipe                                                            | Penjelasan                          |
| -------------- | --------------------------------------------------------------- | ----------------------------------- |
| `constructor`  | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor                         |
| `run`          | `Runner`                                                        | Logika eksekusi saat pertama kali masuk Node |
| `resume?`      | `Runner`                                                        | Logika eksekusi setelah masuk Node setelah dipulihkan dari interupsi |
| `getScope?`    | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Menyediakan konten variabel lokal cabang yang dihasilkan Node yang sesuai |

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
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Mendaftarkan panel konfigurasi yang sesuai dengan tipe Trigger.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameter**

| Parameter | Tipe                        | Penjelasan                                  |
| --------- | --------------------------- | ------------------------------------------- |
| `type`    | `string`                    | Identifier tipe Trigger, konsisten dengan identifier yang digunakan saat pendaftaran |
| `trigger` | `typeof Trigger \| Trigger` | Tipe atau instance Trigger                  |

#### `registerInstruction()`

Mendaftarkan panel konfigurasi yang sesuai dengan tipe Node.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameter**

| Parameter     | Tipe                                | Penjelasan                                |
| ------------- | ----------------------------------- | ----------------------------------------- |
| `type`        | `string`                            | Identifier tipe Node, konsisten dengan identifier yang digunakan saat pendaftaran |
| `instruction` | `typeof Instruction \| Instruction` | Tipe atau instance Node                   |

#### `registerInstructionGroup()`

Mendaftarkan grup tipe Node. NocoBase secara default menyediakan 4 grup tipe Node:

* `'control'`: Kelas kontrol
* `'collection'`: Kelas operasi tabel data
* `'manual'`: Kelas penanganan manual
* `'extended'`: Kelas ekstensi lainnya

Jika perlu memperluas grup lain, Anda dapat menggunakan method ini untuk mendaftarkan.

**Signature**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameter**

| Parameter | Tipe                | Penjelasan                                          |
| --------- | ------------------- | --------------------------------------------------- |
| `type`    | `string`            | Identifier grup Node, konsisten dengan identifier yang digunakan saat pendaftaran |
| `group`   | `{ label: string }` | Informasi grup, saat ini hanya mengandung judul     |

**Contoh**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Kelas dasar Trigger, digunakan untuk memperluas tipe Trigger kustom.

| Parameter        | Tipe                                                             | Penjelasan                                  |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| `title`          | `string`                                                         | Nama tipe Trigger                           |
| `fieldset`       | `{ [key: string]: ISchema }`                                     | Koleksi item konfigurasi Trigger            |
| `scope?`         | `{ [key: string]: any }`                                         | Koleksi objek yang mungkin digunakan dalam Schema item konfigurasi |
| `components?`    | `{ [key: string]: React.FC }`                                    | Koleksi komponen yang mungkin digunakan dalam Schema item konfigurasi |
| `useVariables?`  | `(config: any, options: UseVariableOptions ) => VariableOptions` | Pengambil nilai data konteks Trigger        |

- `useVariables` jika tidak diatur, artinya tipe Trigger ini tidak menyediakan fungsi pengambilan nilai, di Node alur tidak dapat memilih data konteks Trigger.

### `Instruction`

Kelas dasar instruksi, digunakan untuk memperluas tipe Node kustom.

| Parameter             | Tipe                                                    | Penjelasan                                                                       |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `group`               | `string`                                                | Identifier grup tipe Node, saat ini opsional: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`            | `Record<string, ISchema>`                               | Koleksi item konfigurasi Node                                                    |
| `scope?`              | `Record<string, Function>`                              | Koleksi objek yang mungkin digunakan dalam Schema item konfigurasi               |
| `components?`         | `Record<string, React.FC>`                              | Koleksi komponen yang mungkin digunakan dalam Schema item konfigurasi            |
| `Component?`          | `React.FC`                                              | Komponen rendering kustom Node                                                   |
| `useVariables?`       | `(node, options: UseVariableOptions) => VariableOption` | Method Node menyediakan opsi variabel Node                                       |
| `useScopeVariables?`  | `(node, options?) => VariableOptions`                   | Method Node menyediakan opsi variabel lokal cabang                               |
| `useInitializers?`    | `(node) => SchemaInitializerItemType`                   | Method Node menyediakan opsi initializer                                         |
| `isAvailable?`        | `(ctx: NodeAvailableContext) => boolean`                | Method untuk menentukan apakah Node tersedia                                     |

**Tipe Terkait**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- `useVariables` jika tidak diatur, artinya tipe Node ini tidak menyediakan fungsi pengambilan nilai, di Node alur tidak dapat memilih data hasil tipe Node ini. Jika nilai hasil tunggal (tidak dapat dipilih), maka cukup mengembalikan konten statis yang dapat mengekspresikan informasi yang sesuai (referensi: [source code Node komputasi](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Jika perlu dapat dipilih (seperti suatu properti dalam Object), Anda dapat menyesuaikan output komponen pemilihan yang sesuai (referensi: [source code Node Tambah Data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` komponen rendering kustom Node, dapat sepenuhnya mengganti rendering default Node ketika tidak terpenuhi, untuk melakukan rendering tampilan Node kustom. Misalnya untuk Node awal tipe cabang yang perlu menyediakan tombol operasi atau interaksi tambahan, perlu menggunakan method ini (referensi: [source code cabang paralel](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` digunakan untuk menyediakan method inisialisasi Block, misalnya pada Node manual dapat menginisialisasi Block pengguna terkait berdasarkan Node hulu. Jika method ini disediakan, akan tersedia saat menginisialisasi Block dalam konfigurasi antarmuka Node manual (referensi: [source code Node Tambah Data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` terutama digunakan untuk menentukan apakah Node dapat digunakan (ditambahkan) di lingkungan saat ini. Lingkungan saat ini termasuk Workflow saat ini, Node hulu, dan indeks cabang saat ini, dll.
