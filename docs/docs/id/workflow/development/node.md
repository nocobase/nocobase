---
title: "Memperluas Tipe Node"
description: "Memperluas Tipe Node: pengembangan Node kustom, konfigurasi Node, logika eksekusi, API dan siklus hidup."
keywords: "Workflow,memperluas Node,Node kustom,pengembangan Node,NocoBase"
---

# Memperluas Tipe Node

Tipe Node pada dasarnya adalah instruksi operasi. Instruksi yang berbeda mewakili operasi yang berbeda yang dieksekusi dalam alur.

Mirip dengan Trigger, ekstensi tipe Node juga terbagi menjadi dua bagian frontend dan backend. Server perlu mengimplementasikan logika untuk instruksi yang diregistrasi, client perlu menyediakan konfigurasi UI untuk parameter terkait Node tersebut.

## Server

### Instruksi Node Paling Sederhana

Inti dari instruksi adalah sebuah fungsi, yaitu method `run` pada class instruksi yang harus diimplementasikan, digunakan untuk mengeksekusi logika instruksi. Pada fungsi tersebut dapat dieksekusi operasi apa pun yang dibutuhkan, contoh operasi database, operasi file, panggilan API pihak ketiga, dll.

Semua instruksi harus diturunkan dari base class `Instruction`. Instruksi paling sederhana hanya perlu mengimplementasikan satu fungsi `run`:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

Dan registrasikan instruksi tersebut ke plugin Workflow:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

Status (`status`) pada return object dari instruksi adalah field yang wajib diisi, dan harus merupakan value dari konstanta `JOB_STATUS`. Value tersebut akan menentukan arah pemrosesan selanjutnya pada Node tersebut dalam alur. Biasanya cukup menggunakan `JOB_STATUS.RESOVLED`, mewakili Node berhasil dieksekusi sampai selesai dan akan melanjutkan eksekusi Node berikutnya. Jika ada nilai hasil yang perlu disimpan terlebih dahulu, dapat memanggil method `processor.saveJob`, dan return object dari method tersebut. Eksekutor akan menghasilkan record hasil eksekusi berdasarkan object tersebut.

### Result Value Node

Jika ada hasil eksekusi spesifik, terutama menyiapkan data yang dapat digunakan oleh Node berikutnya, dapat dikembalikan melalui properti `result`, dan disimpan dalam object task Node:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

`node.config` di sini adalah konfigurasi Node, dapat berupa value apa pun yang dibutuhkan, akan disimpan sebagai field tipe `JSON` pada record Node yang sesuai di database.

### Penanganan Error pada Instruksi

Jika dalam proses eksekusi mungkin terjadi exception, dapat di-catch terlebih dahulu dan return status gagal:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Jika exception yang dapat diprediksi tidak di-catch, maka engine alur akan otomatis catch dan return status error, untuk menghindari uncaught exception yang dapat menyebabkan crash program.

### Node Async

Saat Node perlu menunggu operasi eksternal selesai sebelum dapat melanjutkan alur (seperti HTTP request, callback pembayaran pihak ketiga, atau operasi yang memakan waktu atau tidak langsung return), task harus disimpan terlebih dahulu sebagai status `JOB_STATUS.PENDING` untuk menggantung eksekusi saat ini, kemudian setelah operasi selesai dipulihkan kembali melalui `resume`. Setiap instruksi yang menggunakan logika menggantung, harus juga mengimplementasikan method `resume`, jika tidak alur tidak akan dapat dipulihkan.

Pola implementasi yang direkomendasikan adalah sebagai berikut:

