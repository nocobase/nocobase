:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Tipe Pemicu

Setiap alur kerja harus dikonfigurasi dengan pemicu spesifik, yang berfungsi sebagai titik masuk untuk memulai eksekusi proses.

Tipe pemicu biasanya merepresentasikan suatu kejadian lingkungan sistem yang spesifik. Selama siklus hidup aplikasi berjalan, setiap bagian yang menyediakan kejadian yang dapat di-subscribe dapat digunakan untuk mendefinisikan tipe pemicu. Contohnya, menerima permintaan, operasi koleksi, tugas terjadwal, dan lain-lain.

Tipe pemicu didaftarkan dalam tabel pemicu plugin berdasarkan pengidentifikasi string. Plugin alur kerja memiliki beberapa pemicu bawaan:

- `'collection'`: Dipicu oleh operasi koleksi;
- `'schedule'`: Dipicu oleh tugas terjadwal;
- `'action'`: Dipicu oleh kejadian setelah operasi;

Tipe pemicu yang diperluas perlu memastikan pengidentifikasinya unik. Implementasi untuk berlangganan/berhenti berlangganan pemicu didaftarkan di sisi server, dan implementasi untuk antarmuka konfigurasi didaftarkan di sisi klien.

## Sisi Server

Setiap pemicu perlu mewarisi dari kelas dasar `Trigger` dan mengimplementasikan metode `on`/`off`, yang masing-masing digunakan untuk berlangganan dan berhenti berlangganan kejadian lingkungan spesifik. Dalam metode `on`, Anda perlu memanggil `this.workflow.trigger()` di dalam fungsi callback kejadian spesifik untuk akhirnya memicu kejadian tersebut. Selain itu, dalam metode `off`, Anda perlu melakukan pekerjaan pembersihan terkait untuk berhenti berlangganan.

Di sini, `this.workflow` adalah instans plugin alur kerja yang diteruskan ke konstruktor kelas dasar `Trigger`.

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

Kemudian, dalam plugin yang memperluas alur kerja, daftarkan instans pemicu ke mesin alur kerja:

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

Setelah server dimulai dan dimuat, pemicu tipe `'interval'` dapat ditambahkan dan dieksekusi.

## Sisi Klien

Bagian sisi klien utamanya menyediakan antarmuka konfigurasi berdasarkan item konfigurasi yang diperlukan oleh tipe pemicu. Setiap tipe pemicu juga perlu mendaftarkan konfigurasi tipenya yang sesuai dengan plugin alur kerja.

Sebagai contoh, untuk pemicu eksekusi terjadwal yang disebutkan di atas, definisikan item konfigurasi waktu interval (`interval`) yang diperlukan dalam formulir antarmuka konfigurasi:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

Kemudian, daftarkan tipe pemicu ini ke instans plugin alur kerja di dalam plugin yang diperluas:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Setelah itu, tipe pemicu baru akan terlihat di antarmuka konfigurasi alur kerja.

:::info{title=Catatan}
Pengidentifikasi tipe pemicu yang didaftarkan di sisi klien harus konsisten dengan yang ada di sisi server, jika tidak akan menyebabkan kesalahan.
:::

Untuk detail lain tentang mendefinisikan tipe pemicu, silakan lihat bagian [Referensi API Alur Kerja](./api#pluginregisterTrigger).