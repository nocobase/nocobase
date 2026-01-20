:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Công cụ lưu trữ: Aliyun OSS

Đây là một công cụ lưu trữ dựa trên Aliyun OSS. Trước khi sử dụng, bạn cần chuẩn bị tài khoản và các quyền truy cập liên quan.

## Thông số cấu hình

![Ví dụ cấu hình công cụ lưu trữ Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Lưu ý}
Phần này chỉ giới thiệu các thông số dành riêng cho công cụ lưu trữ Aliyun OSS. Để biết các thông số chung, vui lòng tham khảo [Thông số công cụ chung](./index#引擎通用参数).
:::

### Khu vực

Nhập khu vực lưu trữ OSS, ví dụ: `oss-cn-hangzhou`.

:::info{title=Lưu ý}
Bạn có thể xem thông tin khu vực của bộ chứa (bucket) trong [Bảng điều khiển Aliyun OSS](https://oss.console.aliyun.com/). Bạn chỉ cần lấy phần tiền tố khu vực (không cần tên miền đầy đủ).
:::

### AccessKey ID

Nhập ID của khóa truy cập được ủy quyền của Aliyun.

### AccessKey Secret

Nhập Secret của khóa truy cập được ủy quyền của Aliyun.

### Bộ chứa

Nhập tên bộ chứa OSS.

### Thời gian chờ

Nhập thời gian chờ khi tải lên Aliyun OSS, đơn vị là mili giây. Mặc định là `60000` mili giây (tức 60 giây).