```ts
import { Instruction, JOB_STATUS, FlowNodeModel, IJob } from '@nocobase/plugin-workflow';

export class AsyncInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor) {
    // 1. Simpan task dengan status menggantung, catat id
    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // 2. Panggil exit() secara aktif, segera flush task ke database dan commit transaction
    await processor.exit();

    // 3. Memulai operasi async (saat ini transaction sudah di-commit, tidak lagi memakai connection database)
    const jobDone: IJob = { status: JOB_STATUS.PENDING };
    try {
      const result = await someAsyncOperation(node.config);
      jobDone.status = JOB_STATUS.RESOLVED;
      jobDone.result = result;
    } catch (error) {
      jobDone.status = JOB_STATUS.FAILED;
      jobDone.result = { message: error.message };
    } finally {
      // 4. Query ulang task dari database, jangan gunakan cached object di memory
      const job = await this.workflow.app.db.getRepository('jobs').findOne({
        filterByTk: id,
      });
      job.set(jobDone);

      // 5. Notifikasi engine workflow untuk memulihkan eksekusi, masuk ke alur resume
      this.workflow.resume(job);
    }
    // 6. Tidak return value apa pun (void), eksekutor akan langsung exit setelah menerima
  }

  async resume(node: FlowNodeModel, job, processor) {
    // job sudah diset status finalnya pada run, langsung return saja
    return job;
  }
}
```

Berikut beberapa detail penting penjelasan:

**Mengapa harus memanggil `processor.exit()` secara aktif daripada return object task yang menggantung?**  
`return { status: PENDING }` akan langsung mengakhiri fungsi `run`, setelah itu tidak dapat lagi mengeksekusi kode apa pun. Memanggil `await processor.exit()` secara aktif hanya commit transaction dan exit context database, fungsi itu sendiri masih lanjut dieksekusi, dengan demikian dapat `await` operasi yang memakan waktu pada body fungsi yang sama, dan setelah selesai memanggil `resume`. Jika tidak memanggil `exit()` terlebih dahulu, melainkan langsung `await` operasi panjang lalu return, di satu sisi akan memegang transaction database dalam waktu lama menyebabkan kontensi lock, di sisi lain transaction tidak ter-commit sebelum operasi selesai, record task tidak akan masuk ke database.

**Mengapa harus query ulang task, bukan langsung gunakan object yang dikembalikan oleh `saveJob`?**  
`saveJob` mengembalikan model instance memory yang terikat pada transaction asli. Setelah `processor.exit()` dipanggil, transaction tersebut sudah di-commit dan ditutup. Memodifikasi instance ini secara langsung dan memanggil `resume` akan menyebabkan anomali state ORM (referensi transaction tidak valid, status tidak konsisten, dll.). Query ulang dari database melalui `id` memastikan mendapatkan instance baru yang bersih, tidak terkait transaction apa pun.

**Mengapa fungsi `run` tidak return value apa pun (`void`)?**  
`processor.exit()` sudah dipanggil secara manual. Setelah eksekutor menerima `void`, akan memanggil `exit(true)` untuk segera exit, tidak melakukan pemrosesan ulang. Jika saat ini return `IJob`, eksekutor akan kembali mencoba untuk save dan commit, menyebabkan error. Untuk detail lihat bagian return value `run`/`resume`.

**Untuk skenario yang membutuhkan callback eksternal** (seperti hasil pembayaran dari notifikasi webhook), juga harus memanggil `processor.exit()` terlebih dahulu sebelum register callback, memastikan record task sudah masuk ke database sebelum sistem eksternal melakukan callback. Pada callback kemudian query ulang task berdasarkan `id` lalu memanggil `this.workflow.resume(job)`.

Contoh lengkap pada project nyata dapat merujuk ke: [RequestInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-request/src/server/RequestInstruction.ts) (Node HTTP Request, menggunakan pola ini pada workflow non-sinkron)

### Status Hasil Node

Status eksekusi Node akan mempengaruhi sukses atau gagalnya keseluruhan alur. Biasanya pada kasus tanpa cabang, kegagalan suatu Node akan langsung menyebabkan keseluruhan alur gagal. Kasus paling umum adalah, jika Node berhasil dieksekusi maka akan melanjutkan ke Node berikutnya pada list Node, sampai tidak ada Node berikutnya, maka eksekusi keseluruhan workflow akan selesai dengan status sukses.

