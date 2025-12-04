:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tencent COS

Đây là công cụ lưu trữ dựa trên Tencent Cloud COS. Trước khi sử dụng, bạn cần chuẩn bị tài khoản và các quyền truy cập liên quan.

## Tham số cấu hình

![Ví dụ về cấu hình công cụ lưu trữ Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Lưu ý}
Phần này chỉ giới thiệu các tham số dành riêng cho công cụ lưu trữ Tencent Cloud COS. Đối với các tham số chung, vui lòng tham khảo [Tham số công cụ chung](./index.md#common-engine-parameters).
:::

### Khu vực

Điền khu vực lưu trữ COS, ví dụ: `ap-chengdu`.

:::info{title=Lưu ý}
Bạn có thể xem thông tin khu vực của bộ chứa lưu trữ trong [Bảng điều khiển Tencent Cloud COS](https://console.cloud.tencent.com/cos), và chỉ cần lấy phần tiền tố của khu vực (không cần tên miền đầy đủ).
:::

### SecretId

Điền ID của khóa truy cập được ủy quyền của Tencent Cloud.

### SecretKey

Điền Secret của khóa truy cập được ủy quyền của Tencent Cloud.

### Bộ chứa

Điền tên bộ chứa COS, ví dụ: `qing-cdn-1234189398`.