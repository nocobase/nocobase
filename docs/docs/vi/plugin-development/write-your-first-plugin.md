:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Viết plugin đầu tiên của bạn

Hướng dẫn này sẽ giúp bạn tạo một plugin khối (block plugin) có thể sử dụng trong các trang, bắt đầu từ con số 0. Qua đó, bạn sẽ hiểu được cấu trúc cơ bản và quy trình phát triển các **plugin** của NocoBase.

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo rằng bạn đã cài đặt NocoBase thành công. Nếu chưa, bạn có thể tham khảo các hướng dẫn cài đặt sau:

- [Cài đặt bằng create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Cài đặt từ mã nguồn Git](/get-started/installation/git)

Sau khi cài đặt hoàn tất, bạn có thể chính thức bắt đầu hành trình phát triển **plugin** của mình.

## Bước 1: Tạo cấu trúc **plugin** cơ bản bằng CLI

Thực hiện lệnh sau trong thư mục gốc của kho lưu trữ để nhanh chóng tạo một **plugin** trống:

```bash
yarn pm create @my-project/plugin-hello
```

Sau khi lệnh chạy thành công, các tệp cơ bản sẽ được tạo trong thư mục `packages/plugins/@my-project/plugin-hello`. Cấu trúc mặc định như sau:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Xuất mặc định plugin phía máy chủ
     ├─ client                   # Vị trí lưu trữ mã phía máy khách
     │  ├─ index.tsx             # Lớp plugin phía máy khách được xuất mặc định
     │  ├─ plugin.tsx            # Điểm vào plugin (kế thừa @nocobase/client Plugin)
     │  ├─ models                # Tùy chọn: các mô hình frontend (ví dụ: các nút luồng)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Vị trí lưu trữ mã phía máy chủ
     │  ├─ index.ts              # Lớp plugin phía máy chủ được xuất mặc định
     │  ├─ plugin.ts             # Điểm vào plugin (kế thừa @nocobase/server Plugin)
     │  ├─ collections           # Tùy chọn: các bộ sưu tập phía máy chủ
     │  ├─ migrations            # Tùy chọn: di chuyển dữ liệu
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Tùy chọn: đa ngôn ngữ
        ├─ en-US.json
        └─ zh-CN.json
```

Sau khi tạo, bạn có thể truy cập trang quản lý **plugin** trong trình duyệt (địa chỉ mặc định: http://localhost:13000/admin/settings/plugin-manager) để xác nhận **plugin** đã xuất hiện trong danh sách hay chưa.

## Bước 2: Triển khai một khối (block) đơn giản phía máy khách

Tiếp theo, chúng ta sẽ thêm một mô hình khối tùy chỉnh vào **plugin** để hiển thị một thông báo chào mừng.

1. **Tạo tệp mô hình khối mới** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Đăng ký mô hình khối**. Chỉnh sửa `client/models/index.ts` để xuất mô hình mới, cho phép frontend tải khi chạy:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Sau khi lưu mã, nếu bạn đang chạy script phát triển, bạn sẽ thấy nhật ký cập nhật nóng (hot-reload) trong đầu ra của terminal.

## Bước 3: Kích hoạt và trải nghiệm **plugin**

Bạn có thể kích hoạt **plugin** thông qua dòng lệnh hoặc giao diện:

- **Dòng lệnh**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Giao diện quản lý**: Truy cập trình quản lý **plugin**, tìm `@my-project/plugin-hello`, và nhấp vào "Kích hoạt".

Sau khi kích hoạt, hãy tạo một trang mới "Modern page (v2)". Khi thêm khối, bạn sẽ thấy "Hello block". Chèn nó vào trang để xem nội dung chào mừng mà bạn vừa viết.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Bước 4: Xây dựng và đóng gói

Khi bạn sẵn sàng phân phối **plugin** đến các môi trường khác, bạn cần xây dựng (build) và đóng gói (package) nó trước:

```bash
yarn build @my-project/plugin-hello --tar
# Hoặc thực hiện theo hai bước
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Gợi ý: Nếu **plugin** được tạo trong kho mã nguồn, lần xây dựng đầu tiên sẽ kích hoạt kiểm tra kiểu toàn bộ kho, có thể mất khá nhiều thời gian. Bạn nên đảm bảo các phụ thuộc đã được cài đặt và kho ở trạng thái có thể xây dựng được.

Sau khi xây dựng hoàn tất, tệp đóng gói mặc định nằm tại `storage/tar/@my-project/plugin-hello.tar.gz`.

## Bước 5: Tải lên ứng dụng NocoBase khác

Tải lên và giải nén vào thư mục `./storage/plugins` của ứng dụng đích. Để biết chi tiết, hãy xem [Cài đặt và nâng cấp plugin](../get-started/install-upgrade-plugins.mdx).