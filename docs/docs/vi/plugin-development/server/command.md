---
title: "Command - Dòng lệnh"
description: "Dòng lệnh tùy chỉnh phía server NocoBase: app.command, commander, mở rộng CLI, lệnh con yarn nocobase."
keywords: "Command,Dòng lệnh,app.command,commander,CLI,yarn nocobase,NocoBase"
---

# Command - Dòng lệnh

Trong NocoBase, lệnh (Command) được dùng để thực thi các thao tác liên quan đến ứng dụng hoặc Plugin trong dòng lệnh — ví dụ chạy tác vụ hệ thống, thực thi migration, khởi tạo cấu hình hoặc tương tác với instance ứng dụng đang chạy. Bạn có thể định nghĩa lệnh tùy chỉnh cho Plugin, sau khi đăng ký thông qua đối tượng `app`, có thể thực thi trong CLI dưới dạng `nocobase <command>`.

## Loại lệnh

Trong NocoBase, cách đăng ký lệnh chia làm hai loại:

| Loại | Cách đăng ký | Plugin có cần bật không | Tình huống điển hình |
|------|------------|------------------|-----------|
| Lệnh động | `app.command()` | ✅ Có | Lệnh liên quan đến nghiệp vụ Plugin |
| Lệnh tĩnh | `Application.registerStaticCommand()` | ❌ Không | Lệnh cài đặt, khởi tạo, bảo trì |

## Lệnh động

Dùng `app.command()` để định nghĩa lệnh Plugin, chỉ thực thi được sau khi Plugin được bật. Tệp lệnh thường được đặt trong `src/server/commands/*.ts` của thư mục Plugin.

### Ví dụ

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Trong đó:

- `app.command('echo')` — Định nghĩa một lệnh tên là `echo`
- `.option('-v, --version')` — Thêm tùy chọn cho lệnh
- `.action()` — Định nghĩa logic thực thi lệnh
- `app.version.get()` — Lấy phiên bản ứng dụng hiện tại

### Thực thi lệnh

```bash
nocobase echo
nocobase echo -v
```

## Lệnh tĩnh

Đăng ký bằng `Application.registerStaticCommand()`, lệnh tĩnh không cần bật Plugin cũng có thể thực thi, phù hợp cho các tác vụ cài đặt, khởi tạo, migration hoặc debug. Thường được đăng ký trong phương thức `staticImport()` của lớp Plugin.

### Ví dụ

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

### Thực thi lệnh

```bash
nocobase echo
nocobase echo --version
```

Trong đó:

- `Application.registerStaticCommand()` sẽ đăng ký lệnh trước khi ứng dụng được khởi tạo
- Lệnh tĩnh thường được dùng để thực thi các tác vụ toàn cục không liên quan đến trạng thái ứng dụng hoặc Plugin

## Command API

Đối tượng lệnh cung cấp ba phương thức trợ giúp tùy chọn, dùng để kiểm soát context thực thi của lệnh:

| Phương thức | Tác dụng | Ví dụ |
|------|------|------|
| `ipc()` | Giao tiếp với instance ứng dụng đang chạy (qua IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Xác minh cấu hình database có đúng không | `app.command('seed').auth().action()` |
| `preload()` | Tải trước cấu hình ứng dụng (thực thi `app.load()`) | `app.command('sync').preload().action()` |

### Mô tả cấu hình

- **`ipc()`**
  Thông thường, lệnh sẽ được thực thi trong một instance ứng dụng mới. Sau khi bật `ipc()`, lệnh sẽ tương tác với instance ứng dụng đang chạy thông qua giao tiếp giữa các tiến trình (IPC), phù hợp cho các lệnh thao tác thời gian thực (ví dụ làm mới cache, gửi thông báo).

- **`auth()`**
  Kiểm tra cấu hình database có khả dụng hay không trước khi thực thi lệnh. Nếu cấu hình database sai hoặc kết nối thất bại, lệnh sẽ không tiếp tục thực thi. Thường được dùng cho các tác vụ liên quan đến ghi hoặc đọc database.

- **`preload()`**
  Tải trước cấu hình ứng dụng trước khi thực thi lệnh, tương đương với việc thực thi `app.load()`. Phù hợp với các lệnh phụ thuộc vào cấu hình hoặc context Plugin.

Xem thêm các phương thức API tại [AppCommand API](../../api/server/app-command.md).

## Ví dụ phổ biến

### Khởi tạo dữ liệu mặc định

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

### Cho instance đang chạy tải lại cache (chế độ IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

### Đăng ký tĩnh lệnh cài đặt

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```

## Liên kết liên quan

- [Plugin](./plugin.md) — Vòng đời Plugin và API cốt lõi
- [Tổng quan phát triển server](./index.md) — Tổng quan các module server
- [Test](./test.md) — Cách viết kiểm thử Plugin server
- [Migration](./migration.md) — Migration dữ liệu và script nâng cấp
- [Tổng quan phát triển Plugin](../index.md) — Giới thiệu tổng thể về phát triển Plugin
- [AppCommand API](../../api/server/app-command.md) — Tham chiếu API đầy đủ của AppCommand
