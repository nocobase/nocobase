:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quản lý Phát hành

## Giới thiệu

Trong các ứng dụng thực tế, để đảm bảo an toàn dữ liệu và ứng dụng hoạt động ổn định, chúng ta thường triển khai nhiều môi trường, ví dụ như môi trường phát triển (development), môi trường tiền phát hành (pre-release) và môi trường sản phẩm (production). Tài liệu này sẽ trình bày chi tiết cách triển khai quản lý phát hành trong NocoBase, lấy ví dụ từ hai quy trình phát triển không mã phổ biến.

## Cài đặt

Ba plugin sau đây là cần thiết cho việc quản lý phát hành. Hãy đảm bảo rằng bạn đã kích hoạt tất cả các plugin này.

### Biến môi trường và Khóa bí mật

- Là một plugin tích hợp sẵn, được cài đặt và kích hoạt mặc định.
- Cung cấp khả năng cấu hình và quản lý tập trung các biến môi trường và khóa bí mật, dùng để lưu trữ dữ liệu nhạy cảm, tái sử dụng dữ liệu cấu hình, cách ly cấu hình môi trường, v.v. ([Xem tài liệu](#)).

### Quản lý Sao lưu

- Plugin này chỉ khả dụng trong phiên bản Professional trở lên ([Tìm hiểu thêm](https://www.nocobase.com/en/commercial)).
- Cung cấp chức năng sao lưu và khôi phục, hỗ trợ sao lưu định kỳ, đảm bảo an toàn dữ liệu và khôi phục nhanh chóng. ([Xem tài liệu](../backup-manager/index.mdx)).

### Quản lý Di chuyển

- Plugin này chỉ khả dụng trong phiên bản Professional trở lên ([Tìm hiểu thêm](https://www.nocobase.com/en/commercial)).
- Dùng để di chuyển cấu hình ứng dụng từ môi trường ứng dụng này sang môi trường ứng dụng khác. ([Xem tài liệu](../migration-manager/index.md)).

## Các Quy trình Phát triển Không mã Phổ biến

### Một môi trường phát triển, phát hành một chiều

Cách tiếp cận này phù hợp với các quy trình phát triển đơn giản. Mỗi môi trường phát triển, tiền phát hành và sản phẩm chỉ có một. Các thay đổi sẽ được phát hành tuần tự từ môi trường phát triển sang môi trường tiền phát hành, và cuối cùng được triển khai đến môi trường sản phẩm. Trong quy trình này, chỉ môi trường phát triển mới được phép sửa đổi cấu hình; môi trường tiền phát hành và môi trường sản phẩm đều không cho phép sửa đổi.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Khi cấu hình các quy tắc di chuyển, hãy chọn quy tắc "Ưu tiên Ghi đè" (Overwrite) cho các bảng tích hợp sẵn của nhân hệ thống và các plugin. Đối với các bảng khác, bạn có thể giữ cài đặt mặc định nếu không có yêu cầu đặc biệt nào.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Nhiều môi trường phát triển, phát hành hợp nhất

Cách tiếp cận này phù hợp với các dự án phức tạp hoặc có nhiều người cộng tác. Nhiều môi trường phát triển song song có thể hoạt động độc lập, tất cả các thay đổi sẽ được hợp nhất vào một môi trường tiền phát hành để kiểm thử và xác minh, sau đó mới phát hành đến môi trường sản phẩm. Trong quy trình này, cũng chỉ môi trường phát triển mới được phép sửa đổi cấu hình; môi trường tiền phát hành và môi trường sản phẩm đều không cho phép sửa đổi.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Khi cấu hình các quy tắc di chuyển, hãy chọn quy tắc "Ưu tiên Chèn hoặc Cập nhật" (Insert or Update) cho các bảng tích hợp sẵn của nhân hệ thống và các plugin. Đối với các bảng khác, bạn có thể giữ cài đặt mặc định nếu không có yêu cầu đặc biệt nào.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Hoàn tác

Trước khi thực hiện di chuyển, hệ thống sẽ tự động tạo một bản sao lưu của ứng dụng hiện tại. Nếu quá trình di chuyển thất bại hoặc kết quả không như mong đợi, bạn có thể hoàn tác và khôi phục thông qua [Quản lý Sao lưu](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)