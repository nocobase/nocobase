:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tencent Cloud COS

Công cụ lưu trữ dựa trên Tencent Cloud COS. Trước khi sử dụng, bạn cần chuẩn bị tài khoản và các quyền liên quan.

## Tham số cấu hình

![Ví dụ cấu hình công cụ lưu trữ Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Lưu ý}
Phần này chỉ giới thiệu các tham số dành riêng cho công cụ lưu trữ Tencent Cloud COS. Để biết các tham số chung, vui lòng tham khảo [Tham số chung của công cụ](./index.md#tham-số-chung-của-công-cụ).
:::

### Khu vực

Nhập khu vực lưu trữ COS, ví dụ: `ap-chengdu`.

:::info{title=Lưu ý}
Bạn có thể xem thông tin khu vực của bộ chứa trong [Bảng điều khiển Tencent Cloud COS](https://console.cloud.tencent.com/cos). Bạn chỉ cần sử dụng tiền tố khu vực (không cần tên miền đầy đủ).
:::

### SecretId

Nhập ID của khóa truy cập được ủy quyền của Tencent Cloud.

### SecretKey

Nhập Secret của khóa truy cập được ủy quyền của Tencent Cloud.

### Bộ chứa

Nhập tên bộ chứa lưu trữ COS, ví dụ: `qing-cdn-1234189398`.