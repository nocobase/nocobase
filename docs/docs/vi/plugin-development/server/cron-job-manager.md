:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# CronJobManager

`CronJobManager` là một trình quản lý tác vụ định kỳ do NocoBase cung cấp, được xây dựng dựa trên [cron](https://www.npmjs.com/package/cron). Nó cho phép các plugin đăng ký các tác vụ định kỳ trên máy chủ để thực thi logic cụ thể theo chu kỳ.

## Cách sử dụng cơ bản

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Thực thi lúc 00:00 mỗi ngày
      onTick: async () => {
        console.log('Tác vụ hàng ngày: dọn dẹp dữ liệu tạm thời');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Tự động khởi động
    });
  }

  async cleanTemporaryData() {
    // Thực thi logic dọn dẹp tại đây
  }
}
```

## Mô tả tham số

Định nghĩa kiểu `CronJobParameters` như sau (từ [cron](https://www.npmjs.com/package/cron)):

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

| Tham số          | Kiểu                       | Mô tả                                                                                                |
| ---------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Biểu thức thời gian của tác vụ định kỳ. Hỗ trợ các biểu thức cron tiêu chuẩn, ví dụ `0 0 * * *` nghĩa là thực thi lúc 00:00 mỗi ngày. |
| **onTick**       | `function`                 | Hàm chính của tác vụ. Sẽ được kích hoạt vào thời gian đã chỉ định.                                   |
| **onComplete**   | `function`                 | Thực thi khi tác vụ bị dừng bởi `job.stop()` hoặc sau khi hàm `onTick` hoàn tất.                       |
| **start**        | `boolean`                  | Liệu có khởi động tác vụ ngay lập tức hay không.                                                     |
| **timeZone**     | `string`                   | Chỉ định múi giờ thực thi (ví dụ: `Asia/Shanghai`).                                                  |
| **context**      | `any`                      | Ngữ cảnh khi thực thi `onTick`.                                                                      |
| **runOnInit**    | `boolean`                  | Liệu có thực thi một lần ngay lập tức khi khởi tạo hay không.                                        |
| **utcOffset**    | `string \| number`         | Chỉ định độ lệch múi giờ UTC.                                                                        |
| **unrefTimeout** | `boolean`                  | Kiểm soát liệu vòng lặp sự kiện có duy trì hoạt động hay không.                                      |

## Ví dụ về biểu thức Cron

| Biểu thức         | Ý nghĩa                         |
| ----------------- | ------------------------------- |
| `* * * * *`       | Thực thi mỗi phút               |
| `0 * * * *`       | Thực thi mỗi giờ                |
| `0 0 * * *`       | Thực thi lúc 00:00 mỗi ngày      |
| `0 9 * * 1`       | Thực thi lúc 09:00 mỗi thứ Hai  |
| `*/10 * * * *`    | Thực thi mỗi 10 phút            |

> 💡 Bạn có thể sử dụng [crontab.guru](https://crontab.guru/) để hỗ trợ tạo biểu thức.

## Kiểm soát việc khởi động và dừng tác vụ

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Khởi động tác vụ
job.stop();  // Dừng tác vụ
```

:::tip

Các tác vụ định kỳ sẽ tự động khởi động cùng với ứng dụng và dừng khi ứng dụng dừng. Thông thường, bạn không cần phải tự khởi động hoặc dừng chúng một cách thủ công trừ khi có yêu cầu đặc biệt.

:::