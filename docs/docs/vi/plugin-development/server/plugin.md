---
title: "Server Plugin"
description: "Plugin server NocoBase: kế thừa lớp Plugin, vòng đời afterAdd, beforeLoad, load, install, đăng ký resource và event."
keywords: "Server Plugin,lớp Plugin,afterAdd,beforeLoad,load,install,Plugin server,NocoBase"
---

# Plugin

Trong NocoBase, **Plugin server (Server Plugin)** là cách chính để mở rộng chức năng phía server. Bạn có thể kế thừa lớp cơ sở `Plugin` được cung cấp bởi `@nocobase/server` trong file `src/server/plugin.ts` của thư mục Plugin, sau đó đăng ký event, API, quyền và logic tùy chỉnh khác trong các giai đoạn vòng đời khác nhau.

## Lớp Plugin

Cấu trúc cơ bản của một lớp Plugin:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Vòng đời

Các phương thức vòng đời của Plugin được thực thi theo thứ tự sau, mỗi phương thức có thời điểm thực thi và mục đích cụ thể:

| Phương thức vòng đời | Thời điểm thực thi | Mô tả |
|----------------------|---------------------|-------|
| **staticImport()** | Trước khi Plugin được load | Phương thức tĩnh của lớp, thực thi ở giai đoạn khởi tạo không liên quan đến trạng thái ứng dụng hoặc Plugin, dùng cho công việc khởi tạo không phụ thuộc vào instance Plugin. |
| **afterAdd()** | Thực thi ngay sau khi Plugin được thêm vào PluginManager | Lúc này instance Plugin đã được tạo, nhưng không phải tất cả Plugin đã khởi tạo xong, có thể làm một số khởi tạo cơ bản. |
| **beforeLoad()** | Thực thi trước `load()` của tất cả Plugin | Lúc này đã có thể lấy được tất cả **instance Plugin đã kích hoạt**. Phù hợp để đăng ký model database, lắng nghe sự kiện database, đăng ký middleware và các công việc chuẩn bị khác. |
| **load()** | Thực thi khi Plugin được load | Sau khi `beforeLoad()` của tất cả Plugin thực thi xong mới bắt đầu thực thi `load()`. Phù hợp để đăng ký resource, API và logic nghiệp vụ cốt lõi — ví dụ đăng ký [REST API tùy chỉnh](./resource-manager.md) qua `resourceManager`. **Lưu ý:** Ở giai đoạn `load()`, database chưa đồng bộ xong, không thể truy vấn hoặc ghi database — thao tác database nên đặt trong `install()` hoặc trong hàm xử lý request. |
| **install()** | Thực thi khi Plugin lần đầu kích hoạt | Chỉ thực thi một lần duy nhất khi Plugin được kích hoạt lần đầu, thường dùng cho logic cài đặt như khởi tạo cấu trúc bảng database, chèn dữ liệu ban đầu. `install()` chỉ thực thi khi kích hoạt lần đầu — nếu phiên bản sau cần thay đổi cấu trúc bảng hoặc migration dữ liệu, hãy dùng [Migration script nâng cấp](./migration.md). |
| **afterEnable()** | Thực thi sau khi Plugin được kích hoạt | Mỗi lần Plugin được kích hoạt đều thực thi, có thể dùng để khởi động tác vụ định kỳ, thiết lập kết nối, v.v. |
| **afterDisable()** | Thực thi sau khi Plugin bị vô hiệu hóa | Có thể dùng để dọn dẹp tài nguyên, dừng tác vụ, đóng kết nối, v.v. |
| **remove()** | Thực thi khi Plugin bị xóa | Dùng để viết logic gỡ cài đặt như xóa bảng database, dọn file, v.v. |
| **handleSyncMessage(message)** | Đồng bộ message khi deploy multi-node | Khi ứng dụng chạy ở chế độ multi-node, dùng để xử lý message đồng bộ từ các node khác. |

### Mô tả thứ tự thực thi

Quy trình thực thi điển hình của các phương thức vòng đời:

