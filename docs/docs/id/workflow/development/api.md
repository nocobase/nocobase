:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Referensi API

## Sisi Server

API yang tersedia dalam struktur paket sisi server ditunjukkan pada kode berikut:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Kelas **plugin** **alur kerja**.

Biasanya, selama runtime aplikasi, Anda dapat memanggil `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` di mana pun Anda bisa mendapatkan instans aplikasi `app` untuk memperoleh instans **plugin** **alur kerja** (selanjutnya disebut sebagai `plugin`).

#### `registerTrigger()`

Memperluas dan mendaftarkan tipe **trigger** baru.

**Tanda Tangan**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parameter**

| Parameter | Tipe | Deskripsi |
| --------- | --------------------------- | ---------------- |
| `type` | `string` | Pengidentifikasi tipe **trigger** |
| `trigger` | `typeof Trigger \| Trigger` | Tipe atau instans **trigger** |

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

Memperluas dan mendaftarkan tipe node baru.

**Tanda Tangan**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parameter**

| Parameter | Tipe | Deskripsi |
| ------------- | ----------------------------------- | -------------- |
| `type` | `string` | Pengidentifikasi tipe instruksi |
| `instruction` | `typeof Instruction \| Instruction` | Tipe atau instans instruksi |

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

Memicu **alur kerja** tertentu. Terutama digunakan dalam **trigger** kustom untuk memicu **alur kerja** yang sesuai ketika suatu event kustom tertentu didengarkan.

**Tanda Tangan**

`trigger(workflow: Workflow, context: any)`

**Parameter**
| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Objek **alur kerja** yang akan dipicu |
| `context` | `object` | Data konteks yang disediakan saat pemicuan |

:::info{title=Tips}
`context` saat ini adalah item yang wajib diisi. Jika tidak disediakan, **alur kerja** tidak akan terpicu.
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

Melanjutkan eksekusi **alur kerja** yang tertunda dengan tugas node tertentu.

- Hanya **alur kerja** yang berada dalam status tertunda (`EXECUTION_STATUS.STARTED`) yang dapat dilanjutkan eksekusinya.
- Hanya tugas node yang berada dalam status tertunda (`JOB_STATUS.PENDING`) yang dapat dilanjutkan eksekusinya.

**Tanda Tangan**

`resume(job: JobModel)`

**Parameter**

| Parameter | Tipe | Deskripsi |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | Objek tugas yang diperbarui |

:::info{title=Tips}
Objek tugas yang diteruskan umumnya adalah objek yang telah diperbarui, dan `status`-nya biasanya diperbarui ke nilai selain `JOB_STATUS.PENDING`, jika tidak, ia akan terus tertunda.
:::

**Contoh**

Lihat [kode sumber](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) untuk detailnya.

### `Trigger`

Kelas dasar untuk **trigger**, digunakan untuk memperluas tipe **trigger** kustom.

| Parameter | Tipe | Penjelasan |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor |
| `on?` | `(workflow: WorkflowModel): void` | Penanganan event setelah mengaktifkan **alur kerja** |
| `off?` | `(workflow: WorkflowModel): void` | Penanganan event setelah menonaktifkan **alur kerja** |

`on`/`off` digunakan untuk mendaftarkan/membatalkan pendaftaran pendengar event saat **alur kerja** diaktifkan/dinonaktifkan. Parameter yang diteruskan adalah instans **alur kerja** yang sesuai dengan **trigger**, yang dapat diproses sesuai konfigurasi. Beberapa tipe **trigger** yang sudah memiliki event yang didengarkan secara global mungkin tidak perlu mengimplementasikan kedua metode ini. Misalnya, dalam **trigger** terjadwal, Anda dapat mendaftarkan timer di `on` dan membatalkan pendaftarannya di `off`.

### `Instruction`

Kelas dasar untuk instruksi, digunakan untuk memperluas tipe node kustom.

