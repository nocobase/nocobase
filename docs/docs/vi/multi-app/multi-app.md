---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Đa ứng dụng


## Giới thiệu

**Plugin Đa ứng dụng (Multi-App)** cho phép bạn tạo và quản lý động nhiều ứng dụng độc lập mà không cần triển khai riêng lẻ. Mỗi ứng dụng con là một phiên bản hoàn toàn độc lập, với cơ sở dữ liệu, plugin và cấu hình riêng.

#### Các trường hợp sử dụng
- **Đa người thuê**: Cung cấp các phiên bản ứng dụng độc lập, trong đó mỗi khách hàng có dữ liệu, cấu hình plugin và hệ thống quyền riêng.
- **Hệ thống chính và hệ thống con cho các lĩnh vực kinh doanh khác nhau**: Một hệ thống lớn được cấu thành từ nhiều ứng dụng nhỏ được triển khai độc lập.


:::warning
Plugin Đa ứng dụng bản thân nó không cung cấp khả năng chia sẻ người dùng.  
Nếu bạn cần tích hợp người dùng giữa các ứng dụng, bạn có thể sử dụng kết hợp với **[plugin Xác thực](/auth-verification)**.
:::


## Cài đặt

Trong trình quản lý plugin, tìm plugin **Đa ứng dụng (Multi-app)** và kích hoạt nó.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Hướng dẫn sử dụng


### Tạo ứng dụng con

Trong menu cài đặt hệ thống, nhấp vào "Đa ứng dụng" để vào trang quản lý đa ứng dụng:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Nhấp vào nút "Thêm mới" để tạo một ứng dụng con mới:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Mô tả các trường biểu mẫu

* **Tên**: Mã định danh ứng dụng con, duy nhất trên toàn cầu.  
* **Tên hiển thị**: Tên của ứng dụng con được hiển thị trên giao diện.  
* **Chế độ khởi động**:
  * **Khởi động khi truy cập lần đầu**: Ứng dụng con chỉ khởi động khi người dùng truy cập lần đầu qua URL;
  * **Khởi động cùng ứng dụng chính**: Ứng dụng con khởi động cùng lúc với ứng dụng chính (điều này sẽ làm tăng thời gian khởi động của ứng dụng chính).
* **Cổng**: Số cổng được ứng dụng con sử dụng khi chạy.  
* **Tên miền tùy chỉnh**: Cấu hình một tên miền con độc lập cho ứng dụng con.  
* **Ghim vào menu**: Ghim lối vào ứng dụng con hiển thị ở phía bên trái của thanh điều hướng trên cùng.  
* **Kết nối cơ sở dữ liệu**: Dùng để cấu hình nguồn dữ liệu cho ứng dụng con, hỗ trợ ba phương thức sau:
  * **Cơ sở dữ liệu mới**: Tái sử dụng dịch vụ dữ liệu hiện tại để tạo cơ sở dữ liệu độc lập;
  * **Kết nối dữ liệu mới**: Cấu hình một dịch vụ cơ sở dữ liệu hoàn toàn mới;
  * **Chế độ Schema**: Tạo một Schema độc lập cho ứng dụng con trong PostgreSQL.
* **Nâng cấp**: Nếu cơ sở dữ liệu được kết nối chứa cấu trúc dữ liệu NocoBase phiên bản cũ hơn, nó sẽ tự động được nâng cấp lên phiên bản hiện tại.


### Khởi động và dừng ứng dụng con

Nhấp vào nút **Khởi động** để khởi động ứng dụng con;  
> Nếu trong quá trình tạo bạn đã chọn *"Khởi động khi truy cập lần đầu"*, thì ứng dụng sẽ tự động khởi động khi có lượt truy cập đầu tiên.  

Nhấp vào nút **Xem**, ứng dụng con sẽ được mở trong một tab mới.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Trạng thái và nhật ký ứng dụng con

Trong danh sách, bạn có thể xem mức sử dụng bộ nhớ và CPU của mỗi ứng dụng.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Nhấp vào nút **Nhật ký**, bạn có thể xem nhật ký chạy của ứng dụng con.  
> Nếu ứng dụng con không thể truy cập sau khi khởi động (ví dụ: do cơ sở dữ liệu bị hỏng), bạn có thể sử dụng nhật ký để khắc phục sự cố.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Xóa ứng dụng con

Nhấp vào nút **Xóa** để gỡ bỏ ứng dụng con.  
> Khi xóa, bạn có thể chọn có xóa cả cơ sở dữ liệu hay không. Vui lòng thao tác cẩn thận, vì hành động này không thể hoàn tác.


### Truy cập ứng dụng con
Mặc định, ứng dụng con được truy cập bằng `/_app/:appName/admin/`, ví dụ:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Đồng thời, bạn cũng có thể cấu hình một tên miền con độc lập cho ứng dụng con. Bạn cần phân giải tên miền về địa chỉ IP hiện tại, và nếu bạn sử dụng Nginx, bạn cũng cần thêm tên miền vào cấu hình Nginx.


### Quản lý ứng dụng con qua dòng lệnh

Trong thư mục gốc của dự án, bạn có thể sử dụng dòng lệnh để quản lý các phiên bản ứng dụng con thông qua **PM2**:

```bash
yarn nocobase pm2 list              # Xem danh sách các phiên bản đang chạy hiện tại
yarn nocobase pm2 stop [appname]    # Dừng một tiến trình ứng dụng con cụ thể
yarn nocobase pm2 delete [appname]  # Xóa một tiến trình ứng dụng con cụ thể
yarn nocobase pm2 kill              # Buộc chấm dứt tất cả các tiến trình đã khởi động (có thể bao gồm phiên bản của ứng dụng chính)
```

### Di chuyển dữ liệu từ Đa ứng dụng cũ

Truy cập trang quản lý đa ứng dụng cũ và nhấp vào nút **Di chuyển dữ liệu sang đa ứng dụng mới** để di chuyển dữ liệu.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Các câu hỏi thường gặp

#### 1. Quản lý plugin
Các ứng dụng con có thể sử dụng các plugin giống như ứng dụng chính (bao gồm cả phiên bản), nhưng chúng có thể được cấu hình và sử dụng độc lập.

#### 2. Cách ly cơ sở dữ liệu
Các ứng dụng con có thể được cấu hình với cơ sở dữ liệu độc lập. Nếu bạn muốn chia sẻ dữ liệu giữa các ứng dụng, bạn có thể thực hiện thông qua các nguồn dữ liệu bên ngoài.

#### 3. Sao lưu và di chuyển dữ liệu
Hiện tại, việc sao lưu dữ liệu trên ứng dụng chính không hỗ trợ bao gồm dữ liệu của ứng dụng con (chỉ bao gồm thông tin cơ bản của ứng dụng con). Bạn cần sao lưu và di chuyển dữ liệu thủ công trong từng ứng dụng con.

#### 4. Triển khai và cập nhật
Phiên bản của ứng dụng con sẽ tự động được nâng cấp cùng với ứng dụng chính, đảm bảo tính nhất quán phiên bản giữa ứng dụng chính và ứng dụng con.

#### 5. Quản lý tài nguyên
Mức tiêu thụ tài nguyên của mỗi ứng dụng con về cơ bản là giống với ứng dụng chính. Hiện tại, một ứng dụng đơn lẻ sử dụng khoảng 500-600MB bộ nhớ.