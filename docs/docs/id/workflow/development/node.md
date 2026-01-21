:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Tipe Node

Tipe node pada dasarnya adalah instruksi operasional. Instruksi yang berbeda merepresentasikan operasi yang berbeda yang dijalankan dalam alur kerja.

Mirip dengan pemicu, memperluas tipe node juga dibagi menjadi dua bagian: sisi server dan sisi klien. Sisi server perlu mengimplementasikan logika untuk instruksi yang terdaftar, sementara sisi klien perlu menyediakan konfigurasi antarmuka untuk parameter node tempat instruksi berada.

## Sisi Server

### Instruksi Node Paling Sederhana

Inti dari sebuah instruksi adalah sebuah fungsi, yang berarti metode `run` dalam kelas instruksi harus diimplementasikan untuk menjalankan logika instruksi. Operasi apa pun yang diperlukan dapat dilakukan di dalam fungsi, seperti operasi basis data, operasi file, memanggil API pihak ketiga, dan sebagainya.

Semua instruksi perlu diturunkan dari kelas dasar `Instruction`. Instruksi paling sederhana hanya perlu mengimplementasikan fungsi `run`:

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

Dan daftarkan instruksi ini ke plugin alur kerja:

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

Nilai status (`status`) dalam objek kembalian instruksi adalah wajib dan harus berupa nilai dari konstanta `JOB_STATUS`. Nilai ini akan menentukan alur pemrosesan selanjutnya untuk node ini dalam alur kerja. Biasanya, `JOB_STATUS.RESOVLED` digunakan, yang menunjukkan bahwa node telah berhasil dieksekusi dan eksekusi akan berlanjut ke node berikutnya. Jika ada nilai hasil yang perlu disimpan terlebih dahulu, Anda juga dapat memanggil metode `processor.saveJob` dan mengembalikan objek kembaliannya. Eksekutor akan menghasilkan catatan hasil eksekusi berdasarkan objek ini.

### Nilai Hasil Node

Jika ada hasil eksekusi tertentu, terutama data yang disiapkan untuk digunakan oleh node selanjutnya, data tersebut dapat dikembalikan melalui properti `result` dan disimpan dalam objek tugas node:

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

Di sini, `node.config` adalah item konfigurasi node, yang bisa berupa nilai apa pun yang diperlukan. Ini akan disimpan sebagai bidang tipe `JSON` dalam catatan node yang sesuai di basis data.

### Penanganan Kesalahan Instruksi

Jika pengecualian mungkin terjadi selama eksekusi, Anda dapat menangkapnya terlebih dahulu dan mengembalikan status gagal:

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

Jika pengecualian yang dapat diprediksi tidak ditangkap, mesin alur kerja akan secara otomatis menangkapnya dan mengembalikan status kesalahan untuk mencegah pengecualian yang tidak tertangkap menyebabkan program macet.

### Node Asinkron

Ketika kontrol alur atau operasi I/O asinkron (memakan waktu) diperlukan, metode `run` dapat mengembalikan objek dengan `status` `JOB_STATUS.PENDING`, yang meminta eksekutor untuk menunggu (menangguhkan) hingga beberapa operasi asinkron eksternal selesai, dan kemudian memberi tahu mesin alur kerja untuk melanjutkan eksekusi. Jika nilai status tertunda dikembalikan dalam fungsi `run`, instruksi harus mengimplementasikan metode `resume`; jika tidak, eksekusi alur kerja tidak dapat dilanjutkan:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Di sini, `paymentService` mengacu pada layanan pembayaran. Dalam _callback_ layanan, alur kerja dipicu untuk melanjutkan eksekusi tugas yang sesuai, dan proses saat ini keluar terlebih dahulu. Kemudian, mesin alur kerja membuat prosesor baru dan meneruskannya ke metode `resume` node untuk melanjutkan eksekusi node yang sebelumnya ditangguhkan.

:::info{title=Catatan}
"Operasi asinkron" yang disebutkan di sini tidak mengacu pada fungsi `async` dalam JavaScript, melainkan operasi yang tidak langsung mengembalikan hasil saat berinteraksi dengan sistem eksternal lainnya, seperti layanan pembayaran yang perlu menunggu notifikasi lain untuk mengetahui hasilnya.
:::

### Status Hasil Node

