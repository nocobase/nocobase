:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# CronJobManager Pengelola Tugas Terjadwal

`CronJobManager` adalah pengelola tugas terjadwal yang disediakan oleh NocoBase, dibangun berdasarkan [cron](https://www.npmjs.com/package/cron). Ini memungkinkan plugin untuk mendaftarkan tugas terjadwal di sisi server, yang digunakan untuk menjalankan logika tertentu secara berkala.

## Penggunaan Dasar

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Dijalankan setiap hari pukul 00:00
      onTick: async () => {
        console.log('Tugas harian: membersihkan data sementara');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Mulai otomatis
    });
  }

  async cleanTemporaryData() {
    // Jalankan logika pembersihan di sini
  }
}
```

## Deskripsi Parameter

Definisi tipe `CronJobParameters` adalah sebagai berikut (dari [cron](https://www.npmjs.com/package/cron)):

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

| Parameter        | Tipe                       | Deskripsi                                                                                                |
| ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Ekspresi waktu tugas terjadwal. Mendukung ekspresi cron standar, misalnya `0 0 * * *` berarti dijalankan setiap hari pukul 00:00. |
| **onTick**       | `function`                 | Fungsi utama tugas. Akan dipicu pada waktu yang ditentukan.                                              |
| **onComplete**   | `function`                 | Dijalankan ketika tugas dihentikan oleh `job.stop()` atau setelah fungsi `onTick` selesai.               |
| **start**        | `boolean`                  | Apakah akan memulai secara otomatis saat inisialisasi.                                                   |
| **timeZone**     | `string`                   | Menentukan zona waktu eksekusi (misalnya `Asia/Shanghai`).                                               |
| **context**      | `any`                      | Konteks saat menjalankan `onTick`.                                                                       |
| **runOnInit**    | `boolean`                  | Apakah akan dijalankan sekali segera saat inisialisasi.                                                  |
| **utcOffset**    | `string \| number`         | Menentukan offset zona waktu.                                                                            |
| **unrefTimeout** | `boolean`                  | Mengontrol apakah event loop tetap aktif.                                                                |

## Contoh Ekspresi Cron

| Ekspresi       | Arti                       |
| -------------- | -------------------------- |
| `* * * * *`    | Dijalankan setiap menit    |
| `0 * * * *`    | Dijalankan setiap jam      |
| `0 0 * * *`    | Dijalankan setiap hari pukul 00:00 |
| `0 9 * * 1`    | Dijalankan setiap Senin pukul 09:00 |
| `*/10 * * * *` | Dijalankan setiap 10 menit |

> 💡 Anda dapat menggunakan [crontab.guru](https://crontab.guru/) untuk membantu membuat ekspresi.

## Mengontrol Mulai dan Henti Tugas

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Mulai tugas
job.stop();  // Hentikan tugas
```

:::tip

Tugas terjadwal akan dimulai saat aplikasi dimulai dan berhenti saat aplikasi dihentikan. Umumnya, Anda tidak perlu memulai atau menghentikannya secara manual kecuali jika benar-benar diperlukan.

:::