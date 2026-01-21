:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan về bộ sưu tập

NocoBase cung cấp một DSL đặc thù để mô tả cấu trúc dữ liệu, được gọi là **bộ sưu tập**. Điều này giúp thống nhất cấu trúc dữ liệu từ nhiều nguồn khác nhau, tạo nền tảng vững chắc cho việc quản lý, phân tích và ứng dụng dữ liệu sau này.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Để thuận tiện sử dụng các mô hình dữ liệu khác nhau, NocoBase hỗ trợ tạo nhiều loại **bộ sưu tập**:

- [Bộ sưu tập thông thường](/data-sources/data-source-main/general-collection): Tích hợp sẵn các trường hệ thống phổ biến.
- [Bộ sưu tập kế thừa](/data-sources/data-source-main/inheritance-collection): Bạn có thể tạo một bộ sưu tập cha, sau đó tạo bộ sưu tập con từ bộ sưu tập cha đó. Bộ sưu tập con sẽ kế thừa cấu trúc của bộ sưu tập cha và có thể định nghĩa thêm các cột riêng của mình.
- [Bộ sưu tập dạng cây](/data-sources/collection-tree): Bộ sưu tập có cấu trúc dạng cây, hiện tại chỉ hỗ trợ thiết kế danh sách kề (adjacency list).
- [Bộ sưu tập lịch](/data-sources/calendar/calendar-collection): Dùng để tạo các bộ sưu tập sự kiện liên quan đến lịch.
- [Bộ sưu tập tệp](/data-sources/file-manager/file-collection): Dùng để quản lý lưu trữ tệp.
- : Dùng cho các kịch bản biểu thức động trong **luồng công việc**.
- [Bộ sưu tập SQL](/data-sources/collection-sql): Không phải là một bộ sưu tập cơ sở dữ liệu thực tế, mà là cách nhanh chóng để hiển thị các truy vấn SQL một cách có cấu trúc.
- [Bộ sưu tập dạng View](/data-sources/collection-view): Kết nối với các view cơ sở dữ liệu hiện có.
- [Bộ sưu tập bên ngoài](/data-sources/collection-fdw): Cho phép hệ thống cơ sở dữ liệu truy cập và truy vấn trực tiếp dữ liệu trong các **nguồn dữ liệu** bên ngoài, dựa trên công nghệ FDW.