Jika dalam eksekusi suatu Node mengembalikan status eksekusi gagal, maka berdasarkan dua kondisi berikut engine akan memberikan pemrosesan yang berbeda:

1.  Node yang mengembalikan status gagal berada pada alur utama, yaitu tidak berada dalam alur cabang yang dimulai oleh Node upstream mana pun, maka keseluruhan alur utama akan dinilai gagal, dan keluar dari alur.

2.  Node yang mengembalikan status gagal berada dalam suatu alur cabang. Saat ini tanggung jawab untuk menentukan status langkah selanjutnya alur diserahkan ke Node yang memulai cabang. Logika internal Node tersebut yang menentukan status alur selanjutnya, dan secara rekursif diteruskan ke alur utama.

Pada akhirnya pada Node alur utama akan dihasilkan status langkah selanjutnya dari keseluruhan alur. Jika pada Node alur utama yang dikembalikan adalah gagal, maka keseluruhan alur akan berakhir dengan status gagal.

Jika ada Node yang setelah dieksekusi mengembalikan status "stop wait", maka keseluruhan alur eksekusi akan dihentikan sementara dan menggantung, menunggu event yang didefinisikan oleh Node yang sesuai untuk memulihkan eksekusi alur. Misalnya Node manual, setelah eksekusi mencapai Node ini akan berhenti dengan status "stop wait" dari Node tersebut, menunggu intervensi manual pada alur, untuk memutuskan apakah lulus. Jika status input manual adalah lulus, maka melanjutkan Node alur berikutnya, sebaliknya akan diproses sesuai logika kegagalan sebelumnya.

Untuk lebih banyak status return instruksi, dapat merujuk ke bagian Referensi API Workflow.

### Tipe Return Value `run`/`resume` dan Perilaku Eksekutor

Definisi tipe return value lengkap dari method `run` dan `resume` adalah:

```ts
type InstructionResult = IJob | Promise<IJob> | Promise<void> | Promise<null> | null | void;
```

Eksekutor (`Processor`) setelah memanggil instruksi, akan mengeksekusi logika pemrosesan yang berbeda berdasarkan tipe return value, ada tiga kondisi.

#### 1. Mengembalikan Object Task `IJob`

Ini adalah kasus paling umum, mengembalikan sebuah object yang berisi field `status` (wajib) dan optional `result`. Eksekutor akan menyimpannya sebagai record task Node, dan menentukan arah selanjutnya berdasarkan value `status`:

- `JOB_STATUS.RESOLVED`: Node berhasil dieksekusi, jika ada Node downstream maka lanjutkan, jika tidak alur berakhir
- `JOB_STATUS.PENDING`: Node masuk status menggantung, eksekusi context saat ini berhenti, menunggu event eksternal untuk memicu `resume`
- Status gagal lainnya (`FAILED`, `ERROR`, dll.): diteruskan ke atas ke Node parent cabang atau langsung mengakhiri keseluruhan alur

Path ini adalah path commit transaction lengkap—eksekutor akan menyimpan record task, write database dan commit transaction.

Contoh referensi: [ConditionInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts) (langsung mengembalikan object `job` saat tidak ada cabang, untuk kasus ada cabang lihat penjelasan `void` di bawah)

#### 2. Mengembalikan `null`

Saat mengembalikan `null`, eksekutor memanggil `processor.exit()` (tanpa parameter), efeknya adalah: **flush task yang menunggu untuk ditulis ke database dan commit transaction, tetapi tidak meng-update status eksekusi keseluruhan**.

Penggunaan ini biasanya pada method `resume` Node kontrol cabang: suatu cabang sudah selesai, perlu meng-update dan menyimpan status task Node parent (misalnya mencatat "cabang ke-N sudah selesai"), tetapi cabang lain masih berjalan, eksekusi keseluruhan harus tetap dalam status `STARTED` menunggu cabang lainnya—saat ini mengembalikan `null` untuk exit dari context resume saat ini tanpa mempengaruhi status eksekusi keseluruhan.

