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


Tipe Trigger yang diperluas perlu memastikan identifier unik, mendaftarkan implementasi subscribe/unsubscribe Trigger di server, dan mendaftarkan implementasi konfigurasi antarmuka di client.

## Server

Setiap Trigger perlu di-extend dari kelas dasar `Trigger`, dan mengimplementasikan method `on`/`off`, masing-masing untuk subscribe dan unsubscribe event lingkungan tertentu. Pada method `on`, perlu memanggil `this.workflow.trigger()` di dalam fungsi callback event tertentu untuk akhirnya memicu event. Selain itu, pada method `off`, perlu melakukan pekerjaan pembersihan unsubscribe terkait.

Di mana `this.workflow` adalah instance plugin Workflow yang diteruskan dalam konstruktor kelas dasar `Trigger`.

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

Misalnya untuk Trigger eksekusi terjadwal di atas, definisikan item konfigurasi waktu interval (`interval`) yang dibutuhkan dalam form antarmuka konfigurasi:

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

Kemudian di plugin yang diperluas, daftarkan tipe Trigger ini ke instance plugin Workflow:

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

Setelah itu, tipe Trigger baru akan terlihat di antarmuka konfigurasi Workflow.

:::info{title=Tips}
Identifier tipe Trigger yang didaftarkan di client harus konsisten dengan yang ada di server, jika tidak akan menyebabkan error.
:::

Untuk konten lain dari pendefinisian tipe Trigger, lihat bagian [Referensi API Workflow](./api#pluginregisterTrigger).
