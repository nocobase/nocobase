---
title: "CronJobManager Tugas Terjadwal"
description: "Tugas terjadwal NocoBase: app.cronJobManager, ekspresi cron, registrasi dan penjadwalan tugas terjadwal."
keywords: "CronJobManager,tugas terjadwal,cron,app.cronJobManager,penjadwalan task,NocoBase"
---

# CronJobManager Manajemen Tugas Terjadwal

`CronJobManager` adalah manajer tugas terjadwal yang disediakan NocoBase, berbasis pada [cron](https://www.npmjs.com/package/cron). Anda dapat mendaftarkan tugas terjadwal di plugin, untuk mengeksekusi logika tertentu secara periodik.

## Penggunaan Dasar

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *',       // Eksekusi setiap hari pukul 00:00
      onTick: async () => {
        console.log('Task harian: Membersihkan data sementara');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true,                  // Otomatis dimulai
    });
  }

  async cleanTemporaryData() {
    // Eksekusi logika pembersihan di sini
  }
}
```

## Penjelasan Parameter

Tipe `CronJobParameters` didefinisikan sebagai berikut (dari [cron](https://www.npmjs.com/package/cron)):

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| Parameter  | Tipe  | Penjelasan  |
| ---------------- | ---------- | ---------- |
| **cronTime**     | `string \| Date \| DateTime` | Ekspresi waktu tugas terjadwal. Mendukung ekspresi cron standar, seperti `0 0 * * *` berarti dieksekusi setiap hari pukul 00:00. |
| **onTick**       | `function` | Function utama task. Akan dipicu pada waktu yang ditentukan.                         |
| **onComplete**   | `function` | Dieksekusi saat task dihentikan oleh `job.stop()` atau `onTick` aktif memanggil completion. |
| **timeZone**     | `string`   | Menentukan zona waktu eksekusi (misalnya `Asia/Shanghai`).  |
| **context**      | `any`      | Konteks saat eksekusi `onTick`.  |
| **runOnInit**    | `boolean`  | Apakah langsung dieksekusi sekali saat inisialisasi.  |
| **utcOffset**    | `string \| number`  | Menentukan offset zona waktu.   |
| **unrefTimeout** | `boolean`  | Mengontrol apakah event loop tetap aktif.  |

## Contoh Ekspresi Cron

| Ekspresi            | Arti           |
| -------------- | ------------ |
| `* * * * *`    | Eksekusi setiap menit      |
| `0 * * * *`    | Eksekusi setiap jam      |
| `0 0 * * *`    | Eksekusi setiap hari pukul 00:00  |
| `0 9 * * 1`    | Eksekusi setiap Senin pukul 09:00 |
| `*/10 * * * *` | Eksekusi setiap 10 menit  |

:::tip Tips

Anda dapat menggunakan [crontab.guru](https://crontab.guru/) untuk membantu menggenerate ekspresi cron.

:::

## Mengontrol Start dan Stop Task

`addJob()` akan mengembalikan objek job, Anda dapat menggunakannya untuk mengontrol task secara manual:

```ts
const job = app.cronJobManager.addJob({ ... });
job.start();  // Memulai task
job.stop();   // Menghentikan task
```

:::tip Tips

Tugas terjadwal akan mengikuti startup dan stop aplikasi, biasanya Anda tidak perlu memanggil `start()` atau `stop()` secara manual.

:::

## Tautan Terkait

- [Plugin](./plugin.md) — Siklus hidup plugin dan API inti
- [Sistem Event](./event.md) — Listen dan trigger event aplikasi
- [Ikhtisar Pengembangan Server](./index.md) — Ringkasan setiap modul server
- [Ikhtisar Plugin Development](../index.md) — Pengantar menyeluruh tentang plugin development
