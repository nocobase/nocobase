:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Plugin

Trong NocoBase, plugin phía máy chủ cung cấp một phương thức module hóa để mở rộng và tùy chỉnh chức năng phía máy chủ. Các nhà phát triển có thể kế thừa lớp `Plugin` từ `@nocobase/server` để đăng ký các sự kiện, API, cấu hình quyền và các logic tùy chỉnh khác tại các giai đoạn vòng đời khác nhau.

## Lớp Plugin

Cấu trúc lớp plugin cơ bản như sau:

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

Các phương thức vòng đời của plugin được thực thi theo thứ tự sau. Mỗi phương thức có thời điểm và mục đích thực thi cụ thể:

| Phương thức vòng đời | Thời điểm thực thi | Mô tả |
|---|---|---|
| **staticImport()** | Trước khi plugin được tải | Phương thức tĩnh của lớp, được thực thi trong giai đoạn khởi tạo không phụ thuộc vào trạng thái ứng dụng hoặc plugin, dùng để thực hiện các công việc khởi tạo không phụ thuộc vào thể hiện của plugin. |
| **afterAdd()** | Ngay sau khi plugin được thêm vào trình quản lý plugin | Tại thời điểm này, thể hiện plugin đã được tạo, nhưng không phải tất cả các plugin đều đã hoàn tất khởi tạo. Có thể thực hiện một số công việc khởi tạo cơ bản. |
| **beforeLoad()** | Được thực thi trước tất cả các phương thức `load()` của plugin | Tại thời điểm này, có thể truy cập tất cả các **thể hiện plugin đã được kích hoạt**. Thích hợp để đăng ký các mô hình cơ sở dữ liệu, lắng nghe các sự kiện cơ sở dữ liệu, đăng ký middleware và các công việc chuẩn bị khác. |
| **load()** | Được thực thi khi plugin tải | Phương thức `load()` chỉ bắt đầu thực thi sau khi tất cả các phương thức `beforeLoad()` của plugin đã hoàn tất. Thích hợp để đăng ký tài nguyên, giao diện API, dịch vụ và các logic nghiệp vụ cốt lõi khác. |
| **install()** | Được thực thi khi plugin được kích hoạt lần đầu | Chỉ được thực thi một lần duy nhất khi plugin được kích hoạt lần đầu, thường dùng để khởi tạo cấu trúc bảng cơ sở dữ liệu, chèn dữ liệu ban đầu và các logic cài đặt khác. |
| **afterEnable()** | Được thực thi sau khi plugin được kích hoạt | Được thực thi mỗi khi plugin được kích hoạt, có thể dùng để khởi động các tác vụ định kỳ, đăng ký các tác vụ theo lịch, thiết lập kết nối và các hành động sau khi kích hoạt khác. |
| **afterDisable()** | Được thực thi sau khi plugin bị vô hiệu hóa | Được thực thi khi plugin bị vô hiệu hóa, có thể dùng để dọn dẹp tài nguyên, dừng tác vụ, đóng kết nối và các công việc dọn dẹp khác. |
| **remove()** | Được thực thi khi plugin bị xóa | Được thực thi khi plugin bị xóa hoàn toàn, dùng để viết logic gỡ cài đặt, ví dụ như xóa bảng cơ sở dữ liệu, dọn dẹp tệp, v.v. |
| **handleSyncMessage(message)** | Đồng bộ hóa thông báo trong triển khai đa nút | Khi ứng dụng chạy ở chế độ đa nút, dùng để xử lý các thông báo được đồng bộ từ các nút khác. |

### Mô tả thứ tự thực thi

Luồng thực thi điển hình của các phương thức vòng đời:

1. **Giai đoạn khởi tạo tĩnh**: `staticImport()`
2. **Giai đoạn khởi động ứng dụng**: `afterAdd()` → `beforeLoad()` → `load()`
3. **Giai đoạn kích hoạt plugin lần đầu**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Giai đoạn kích hoạt plugin lần hai**: `afterAdd()` → `beforeLoad()` → `load()`
5. **Giai đoạn vô hiệu hóa plugin**: `afterDisable()` được thực thi khi plugin bị vô hiệu hóa
6. **Giai đoạn xóa plugin**: `remove()` được thực thi khi plugin bị xóa

## app và các thành viên liên quan

Trong quá trình phát triển plugin, bạn có thể truy cập các API khác nhau do thể hiện ứng dụng cung cấp thông qua `this.app`. Đây là giao diện cốt lõi để mở rộng chức năng plugin. Đối tượng `app` chứa các module chức năng khác nhau của hệ thống. Các nhà phát triển có thể sử dụng các module này trong các phương thức vòng đời của plugin để triển khai các yêu cầu nghiệp vụ.

### Danh sách thành viên app

| Tên thành viên | Kiểu/Module | Mục đích chính |
|---|---|---|
| **logger** | `Logger` | Ghi lại nhật ký hệ thống, hỗ trợ xuất nhật ký ở các cấp độ khác nhau (info, warn, error, debug), thuận tiện cho việc gỡ lỗi và giám sát. Xem thêm [Nhật ký](./logger.md) |
| **db** | `Database` | Cung cấp các thao tác ở tầng ORM, đăng ký mô hình, lắng nghe sự kiện, kiểm soát giao dịch và các chức năng liên quan đến cơ sở dữ liệu khác. Xem thêm [Cơ sở dữ liệu](./database.md). |
| **resourceManager** | `ResourceManager` | Dùng để đăng ký và quản lý các tài nguyên REST API cùng với các trình xử lý thao tác. Xem thêm [Quản lý tài nguyên](./resource-manager.md). |
| **acl** | `ACL` | Tầng kiểm soát truy cập, dùng để định nghĩa quyền hạn, vai trò và chính sách truy cập tài nguyên, triển khai kiểm soát quyền hạn chi tiết. Xem thêm [Kiểm soát quyền hạn](./acl.md). |
| **cacheManager** | `CacheManager` | Quản lý bộ nhớ đệm cấp hệ thống, hỗ trợ nhiều backend bộ nhớ đệm như Redis, bộ nhớ đệm trong bộ nhớ, v.v., nhằm nâng cao hiệu suất ứng dụng. Xem thêm [Bộ nhớ đệm](./cache.md) |
| **cronJobManager** | `CronJobManager` | Dùng để đăng ký, khởi động và quản lý các tác vụ định kỳ, hỗ trợ cấu hình biểu thức Cron. Xem thêm [Tác vụ định kỳ](./cron-job-manager.md) |
| **i18n** | `I18n` | Hỗ trợ quốc tế hóa, cung cấp chức năng dịch đa ngôn ngữ và bản địa hóa, thuận tiện cho plugin hỗ trợ nhiều ngôn ngữ. Xem thêm [Quốc tế hóa](./i18n.md) |
| **cli** | `CLI` | Quản lý giao diện dòng lệnh, đăng ký và thực thi các lệnh tùy chỉnh, mở rộng chức năng CLI của NocoBase. Xem thêm [Dòng lệnh](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Quản lý nhiều thể hiện nguồn dữ liệu và kết nối của chúng, hỗ trợ các kịch bản đa nguồn dữ liệu. Xem thêm [Quản lý nguồn dữ liệu](./collections.md) |
| **pm** | `PluginManager` | Trình quản lý plugin, dùng để tải, kích hoạt, vô hiệu hóa, xóa plugin một cách động, quản lý các mối quan hệ phụ thuộc giữa các plugin. |

> Lưu ý: Để biết chi tiết cách sử dụng từng module, vui lòng tham khảo các chương tài liệu tương ứng.