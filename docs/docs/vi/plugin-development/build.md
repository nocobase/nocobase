:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Xây dựng

## Cấu hình đóng gói tùy chỉnh

Nếu bạn muốn tùy chỉnh cấu hình đóng gói, bạn có thể tạo một tệp `build.config.ts` trong thư mục gốc của plugin với nội dung như sau:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite được sử dụng để đóng gói mã nguồn phía client (src/client)

    // Để sửa đổi cấu hình Vite, bạn có thể tham khảo tại: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup được sử dụng để đóng gói mã nguồn phía server (src/server)

    // Để sửa đổi cấu hình tsup, bạn có thể tham khảo tại: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Hàm callback này sẽ chạy trước khi quá trình đóng gói bắt đầu, cho phép bạn thực hiện một số thao tác tiền đóng gói.
  },
  afterBuild: (log: PkgLog) => {
    // Hàm callback này sẽ chạy sau khi quá trình đóng gói hoàn tất, cho phép bạn thực hiện một số thao tác hậu đóng gói.
  };
});
```