| Parameter | Tipe | Penjelasan |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor |
| `run` | `Runner` | Logika eksekusi untuk entri pertama ke node |
| `resume?` | `Runner` | Logika eksekusi untuk masuk ke node setelah melanjutkan dari interupsi |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | Menyediakan konten variabel lokal untuk cabang yang dihasilkan oleh node yang sesuai |

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

Untuk `getScope`, Anda dapat merujuk pada [implementasi node loop](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), yang digunakan untuk menyediakan konten variabel lokal untuk cabang.

### `EXECUTION_STATUS`

Tabel konstanta untuk status rencana eksekusi **alur kerja**, digunakan untuk mengidentifikasi status terkini dari rencana eksekusi yang sesuai.

| Nama Konstanta | Arti |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING` | Dalam Antrean |
| `EXECUTION_STATUS.STARTED` | Sedang Berjalan |
| `EXECUTION_STATUS.RESOLVED` | Selesai Berhasil |
| `EXECUTION_STATUS.FAILED` | Gagal |
| `EXECUTION_STATUS.ERROR` | Kesalahan |
| `EXECUTION_STATUS.ABORTED` | Dihentikan |
| `EXECUTION_STATUS.CANCELED` | Dibatalkan |
| `EXECUTION_STATUS.REJECTED` | Ditolak |
| `EXECUTION_STATUS.RETRY_NEEDED` | Tidak berhasil dieksekusi, perlu dicoba lagi |

Selain tiga yang pertama, semua status lainnya menunjukkan kegagalan, namun dapat digunakan untuk menjelaskan berbagai alasan kegagalan.

### `JOB_STATUS`

Tabel konstanta untuk status tugas node **alur kerja**, digunakan untuk mengidentifikasi status terkini dari tugas node yang sesuai. Status yang dihasilkan oleh node juga akan memengaruhi status seluruh rencana eksekusi.

| Nama Konstanta | Arti |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | Tertunda: Eksekusi telah mencapai node ini, tetapi instruksi mengharuskan penangguhan dan menunggu |
| `JOB_STATUS.RESOLVED`     | Selesai Berhasil |
| `JOB_STATUS.FAILED`       | Gagal: Eksekusi node ini tidak memenuhi kondisi yang dikonfigurasi |
| `JOB_STATUS.ERROR`        | Kesalahan: Terjadi kesalahan yang tidak tertangani selama eksekusi node ini |
| `JOB_STATUS.ABORTED`      | Dihentikan: Eksekusi node ini dihentikan oleh logika lain setelah berada dalam status tertunda |
| `JOB_STATUS.CANCELED`     | Dibatalkan: Eksekusi node ini dibatalkan secara manual setelah berada dalam status tertunda |
| `JOB_STATUS.REJECTED`     | Ditolak: Kelanjutan node ini ditolak secara manual setelah berada dalam status tertunda |
| `JOB_STATUS.RETRY_NEEDED` | Tidak berhasil dieksekusi, perlu dicoba lagi |

## Sisi Klien

API yang tersedia dalam struktur paket sisi klien ditunjukkan pada kode berikut:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Mendaftarkan panel konfigurasi yang sesuai untuk tipe **trigger**.

**Tanda Tangan**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameter**

| Parameter | Tipe | Penjelasan |
| --------- | --------------------------- | ------------------------------------ |
| `type` | `string` | Pengidentifikasi tipe **trigger**, konsisten dengan pengidentifikasi yang digunakan untuk pendaftaran |
| `trigger` | `typeof Trigger \| Trigger` | Tipe atau instans **trigger** |

#### `registerInstruction()`

Mendaftarkan panel konfigurasi yang sesuai untuk tipe node.

**Tanda Tangan**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameter**

| Parameter | Tipe | Penjelasan |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type` | `string` | Pengidentifikasi tipe node, konsisten dengan pengidentifikasi yang digunakan untuk pendaftaran |
| `instruction` | `typeof Instruction \| Instruction` | Tipe atau instans node |

#### `registerInstructionGroup()`

Mendaftarkan grup tipe node. NocoBase menyediakan 4 grup tipe node default:

