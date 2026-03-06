---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/multi-space/multi-app).
:::

# Đa ứng dụng (Multi-app)


## Giới thiệu

**Plugin Đa ứng dụng (Multi-app)** cho phép tạo và quản lý động nhiều ứng dụng độc lập mà không cần triển khai riêng biệt. Mỗi ứng dụng con là một phiên bản hoàn toàn độc lập, sở hữu cơ sở dữ liệu, plugin và cấu hình riêng.

#### Các kịch bản áp dụng
- **Đa người thuê (Multi-tenancy)**: Cung cấp các phiên bản ứng dụng độc lập, nơi mỗi khách hàng có dữ liệu, cấu hình plugin và hệ thống phân quyền riêng.
- **Hệ thống chính và hệ thống con cho các lĩnh vực kinh doanh khác nhau**: Một hệ thống lớn bao gồm nhiều ứng dụng nhỏ được triển khai độc lập.


:::warning
Bản thân plugin Đa ứng dụng không cung cấp khả năng chia sẻ người dùng.  
Nếu cần kết nối người dùng giữa các ứng dụng, bạn có thể kết hợp sử dụng với **[Plugin Xác thực](/auth-verification)**.
:::


## Cài đặt

Tìm plugin **Đa ứng dụng (Multi-app)** trong trình quản lý plugin và kích hoạt nó.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Hướng dẫn sử dụng


### Tạo ứng dụng con

Trong menu cài đặt hệ thống, nhấp vào "Đa ứng dụng" để vào trang quản lý đa ứng dụng:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Nhấp vào nút "Thêm mới" để tạo một ứng dụng con mới:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Giải thích các trường trong biểu mẫu

* **Tên (Name)**: Mã định danh của ứng dụng con, là duy nhất trên toàn hệ thống.
* **Tên hiển thị (Display Name)**: Tên của ứng dụng con hiển thị trên giao diện.
* **Chế độ khởi động (Startup Mode)**:
  * **Khởi động khi truy cập lần đầu**: Ứng dụng con chỉ khởi động khi người dùng truy cập qua URL lần đầu tiên.
  * **Khởi động cùng lúc với ứng dụng chính**: Ứng dụng con sẽ khởi động đồng thời khi ứng dụng chính khởi động (điều này sẽ làm tăng thời gian khởi động của ứng dụng chính).
* **Cổng (Port)**: Số cổng được ứng dụng con sử dụng khi vận hành.
* **Tên miền tùy chỉnh (Custom Domain)**: Cấu hình tên miền con độc lập cho ứng dụng con.
* **Ghim vào menu (Pin to Menu)**: Ghim lối vào ứng dụng con ở phía bên trái của thanh điều hướng trên cùng.
* **Kết nối cơ sở dữ liệu (Database Connection)**: Dùng để cấu hình nguồn dữ liệu cho ứng dụng con, hỗ trợ ba phương thức:
  * **Cơ sở dữ liệu mới**: Sử dụng lại dịch vụ dữ liệu hiện tại để tạo một cơ sở dữ liệu độc lập.
  * **Kết nối dữ liệu mới**: Cấu hình một dịch vụ cơ sở dữ liệu hoàn toàn mới.
  * **Chế độ Schema**: Tạo một Schema độc lập cho ứng dụng con trong PostgreSQL.
* **Nâng cấp (Upgrade)**: Nếu cơ sở dữ liệu được kết nối chứa cấu trúc dữ liệu NocoBase phiên bản cũ, nó sẽ tự động được nâng cấp lên phiên bản hiện tại.


### Chạy và dừng ứng dụng con

Nhấp vào nút **Khởi động** để chạy ứng dụng con.  
> Nếu khi tạo bạn đã chọn *"Khởi động khi truy cập lần đầu"*, ứng dụng sẽ tự động khởi động trong lần truy cập đầu tiên.

Nhấp vào nút **Xem** để mở ứng dụng con trong một tab mới.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Trạng thái vận hành và nhật ký

Trong danh sách, bạn có thể xem mức tiêu thụ bộ nhớ và CPU của từng ứng dụng.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Nhấp vào nút **Nhật ký** để xem nhật ký vận hành của ứng dụng con.  
> Nếu ứng dụng con không thể truy cập sau khi khởi động (ví dụ: do lỗi cơ sở dữ liệu), bạn có thể kiểm tra thông qua nhật ký.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Xóa ứng dụng con

Nhấp vào nút **Xóa** để gỡ bỏ ứng dụng con.  
> Khi xóa, bạn có thể chọn có xóa cả cơ sở dữ liệu hay không. Vui lòng cẩn trọng, thao tác này không thể hoàn tác.


### Truy cập ứng dụng con
Mặc định sử dụng `/_app/:appName/admin/` để truy cập ứng dụng con, ví dụ:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Đồng thời, bạn cũng có thể cấu hình tên miền con độc lập cho ứng dụng con. Bạn cần trỏ tên miền về IP hiện tại, và nếu sử dụng Nginx, bạn cũng cần thêm tên miền vào cấu hình Nginx.


### Quản lý ứng dụng con qua dòng lệnh (CLI)

Tại thư mục gốc của dự án, bạn có thể sử dụng dòng lệnh thông qua **PM2** để quản lý các phiên bản ứng dụng con:

```bash
yarn nocobase pm2 list              # Xem danh sách các phiên bản đang chạy
yarn nocobase pm2 stop [appname]    # Dừng một tiến trình ứng dụng con cụ thể
yarn nocobase pm2 delete [appname]  # Xóa một tiến trình ứng dụng con cụ thể
yarn nocobase pm2 kill              # Cưỡng bức chấm dứt tất cả các tiến trình đã khởi động (có thể bao gồm cả phiên bản ứng dụng chính)
```

### Di chuyển dữ liệu từ phiên bản đa ứng dụng cũ

Truy cập trang quản lý đa ứng dụng cũ, nhấp vào nút **Di chuyển dữ liệu sang Đa ứng dụng mới** để thực hiện di chuyển dữ liệu.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Câu hỏi thường gặp

#### 1. Quản lý plugin
Các plugin mà ứng dụng con có thể sử dụng giống hệt với ứng dụng chính (bao gồm cả phiên bản), nhưng chúng có thể được cấu hình và sử dụng độc lập.

#### 2. Cách ly cơ sở dữ liệu
Ứng dụng con có thể cấu hình cơ sở dữ liệu độc lập. Nếu muốn chia sẻ dữ liệu giữa các ứng dụng, bạn có thể thực hiện thông qua nguồn dữ liệu bên ngoài.

#### 3. Sao lưu và di chuyển dữ liệu
Hiện tại, việc sao lưu dữ liệu trên ứng dụng chính không bao gồm dữ liệu của ứng dụng con (chỉ bao gồm thông tin cơ bản của ứng dụng con). Việc sao lưu và di chuyển dữ liệu cần được thực hiện thủ công bên trong từng ứng dụng con.

#### 4. Triển khai và cập nhật
Phiên bản của ứng dụng con sẽ tự động cập nhật theo ứng dụng chính, đảm bảo sự nhất quán về phiên bản giữa ứng dụng chính và ứng dụng con.

#### 5. Quản lý tài nguyên
Mức tiêu thụ tài nguyên của mỗi ứng dụng con cơ bản giống với ứng dụng chính. Hiện tại, mức chiếm dụng bộ nhớ của một ứng dụng đơn lẻ rơi vào khoảng 500-600MB.