Contoh referensi: [ParallelInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts)

- Baris [117](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L117): Node paralel sudah selesai lebih awal (resolved/rejected), abaikan resume cabang berikutnya, langsung mengembalikan `null`
- Baris [135](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L135): masih ada cabang yang belum selesai (`PENDING`), setelah menyimpan progress saat ini mengembalikan `null`, melanjutkan menunggu cabang lain

#### 3. Mengembalikan `void` (tidak return, yaitu implicit `undefined`)

Saat mengembalikan `void` (fungsi tidak memiliki statement return eksplisit, atau saat path eksekusi berakhir tidak ada return value), eksekutor memanggil `processor.exit(true)`, efeknya adalah **langsung return, tidak mengeksekusi operasi database apa pun**.

Pola ini khusus untuk skenario di mana **instruksi sudah mengambil alih scheduling eksekusi sendiri**: instruksi memulai sub-alur secara manual melalui `processor.run()`, eksekusi chain sub-alur tersebut akan bertanggung jawab pada penulisan database dan commit transaction saat selesai, eksekutor tidak boleh memprosesnya lagi.

Contoh khas:

- [ConditionInstruction.ts#L67](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts#L67): saat ada cabang, panggil `processor.run(branchNode, savedJob)` secara manual lalu fungsi berakhir, implicit return `void`
- [ParallelInstruction.ts#L108](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L108): iterasi semua cabang dan panggil `processor.run(branch, job)` satu per satu lalu fungsi berakhir, implicit return `void`

:::warn{title=Tips}
Sebelum return `void`, jika `processor.saveJob()` dipanggil, record task tersebut tidak akan ditulis ke database oleh eksekutor saat ini. Mereka di-cache pada list task eksekutor (di memory), akan di-flush ke database secara seragam oleh `exit()` yang di-trigger saat `processor.run()` yang dipanggil manual berikutnya menyelesaikan eksekusinya. Oleh karena itu saat menggunakan pola ini, harus dipastikan ada path eksekusi sub yang akan berakhir normal untuk menyelesaikan persistensi record-record tersebut. Scheduling alur cabang memiliki kompleksitas tertentu, perlu didesain dengan hati-hati dan diuji secara menyeluruh.
:::

Ringkasan perbandingan tiga return value:

| Return Value | Perilaku Eksekutor | Skenario Penggunaan Khas |
|--------|-----------|------------|
| `IJob` | Simpan task, lanjutkan/akhiri/gantung alur berdasarkan `status` | Node eksekusi normal, dengan hasil dan status |
| `null` | Simpan task yang menunggu untuk ditulis dan commit transaction, tidak update status eksekusi | Cabang masih menunggu, exit sementara dari context eksekusi saat ini |
| `void` | Langsung return, tidak melakukan operasi DB apa pun | Node sudah scheduling sub-alur sendiri, biarkan sub-alur mengambil alih pemrosesan selanjutnya |

### Untuk Mengetahui Lebih Banyak

Definisi setiap parameter untuk mendefinisikan tipe Node, lihat bagian Referensi API Workflow.

## Client

Mirip dengan Trigger, form konfigurasi instruksi (tipe Node) perlu diimplementasikan di frontend.

### Instruksi Node Paling Sederhana

Semua instruksi harus diturunkan dari base class `Instruction`, properti dan method yang sesuai digunakan untuk konfigurasi dan penggunaan Node.

Misalnya kita perlu menyediakan UI konfigurasi untuk Node tipe random number string (`randomString`) yang didefinisikan di server di atas. Ada satu opsi konfigurasi `digit` yang mewakili jumlah digit angka random. Pada form konfigurasi kita menggunakan number input untuk menerima input user.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

:::info{title=Tips}
Identifier tipe Node yang diregistrasi di client harus konsisten dengan yang di server, jika tidak akan menyebabkan error.
:::

### Menyediakan Hasil Node Sebagai Variable

Anda dapat memperhatikan method `useVariables` pada contoh di atas. Jika perlu menyediakan hasil Node (bagian `result`) sebagai variable untuk digunakan oleh Node berikutnya, perlu mengimplementasikan method ini pada class instruksi yang di-extend, dan return sebuah object yang sesuai dengan tipe `VariableOption`. Object tersebut sebagai deskripsi struktur dari hasil eksekusi Node, menyediakan mapping nama variable, untuk dipilih dan digunakan pada Node berikutnya.

Definisi tipe `VariableOption` adalah sebagai berikut:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

Inti adalah properti `value`, mewakili value path tersegmen dari nama variable. `label` digunakan untuk ditampilkan pada UI, `children` digunakan untuk mewakili struktur variable multi-level, digunakan saat hasil Node berupa object level dalam.

Sebuah variable yang dapat digunakan pada representasi internal sistem adalah string template path yang dipisahkan dengan `.`, contoh `{{jobsMapByNodeKey.2dw92cdf.abc}}`. `$jobsMapByNodeKey` mewakili result set dari semua Node (sudah didefinisikan secara internal, tidak perlu diproses), `2dw92cdf` adalah `key` Node, `abc` adalah suatu properti kustom pada object hasil Node.

Selain itu, karena hasil Node juga bisa berupa value sederhana, sehingga saat menyediakan variable Node, level pertama **harus** merupakan deskripsi Node itu sendiri:

```ts
{
  value: node.key,
  label: node.title,
}
```

Yaitu level pertama adalah `key` Node dan judul. Misalnya pada Node komputasi, [referensi kode](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77), maka saat menggunakan hasil Node komputasi, opsi pada UI adalah sebagai berikut:

![Hasil Node Komputasi](https://static-docs.nocobase.com/20240514230014.png)

Saat hasil Node berupa object kompleks, dapat menggambarkan properti level dalam melalui `children`. Misalnya sebuah instruksi kustom akan mengembalikan data JSON berikut:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Maka dapat dikembalikan melalui method `useVariables` berikut:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

Dengan demikian pada Node berikutnya dapat menggunakan UI berikut untuk memilih variable di dalamnya:

![Variable Hasil Setelah Mapping](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Tips"}
Saat suatu struktur dalam hasil adalah array object level dalam, dapat juga menggunakan `children` untuk menggambarkan path, tetapi tidak dapat menyertakan index array. Karena pada penanganan variable workflow NocoBase, untuk deskripsi path variable terhadap array object, saat digunakan akan otomatis di-flatten menjadi array dari value level dalam, dan tidak dapat mengakses value ke-N melalui index.
:::

### Apakah Node Tersedia

Secara default, Node mana pun dapat ditambahkan ke dalam workflow. Namun pada beberapa kondisi, Node tidak cocok pada beberapa tipe workflow tertentu atau di dalam cabang. Saat itu dapat dikonfigurasi ketersediaan Node melalui `isAvailable`:

```ts
// definisi tipe
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // instance plugin workflow
  engine: WorkflowPlugin;
  // instance workflow
  workflow: object;
  // Node upstream
  upstream: object;
  // apakah Node cabang (nomor cabang)
  branchIndex: number;
};
```

Method `isAvailable` mengembalikan `true` berarti Node tersedia, `false` berarti tidak tersedia. Parameter `ctx` berisi informasi konteks Node saat ini, dapat dievaluasi apakah Node tersedia berdasarkan informasi tersebut.

Pada kasus tanpa kebutuhan khusus, tidak perlu mengimplementasikan method `isAvailable`, Node secara default tersedia. Kasus paling umum yang perlu dikonfigurasi, adalah Node mungkin merupakan operasi yang sangat memakan waktu, tidak cocok untuk dieksekusi pada alur sinkron, dapat dibatasi penggunaan Node melalui method `isAvailable`. Contoh:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Untuk Mengetahui Lebih Banyak

Definisi setiap parameter untuk mendefinisikan tipe Node, lihat bagian Referensi API Workflow.