* `'control'`: Kontrol
* `'collection'`: Operasi **koleksi**
* `'manual'`: Pemrosesan manual
* `'extended'`: Ekstensi lainnya

Jika Anda perlu memperluas grup lain, Anda dapat menggunakan metode ini untuk mendaftarkannya.

**Tanda Tangan**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameter**

| Parameter | Tipe | Penjelasan |
| --------- | ----------------- | ----------------------------- |
| `type` | `string` | Pengidentifikasi grup node, konsisten dengan pengidentifikasi yang digunakan untuk pendaftaran |
| `group` | `{ label: string }` | Informasi grup, saat ini hanya mencakup judul |

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

Kelas dasar untuk **trigger**, digunakan untuk memperluas tipe **trigger** kustom.

| Parameter | Tipe | Penjelasan |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title` | `string` | Nama tipe **trigger** |
| `fieldset` | `{ [key: string]: ISchema }` | Kumpulan item konfigurasi **trigger** |
| `scope?` | `{ [key: string]: any }` | Kumpulan objek yang mungkin digunakan dalam Schema item konfigurasi |
| `components?` | `{ [key: string]: React.FC }` | Kumpulan komponen yang mungkin digunakan dalam Schema item konfigurasi |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Akses nilai untuk data konteks **trigger** |

- Jika `useVariables` tidak diatur, itu berarti tipe **trigger** ini tidak menyediakan fungsi pengambilan nilai, dan data konteks **trigger** tidak dapat dipilih di node **alur kerja**.

### `Instruction`

Kelas dasar untuk instruksi, digunakan untuk memperluas tipe node kustom.

| Parameter | Tipe | Penjelasan |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group` | `string` | Pengidentifikasi grup tipe node, opsi saat ini: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset` | `Record<string, ISchema>` | Kumpulan item konfigurasi node |
| `scope?` | `Record<string, Function>` | Kumpulan objek yang mungkin digunakan dalam Schema item konfigurasi |
| `components?` | `Record<string, React.FC>` | Kumpulan komponen yang mungkin digunakan dalam Schema item konfigurasi |
| `Component?` | `React.FC` | Komponen rendering kustom untuk node |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | Metode untuk node menyediakan opsi variabel node |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | Metode untuk node menyediakan opsi variabel lokal cabang |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | Metode untuk node menyediakan opsi inisialisasi |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Metode untuk menentukan apakah node tersedia |

**Tipe Terkait**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Jika `useVariables` tidak diatur, itu berarti tipe node ini tidak menyediakan fungsi pengambilan nilai, dan data hasil dari tipe node ini tidak dapat dipilih di node **alur kerja**. Jika nilai hasilnya tunggal (tidak dapat dipilih), Anda dapat mengembalikan konten statis yang menyatakan informasi yang sesuai (lihat: [kode sumber node perhitungan](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Jika perlu dapat dipilih (misalnya, properti dari suatu Objek), Anda dapat menyesuaikan output komponen pilihan yang sesuai (lihat: [kode sumber node buat data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` adalah komponen rendering kustom untuk node. Ketika rendering node default tidak memadai, komponen ini dapat sepenuhnya diganti untuk rendering tampilan node kustom. Misalnya, jika Anda perlu menyediakan lebih banyak tombol tindakan atau interaksi lain untuk node awal tipe cabang, Anda akan menggunakan metode ini (lihat: [kode sumber cabang paralel](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` digunakan untuk menyediakan metode inisialisasi blok. Misalnya, dalam node manual, Anda dapat menginisialisasi blok pengguna terkait berdasarkan node hulu. Jika metode ini disediakan, ia akan tersedia saat menginisialisasi blok dalam konfigurasi antarmuka node manual (lihat: [kode sumber node buat data](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` terutama digunakan untuk menentukan apakah sebuah node dapat digunakan (ditambahkan) di lingkungan saat ini. Lingkungan saat ini mencakup **alur kerja** saat ini, node hulu, dan indeks cabang saat ini.