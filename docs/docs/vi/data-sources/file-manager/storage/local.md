:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Lưu trữ cục bộ

Các tệp được tải lên sẽ được lưu trữ trong một thư mục cục bộ trên máy chủ. Điều này phù hợp với các kịch bản quy mô nhỏ hoặc thử nghiệm, nơi tổng số tệp được hệ thống quản lý tương đối ít.

## Các tùy chọn

![Ví dụ về các tùy chọn của công cụ lưu trữ tệp](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Lưu ý}
Phần này chỉ đề cập đến các tùy chọn dành riêng cho công cụ lưu trữ cục bộ. Để biết các tham số chung, vui lòng tham khảo [Tham số công cụ chung](./index.md#general-engine-parameters).
:::

### Đường dẫn

Đường dẫn thể hiện cả đường dẫn tương đối của tệp được lưu trữ trên máy chủ và đường dẫn truy cập URL. Ví dụ, '`user/avatar`' (không có dấu '`/`' ở đầu và cuối) đại diện cho:

1. Đường dẫn tương đối của tệp được tải lên khi lưu trữ trên máy chủ: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Tiền tố URL để truy cập tệp: `http://localhost:13000/storage/uploads/user/avatar`.