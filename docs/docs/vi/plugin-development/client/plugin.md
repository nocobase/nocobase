:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Plugin

Trong NocoBase, **Client Plugin** là cách chính để mở rộng và tùy chỉnh các chức năng frontend. Bằng cách kế thừa lớp cơ sở `Plugin` được cung cấp bởi `@nocobase/client`, nhà phát triển có thể đăng ký logic, thêm các thành phần trang, mở rộng menu hoặc tích hợp các chức năng của bên thứ ba tại các giai đoạn vòng đời khác nhau.

## Cấu trúc lớp Plugin

Dưới đây là cấu trúc cơ bản của một plugin phía máy khách:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Thực thi sau khi plugin được thêm
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Thực thi trước khi plugin tải
    console.log('Before plugin load');
  }

  async load() {
    // Thực thi khi plugin tải, đăng ký các route, thành phần UI, v.v.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Mô tả vòng đời

Mỗi plugin sẽ lần lượt trải qua các giai đoạn vòng đời sau khi trình duyệt được làm mới hoặc ứng dụng được khởi tạo:

| Phương thức vòng đời | Thời điểm thực thi | Mô tả |
| -------------------- | ------------------ | ----- |
| **afterAdd()**       | Thực thi ngay sau khi plugin được thêm vào trình quản lý plugin | Tại thời điểm này, thể hiện (instance) của plugin đã được tạo, nhưng không phải tất cả các plugin đều đã hoàn tất khởi tạo. Thích hợp cho việc khởi tạo nhẹ, chẳng hạn như đọc cấu hình hoặc liên kết các sự kiện cơ bản. |
| **beforeLoad()**     | Thực thi trước khi tất cả các plugin gọi `load()` | Có thể truy cập tất cả các thể hiện plugin đã được bật (`this.app.pm.get()`). Thích hợp cho việc thực thi logic chuẩn bị có phụ thuộc vào các plugin khác. |
| **load()**           | Thực thi khi plugin tải | Phương thức này được thực thi sau khi tất cả các plugin đã hoàn tất `beforeLoad()`. Thích hợp để đăng ký các route frontend, thành phần UI và các logic cốt lõi khác. |

## Thứ tự thực thi

Mỗi khi trình duyệt được làm mới, các phương thức `afterAdd()` → `beforeLoad()` → `load()` sẽ được thực thi.

## Ngữ cảnh Plugin và FlowEngine

Bắt đầu từ NocoBase 2.0, các API mở rộng phía máy khách chủ yếu tập trung trong **FlowEngine**. Trong lớp plugin, bạn có thể lấy thể hiện của engine thông qua `this.engine`.

```ts
// Truy cập ngữ cảnh engine trong phương thức load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Để biết thêm chi tiết, vui lòng xem:
- [FlowEngine](/flow-engine)
- [Ngữ cảnh](./context.md)