Status eksekusi sebuah node memengaruhi keberhasilan atau kegagalan seluruh alur kerja. Umumnya, tanpa cabang, kegagalan sebuah node akan secara langsung menyebabkan seluruh alur kerja gagal. Skenario paling umum adalah jika sebuah node berhasil dieksekusi, ia akan melanjutkan ke node berikutnya dalam tabel node hingga tidak ada lagi node selanjutnya, di mana seluruh eksekusi alur kerja selesai dengan status berhasil.

Jika sebuah node mengembalikan status eksekusi gagal selama eksekusi, mesin akan menanganinya secara berbeda tergantung pada dua situasi berikut:

1.  Node yang mengembalikan status gagal berada dalam alur kerja utama, artinya tidak berada dalam alur kerja cabang mana pun yang dibuka oleh node hulu. Dalam kasus ini, seluruh alur kerja utama dianggap gagal, dan proses keluar.

2.  Node yang mengembalikan status gagal berada dalam alur kerja cabang. Dalam kasus ini, tanggung jawab untuk menentukan status langkah selanjutnya dari alur kerja diserahkan kepada node yang membuka cabang. Logika internal node tersebut akan memutuskan status alur kerja selanjutnya, dan keputusan ini akan menyebar secara rekursif ke alur kerja utama.

Pada akhirnya, status langkah selanjutnya dari seluruh alur kerja ditentukan pada node-node alur kerja utama. Jika sebuah node dalam alur kerja utama mengembalikan kegagalan, seluruh alur kerja berakhir dengan status gagal.

Jika ada node yang mengembalikan status "tertunda" setelah eksekusi, seluruh proses eksekusi akan diinterupsi sementara dan ditangguhkan, menunggu peristiwa yang ditentukan oleh node yang sesuai untuk memicu kelanjutan eksekusi alur kerja. Misalnya, Node Manual, ketika dieksekusi, akan berhenti pada node tersebut dengan status "tertunda", menunggu intervensi manual untuk memutuskan apakah akan menyetujui. Jika status yang dimasukkan secara manual adalah persetujuan, node alur kerja selanjutnya akan dilanjutkan; jika tidak, akan ditangani sesuai dengan logika kegagalan yang dijelaskan sebelumnya.

Untuk status pengembalian instruksi lainnya, silakan lihat bagian Referensi API Alur Kerja.

### Keluar Lebih Awal

Dalam beberapa alur kerja khusus, mungkin perlu untuk mengakhiri alur kerja secara langsung di dalam sebuah node. Anda dapat mengembalikan `null`, yang menunjukkan keluar dari alur kerja saat ini, dan node selanjutnya tidak akan dieksekusi.

Situasi ini umum terjadi pada node tipe kontrol alur, seperti Node Cabang Paralel ([referensi kode](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)), di mana alur kerja node saat ini keluar, tetapi alur kerja baru dimulai untuk setiap sub-cabang dan terus dieksekusi.

:::warn{title=Peringatan}
Penjadwalan alur kerja cabang dengan node yang diperluas memiliki kompleksitas tertentu dan memerlukan penanganan yang hati-hati serta pengujian menyeluruh.
:::

### Pelajari Lebih Lanjut

Definisi berbagai parameter untuk mendefinisikan tipe node dapat dilihat pada bagian Referensi API Alur Kerja.

## Sisi Klien

Mirip dengan pemicu, formulir konfigurasi untuk instruksi (tipe node) perlu diimplementasikan di sisi klien.

### Instruksi Node Paling Sederhana

Semua instruksi perlu diturunkan dari kelas dasar `Instruction`. Properti dan metode terkait digunakan untuk mengonfigurasi dan menggunakan node.

Misalnya, jika kita perlu menyediakan antarmuka konfigurasi untuk node tipe _string_ angka acak (`randomString`) yang didefinisikan di sisi server di atas, yang memiliki item konfigurasi `digit` yang merepresentasikan jumlah digit untuk angka acak, kita akan menggunakan kotak input angka dalam formulir konfigurasi untuk menerima masukan pengguna.

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
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Catatan}
Pengidentifikasi tipe node yang terdaftar di sisi klien harus konsisten dengan yang ada di sisi server, jika tidak akan menyebabkan kesalahan.
:::

### Menyediakan Hasil Node sebagai Variabel

