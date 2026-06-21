---
title: "CronJobManager - Tác vụ định kỳ"
description: "Tác vụ định kỳ NocoBase: app.cronJobManager, biểu thức cron, đăng ký và lập lịch tác vụ định kỳ."
keywords: "CronJobManager,Tác vụ định kỳ,cron,app.cronJobManager,Lập lịch tác vụ,NocoBase"
---

# CronJobManager - Quản lý tác vụ định kỳ

`CronJobManager` là trình quản lý tác vụ định kỳ do NocoBase cung cấp, được triển khai dựa trên [cron](https://www.npmjs.com/package/cron). Bạn có thể đăng ký tác vụ định kỳ trong Plugin, dùng để thực thi logic cụ thể theo chu kỳ.

## Cách dùng cơ bản

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *',       // Thực thi mỗi ngày 00:00
      onTick: async () => {
        console.log('Tác vụ hàng ngày: Dọn dẹp dữ liệu tạm');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true,                  // Tự động khởi động
    });
  }

  async cleanTemporaryData() {
    // Thực thi logic dọn dẹp ở đây
  }
}
```

## Mô tả tham số

Kiểu `CronJobParameters` được định nghĩa như sau (từ [cron](https://www.npmjs.com/package/cron)):

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

| Tham số  | Kiểu  | Mô tả  |
| ---------------- | ---------- | ---------- |
| **cronTime**     | `string \| Date \| DateTime` | Biểu thức thời gian của tác vụ định kỳ. Hỗ trợ biểu thức cron tiêu chuẩn, ví dụ `0 0 * * *` biểu thị thực thi mỗi ngày 00:00. |
| **onTick**       | `function` | Hàm chính của tác vụ. Sẽ được kích hoạt vào thời gian đã chỉ định.                         |
| **onComplete**   | `function` | Thực thi khi tác vụ bị dừng bởi `job.stop()` hoặc `onTick` chủ động gọi xong. |
| **timeZone**     | `string`   | Chỉ định múi giờ thực thi (ví dụ `Asia/Shanghai`).  |
| **context**      | `any`      | Context khi thực thi `onTick`.  |
| **runOnInit**    | `boolean`  | Có thực thi ngay một lần khi khởi tạo không.  |
| **utcOffset**    | `string \| number`  | Chỉ định offset múi giờ.   |
| **unrefTimeout** | `boolean`  | Kiểm soát vòng lặp sự kiện có duy trì hoạt động hay không.  |

## Ví dụ biểu thức Cron

| Biểu thức            | Ý nghĩa           |
| -------------- | ------------ |
| `* * * * *`    | Thực thi mỗi phút      |
| `0 * * * *`    | Thực thi mỗi giờ      |
| `0 0 * * *`    | Thực thi mỗi ngày 00:00  |
| `0 9 * * 1`    | Thực thi mỗi thứ Hai 09:00 |
| `*/10 * * * *` | Thực thi mỗi 10 phút  |

:::tip Mẹo

Có thể dùng [crontab.guru](https://crontab.guru/) để hỗ trợ tạo biểu thức cron.

:::

## Kiểm soát khởi động và dừng tác vụ

`addJob()` sẽ trả về một đối tượng job, bạn có thể dùng nó để kiểm soát tác vụ thủ công:

```ts
const job = app.cronJobManager.addJob({ ... });
job.start();  // Khởi động tác vụ
job.stop();   // Dừng tác vụ
```

:::tip Mẹo

Tác vụ định kỳ sẽ theo ứng dụng khởi động và dừng, thông thường bạn không cần gọi `start()` hoặc `stop()` thủ công.

:::

## Liên kết liên quan

- [Plugin](./plugin.md) — Vòng đời Plugin và API cốt lõi
- [Hệ thống sự kiện Event](./event.md) — Lắng nghe và kích hoạt sự kiện ứng dụng
- [Tổng quan phát triển server](./index.md) — Tổng quan các module server
- [Tổng quan phát triển Plugin](../index.md) — Giới thiệu tổng thể về phát triển Plugin