1. **Giai đoạn khởi tạo tĩnh**: `staticImport()`
2. **Giai đoạn khởi động ứng dụng**: `afterAdd()` → `beforeLoad()` → `load()`
3. **Giai đoạn kích hoạt Plugin lần đầu**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Giai đoạn kích hoạt Plugin lần sau**: `afterAdd()` → `beforeLoad()` → `load()`
5. **Giai đoạn vô hiệu hóa Plugin**: Khi vô hiệu hóa Plugin thực thi `afterDisable()`
6. **Giai đoạn xóa Plugin**: Khi xóa Plugin thực thi `remove()`

## app và các thành viên liên quan

Trong phát triển Plugin, qua `this.app` bạn có thể truy cập các API mà instance ứng dụng cung cấp — đây là entry chính để Plugin mở rộng chức năng. Đối tượng `app` chứa các module chức năng của hệ thống, bạn có thể sử dụng chúng trong các phương thức vòng đời của Plugin.

### Danh sách thành viên app

| Tên thành viên | Loại/Module | Công dụng chính |
|-----------------|-------------|-----------------|
| **logger** | `Logger` | Ghi log hệ thống, hỗ trợ các mức info, warn, error, debug. Xem chi tiết tại [Logger](./logger.md) |
| **db** | `Database` | Thao tác ORM, đăng ký model, lắng nghe event, kiểm soát transaction, v.v. Xem chi tiết tại [Database](./database.md) |
| **resourceManager** | `ResourceManager` | Đăng ký và quản lý resource REST API và handler Action. Xem chi tiết tại [ResourceManager](./resource-manager.md) |
| **acl** | `ACL` | Định nghĩa quyền, role và chính sách truy cập resource. Xem chi tiết tại [ACL](./acl.md) |
| **cacheManager** | `CacheManager` | Quản lý cache cấp hệ thống, hỗ trợ Redis, in-memory cache và nhiều backend khác. Xem chi tiết tại [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Đăng ký và quản lý tác vụ định kỳ, hỗ trợ biểu thức Cron. Xem chi tiết tại [CronJobManager](./cron-job-manager.md) |
| **i18n** | `I18n` | Dịch đa ngôn ngữ và bản địa hóa. Xem chi tiết tại [I18n](./i18n.md) |
| **cli** | `CLI` | Đăng ký lệnh tùy chỉnh, mở rộng NocoBase CLI. Xem chi tiết tại [Command](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Quản lý nhiều instance nguồn dữ liệu và kết nối của chúng. Xem chi tiết tại [DataSourceManager](./data-source-manager.md) |
| **pm** | `PluginManager` | Load động, kích hoạt, vô hiệu hóa, xóa Plugin, quản lý quan hệ phụ thuộc giữa các Plugin. |

:::tip Mẹo

Cách dùng chi tiết của từng module, vui lòng tham khảo chương tài liệu tương ứng.

:::

## Liên kết liên quan

- [Tổng quan phát triển server](./index.md) — Tổng quan và navigation các module server
- [Collections](./collections.md) — Định nghĩa hoặc mở rộng cấu trúc bảng dữ liệu bằng code
- [Database](./database.md) — CRUD, Repository, transaction và sự kiện database
- [Migration](./migration.md) — Script migration dữ liệu khi nâng cấp Plugin
- [Event](./event.md) — Lắng nghe và xử lý sự kiện cấp ứng dụng và database
- [ResourceManager](./resource-manager.md) — Đăng ký REST API và Action tùy chỉnh
- [Viết Plugin đầu tiên](../write-your-first-plugin.md) — Tạo Plugin hoàn chỉnh từ đầu
- [Logger](./logger.md) — Ghi log hệ thống
- [ACL](./acl.md) — Định nghĩa quyền và chính sách truy cập
- [Cache](./cache.md) — Quản lý cache cấp hệ thống
- [CronJobManager](./cron-job-manager.md) — Đăng ký và quản lý tác vụ định kỳ
- [I18n](./i18n.md) — Dịch đa ngôn ngữ
- [Command](./command.md) — Đăng ký lệnh CLI tùy chỉnh
- [DataSourceManager](./data-source-manager.md) — Quản lý nhiều nguồn dữ liệu
