# Multi-portal, Multi-app và Multi-space

NocoBase cung cấp ba khả năng: Multi-portal, Multi-app và Multi-space.

Chúng giải quyết các vấn đề ở những chiều khác nhau và có thể được sử dụng riêng lẻ hoặc kết hợp với nhau.

## Khác biệt chính

| Khả năng | Multi-portal | Multi-app | Multi-space |
|------|------|------|------|
| Giải quyết vấn đề gì | Cung cấp nhiều điểm truy cập | Chia nghiệp vụ thành nhiều hệ thống | Cô lập dữ liệu nghiệp vụ |
| Trọng tâm chính | Người dùng vào từ đâu | Hệ thống được chia như thế nào | Dữ liệu thuộc về ai |
| Dữ liệu | Dùng chung | Độc lập theo mặc định | Cô lập |
| Trang và menu | Độc lập | Độc lập | Dùng chung |
| Cấu hình plugin | Dùng chung | Độc lập | Dùng chung |
| Hệ thống người dùng | Dùng chung | Có thể dùng chung qua SSO | Dùng chung |
| Tình huống điển hình | Các vai trò khác nhau cần điểm vào khác nhau | Các mảng nghiệp vụ khác nhau cần quản lý độc lập | Nhiều tổ chức, cửa hàng hoặc tenant |
| Có thể kết hợp | Có | Có | Có |

## Multi-portal

Multi-portal cung cấp nhiều điểm truy cập trong cùng một ứng dụng.

Ví dụ:

```text
Ứng dụng ERP

├─ Portal quản trị (/v/admin)
├─ Portal cửa hàng (/v/store)
├─ Portal nhà phân phối (/v/dealer)
└─ Portal di động (/v/mobile)
```

Đặc điểm:

- Dùng cùng một ứng dụng
- Chia sẻ cùng một bộ dữ liệu
- Chia sẻ cấu hình plugin
- Trang và menu có thể được cấu hình độc lập

Phù hợp với các tình huống mà các vai trò khác nhau cần các điểm vào khác nhau, ví dụ:

- Quản trị viên
- Nhân viên
- Khách hàng
- Nhà phân phối

## Multi-app

Multi-app chia nghiệp vụ thành nhiều ứng dụng độc lập.

Ví dụ:

```text
Hệ thống tập đoàn

├─ CRM
├─ ERP
├─ OA
└─ Phân tích
```

Đặc điểm:

- Mỗi ứng dụng được quản lý độc lập
- Cấu hình plugin độc lập
- Kết nối cơ sở dữ liệu độc lập
- Nâng cấp và bảo trì độc lập

Phù hợp với:

- Tách các hệ thống nghiệp vụ lớn
- Phát triển cộng tác bởi nhiều nhóm
- Tạo hàng loạt ứng dụng cho nền tảng SaaS
- Ứng dụng độc lập cho các khách hàng khác nhau

## Multi-space

Multi-space cô lập dữ liệu nghiệp vụ trong cùng một ứng dụng.

Ví dụ:

```text
Ứng dụng quản lý cửa hàng

Không gian
├─ Cửa hàng Bắc Kinh
├─ Cửa hàng Thượng Hải
└─ Cửa hàng Thâm Quyến
```

Đặc điểm:

- Trang dùng chung
- Menu dùng chung
- Quy trình dùng chung
- Cấu hình dùng chung
- Dữ liệu cô lập

Đối với các bảng có bật trường không gian, hệ thống sẽ tự động lọc dữ liệu theo không gian hiện tại.

Từ góc nhìn người dùng:

- Cửa hàng Bắc Kinh chỉ có thể xem dữ liệu của Bắc Kinh
- Cửa hàng Thượng Hải chỉ có thể xem dữ liệu của Thượng Hải
- Cửa hàng Thâm Quyến chỉ có thể xem dữ liệu của Thâm Quyến

Nhưng tất cả các cửa hàng vẫn sử dụng cùng một hệ thống.

## Mối quan hệ giữa ba khả năng

Ba khả năng này không xung đột với nhau. Chúng hoạt động ở các chiều khác nhau.

Chúng có thể được sử dụng cùng nhau:

```text
Hệ thống tập đoàn

Ứng dụng CRM
├─ Portal quản trị
├─ Portal bán hàng
└─ Portal khách hàng

Không gian
├─ Chi nhánh Bắc Kinh
├─ Chi nhánh Thượng Hải
└─ Chi nhánh Thâm Quyến
```

Về mặt khái niệm:

```text
Portal
    ↓
Người dùng vào hệ thống từ đâu

Ứng dụng
    ↓
Hệ thống được chia như thế nào

Không gian
    ↓
Dữ liệu thuộc về ai
```

## Cách lựa chọn

Nếu bạn chỉ muốn cung cấp các điểm vào khác nhau cho các vai trò khác nhau, hãy chọn **Multi-portal**.

Nếu bạn muốn chia nghiệp vụ thành nhiều hệ thống độc lập, hãy chọn **Multi-app**.

Nếu bạn muốn cô lập dữ liệu của các tổ chức hoặc tenant khác nhau trong cùng một hệ thống, hãy chọn **Multi-space**.

Trong các dự án thực tế, ba khả năng này thường được dùng kết hợp thay vì thay thế lẫn nhau.

Tóm lại:

> Multi-portal giải quyết vấn đề điểm vào, Multi-app giải quyết việc chia tách hệ thống, và Multi-space giải quyết việc cô lập dữ liệu.
