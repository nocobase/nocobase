:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Lệnh (Command)

Trong NocoBase, các lệnh (Command) dùng để thực thi trên dòng lệnh các thao tác liên quan đến ứng dụng hoặc **plugin**, ví dụ như chạy các tác vụ hệ thống, thực hiện các thao tác di chuyển (migration) hoặc đồng bộ hóa, khởi tạo cấu hình, hoặc tương tác với các phiên bản ứng dụng đang chạy. Các nhà phát triển có thể định nghĩa các lệnh tùy chỉnh cho **plugin** và đăng ký chúng thông qua đối tượng `app`, để thực thi trong CLI dưới dạng `nocobase <command>`.

## Các loại lệnh

Trong NocoBase, việc đăng ký lệnh được chia thành hai loại:

| Loại | Phương thức đăng ký | **Plugin** có cần được kích hoạt không? | Các trường hợp điển hình |
|------|----------------------|-----------------------------------------|--------------------------|
| Lệnh động | `app.command()`      | ✅ Có                                   | Các lệnh liên quan đến nghiệp vụ của **plugin** |
| Lệnh tĩnh | `Application.registerStaticCommand()` | ❌ Không                                | Các lệnh cài đặt, khởi tạo, bảo trì |

## Lệnh động

Sử dụng `app.command()` để định nghĩa các lệnh của **plugin**. Các lệnh này chỉ có thể được thực thi sau khi **plugin** được kích hoạt. Các tệp lệnh nên được đặt trong thư mục `src/server/commands/*.ts` của **plugin**.

Ví dụ

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

Giải thích

- `app.command('echo')`: Định nghĩa một lệnh có tên `echo`.  
- `.option('-v, --version')`: Thêm một tùy chọn cho lệnh.  
- `.action()`: Định nghĩa logic thực thi lệnh.  
- `app.version.get()`: Lấy phiên bản ứng dụng hiện tại.

Thực thi lệnh

```bash
nocobase echo
nocobase echo -v
```

## Lệnh tĩnh

Sử dụng `Application.registerStaticCommand()` để đăng ký. Các lệnh tĩnh có thể được thực thi mà không cần kích hoạt **plugin**, phù hợp cho các tác vụ cài đặt, khởi tạo, di chuyển (migration) hoặc gỡ lỗi. Đăng ký trong phương thức `staticImport()` của lớp **plugin**.

Ví dụ

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

Thực thi lệnh

```bash
nocobase echo
nocobase echo --version
```

Giải thích

- `Application.registerStaticCommand()` sẽ đăng ký các lệnh trước khi ứng dụng được khởi tạo.  
- Các lệnh tĩnh thường được sử dụng để thực thi các tác vụ toàn cục không liên quan đến trạng thái của ứng dụng hoặc **plugin**.  

## Command API

Đối tượng lệnh cung cấp ba phương thức hỗ trợ tùy chọn, dùng để kiểm soát ngữ cảnh thực thi lệnh:

| Phương thức | Mục đích | Ví dụ |
|-------------|----------|-------|
| `ipc()`     | Giao tiếp với các phiên bản ứng dụng đang chạy (thông qua IPC) | `app.command('reload').ipc().action()` |
| `auth()`    | Xác minh cấu hình cơ sở dữ liệu có chính xác không | `app.command('seed').auth().action()` |
| `preload()` | Tải trước cấu hình ứng dụng (thực thi `app.load()`) | `app.command('sync').preload().action()` |

Mô tả cấu hình

- **`ipc()`**  
  Theo mặc định, các lệnh sẽ được thực thi trong một phiên bản ứng dụng mới.  
  Sau khi kích hoạt `ipc()`, lệnh sẽ tương tác với phiên bản ứng dụng đang chạy hiện tại thông qua giao tiếp liên tiến trình (IPC), phù hợp cho các lệnh thao tác thời gian thực (như làm mới bộ nhớ đệm, gửi thông báo).

- **`auth()`**  
  Kiểm tra xem cấu hình cơ sở dữ liệu có khả dụng trước khi thực thi lệnh hay không.  
  Nếu cấu hình cơ sở dữ liệu không chính xác hoặc kết nối thất bại, lệnh sẽ không tiếp tục thực thi. Thường được sử dụng cho các tác vụ liên quan đến ghi hoặc đọc cơ sở dữ liệu.

- **`preload()`**  
  Tải trước cấu hình ứng dụng trước khi thực thi lệnh, tương đương với việc thực thi `app.load()`.  
  Phù hợp cho các lệnh phụ thuộc vào cấu hình hoặc ngữ cảnh của **plugin**.

Để biết thêm các phương thức API, vui lòng tham khảo [AppCommand](/api/server/app-command).

## Ví dụ thường gặp

Khởi tạo dữ liệu mặc định

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

Yêu cầu phiên bản đang chạy tải lại bộ nhớ đệm (chế độ IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

Đăng ký lệnh cài đặt tĩnh

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```