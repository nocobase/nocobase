---
title: 'Tài liệu tham khảo cho lập trình viên'
description: 'Tích hợp trang thư, quyền và tác vụ nền.'
---

# Tài liệu tham khảo cho lập trình viên

Mail có thể là một không gian làm việc độc lập hoặc là một phần của trang khách hàng và dự án. Ứng dụng sở hữu các lối vào trang, cấu hình nhà cung cấp và liên kết nghiệp vụ. Mail cung cấp năng lực tài khoản, gửi thư và đồng bộ.

## Tích hợp trang

`@nocobase/app-plugin-mail/client` export hai component trang hoàn chỉnh:

| Component           | Mục đích                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `MailWorkspacePage` | Danh sách thư, đọc, soạn và trả lời.                   |
| `MailAccountsPage`  | Kết nối hộp thư, quản lý tài khoản, chữ ký và mẫu thư. |

Gắn các trang vào route của ứng dụng và thêm mục điều hướng. Để tự kết hợp giao diện, hãy dùng các component công khai từ `@nocobase/app-plugin-mail/client/components`.

Trang trung tâm thư có thể tái sử dụng trực tiếp không gian làm việc:

```tsx
export { MailWorkspacePage as default } from '@nocobase/app-plugin-mail/client';
```

## Kết nối dữ liệu nghiệp vụ

Ứng dụng định nghĩa liên kết giữa thư và bản ghi nghiệp vụ. Ví dụ, khớp thư từ với khách hàng theo email liên hệ, hoặc điền tên và tiến độ dự án vào mẫu thư dự án. Hãy chỉ rõ các trường dùng để khớp, nguồn người nhận và việc gửi có cần xác nhận không.

Dùng `useMailClient()` cho các thao tác phía client và `mailServiceToken` cho dịch vụ phía server. Tham khảo tài liệu OpenAPI của ứng dụng để biết hợp đồng request và response HTTP.

## Cấu hình quyền truy cập

| Tài nguyên          | Mục đích                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `mail.workspace`  | Không gian làm việc thư cá nhân.                                                 |
| `mail.admin`      | Tổng quan tài khoản cho quản trị và bản ghi gửi thư, đồng bộ. |
| `mail.management` | Quản lý thư của nhiều người dùng.                                              |

Các thao tác trên tài khoản và thư cá nhân kiểm tra quyền sở hữu tài khoản. Hãy cấp các quyền liên quan cho vai trò của ứng dụng và khai báo riêng quy tắc truy cập cho các trang nghiệp vụ.

## Nhà cung cấp và tác vụ nền

Đăng ký Mail ở server và client, đồng thời đưa configuration factory của nó vào cấu hình ứng dụng. Duy trì thiết lập nhà cung cấp trong `mail.providers`. Gửi thư và đồng bộ dùng tác vụ nền. Hãy giữ executor luôn chạy và dùng backend job dùng chung khi có nhiều instance.

OAuth còn cần URL callback công khai và trang quay lại. Về giới hạn của IMAP/SMTP, xem [Cấu hình hộp thư](./configuration.md#khác-biệt-giữa-các-cách-tích-hợp).

Về prompt cho chữ ký, mẫu thư và trang nghiệp vụ, xem [Các tính năng Mail khác](./usage.md).
