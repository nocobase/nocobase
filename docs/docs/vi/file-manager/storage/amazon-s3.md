:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Công cụ lưu trữ: Amazon S3

Đây là công cụ lưu trữ dựa trên Amazon S3. Trước khi sử dụng, bạn cần chuẩn bị tài khoản và các quyền liên quan.

## Tham số cấu hình

![Amazon S3 Storage Engine Configuration Example](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Lưu ý}
Phần này chỉ giới thiệu các tham số dành riêng cho công cụ lưu trữ Amazon S3. Để biết các tham số chung, vui lòng tham khảo [Tham số chung của công cụ](./index#引擎通用参数).
:::

### Vùng (Region)

Nhập vùng lưu trữ S3, ví dụ: `us-west-1`.

:::info{title=Lưu ý}
Bạn có thể xem thông tin vùng của bộ chứa (bucket) trong [bảng điều khiển Amazon S3](https://console.aws.amazon.com/s3/). Bạn chỉ cần sử dụng tiền tố vùng (không cần tên miền đầy đủ).
:::

### AccessKey ID

Nhập ID của khóa truy cập ủy quyền Amazon S3.

### AccessKey Secret

Nhập Secret của khóa truy cập ủy quyền Amazon S3.

### Tên bộ chứa (Bucket)

Nhập tên bộ chứa S3.