Anda mungkin memperhatikan metode `useVariables` pada contoh di atas. Jika Anda perlu menggunakan hasil node (bagian `result`) sebagai variabel untuk node selanjutnya, Anda perlu mengimplementasikan metode ini dalam kelas instruksi yang diwarisi dan mengembalikan objek yang sesuai dengan tipe `VariableOption`. Objek ini berfungsi sebagai deskripsi struktural dari hasil eksekusi node, menyediakan pemetaan nama variabel untuk pemilihan dan penggunaan di node selanjutnya.

Tipe `VariableOption` didefinisikan sebagai berikut:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

Intinya adalah properti `value`, yang merepresentasikan nilai jalur tersegmentasi dari nama variabel. `label` digunakan untuk tampilan di antarmuka, dan `children` digunakan untuk merepresentasikan struktur variabel multi-level, yang digunakan ketika hasil node adalah objek yang bersarang dalam.

Variabel yang dapat digunakan direpresentasikan secara internal dalam sistem sebagai _string_ templat jalur yang dipisahkan oleh `.`, misalnya, `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Di sini, `jobsMapByNodeKey` merepresentasikan kumpulan hasil dari semua node (didefinisikan secara internal, tidak perlu ditangani), `2dw92cdf` adalah `key` node, dan `abc` adalah properti kustom dalam objek hasil node.

Selain itu, karena hasil node juga bisa berupa nilai sederhana, saat menyediakan variabel node, level pertama **harus** berupa deskripsi node itu sendiri:

```ts
{
  value: node.key,
  label: node.title,
}
```

Artinya, level pertama adalah `key` dan judul node. Misalnya, pada [referensi kode](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) node perhitungan, saat menggunakan hasil node perhitungan, opsi antarmuka adalah sebagai berikut:

![Hasil Node Perhitungan](https://static-docs.nocobase.com/20240514230014.png)

Ketika hasil node adalah objek kompleks, Anda dapat menggunakan `children` untuk terus menjelaskan properti yang bersarang. Misalnya, instruksi kustom mungkin mengembalikan data JSON berikut:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Kemudian Anda dapat mengembalikannya melalui metode `useVariables` sebagai berikut:

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

Dengan cara ini, di node selanjutnya, Anda dapat menggunakan antarmuka berikut untuk memilih variabel darinya:

![Variabel Hasil yang Dipetakan](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Catatan"}
Ketika sebuah struktur dalam hasil adalah _array_ objek yang bersarang dalam, Anda juga dapat menggunakan `children` untuk menjelaskan jalur, tetapi tidak dapat menyertakan indeks _array_. Ini karena dalam penanganan variabel alur kerja NocoBase, deskripsi jalur variabel untuk _array_ objek secara otomatis diratakan menjadi _array_ nilai yang dalam saat digunakan, dan Anda tidak dapat mengakses nilai tertentu berdasarkan indeksnya.
:::

### Ketersediaan Node

Secara _default_, node apa pun dapat ditambahkan ke alur kerja. Namun, dalam beberapa kasus, sebuah node mungkin tidak berlaku dalam tipe alur kerja atau cabang tertentu. Dalam situasi seperti itu, Anda dapat mengonfigurasi ketersediaan node menggunakan `isAvailable`:

```ts
// Definisi tipe
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Instans plugin alur kerja
  engine: WorkflowPlugin;
  // Instans alur kerja
  workflow: object;
  // Node hulu
  upstream: object;
  // Apakah ini node cabang (nomor cabang)
  branchIndex: number;
};
```

Metode `isAvailable` mengembalikan `true` jika node tersedia, dan `false` jika tidak. Parameter `ctx` berisi informasi konteks node saat ini, yang dapat digunakan untuk menentukan ketersediaannya.

Jika tidak ada persyaratan khusus, Anda tidak perlu mengimplementasikan metode `isAvailable`, karena node tersedia secara _default_. Skenario paling umum yang memerlukan konfigurasi adalah ketika sebuah node mungkin merupakan operasi yang memakan waktu dan tidak cocok untuk dieksekusi dalam alur kerja sinkron. Anda dapat menggunakan metode `isAvailable` untuk membatasi penggunaannya. Contohnya:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Pelajari Lebih Lanjut

Definisi berbagai parameter untuk mendefinisikan tipe node dapat dilihat pada bagian Referensi API Alur Kerja.