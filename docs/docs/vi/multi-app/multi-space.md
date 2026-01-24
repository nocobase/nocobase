---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Đa không gian

## Giới thiệu

**Plugin Đa không gian** cho phép tạo nhiều không gian dữ liệu độc lập thông qua cách ly logic trong một phiên bản ứng dụng duy nhất.

#### Trường hợp sử dụng
- **Nhiều cửa hàng hoặc nhà máy**: Các quy trình kinh doanh và cấu hình hệ thống có tính nhất quán cao, ví dụ như quản lý kho hàng, kế hoạch sản xuất, chiến lược bán hàng và mẫu báo cáo thống nhất, nhưng cần đảm bảo dữ liệu của mỗi đơn vị kinh doanh không bị ảnh hưởng lẫn nhau.
- **Quản lý nhiều tổ chức hoặc công ty con**: Nhiều tổ chức hoặc công ty con thuộc một tập đoàn cùng sử dụng một nền tảng, nhưng mỗi thương hiệu lại có dữ liệu khách hàng, sản phẩm và đơn hàng độc lập.

## Cài đặt

Tìm **plugin Đa không gian (Multi-Space)** trong trình quản lý plugin và kích hoạt.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Hướng dẫn sử dụng

### Quản lý đa không gian

Sau khi kích hoạt plugin, truy cập trang cài đặt **"Người dùng & Quyền hạn"**, sau đó chuyển sang bảng điều khiển **Không gian** để quản lý các không gian.

> Ban đầu, sẽ có một **Không gian chưa được gán (Unassigned Space)** tích hợp sẵn, chủ yếu dùng để xem các dữ liệu cũ chưa được liên kết với bất kỳ không gian nào.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Tạo không gian

Nhấp vào nút "Thêm không gian" để tạo một không gian mới:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Gán người dùng

Sau khi chọn một không gian đã tạo, bạn có thể thiết lập người dùng thuộc không gian đó ở phía bên phải:

> **Mẹo:** Sau khi gán người dùng vào một không gian, bạn cần **làm mới trang thủ công** để danh sách chuyển đổi không gian ở góc trên bên phải cập nhật và hiển thị không gian mới nhất.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Chuyển đổi và xem đa không gian

Bạn có thể chuyển đổi không gian hiện tại ở góc trên bên phải.
Khi bạn nhấp vào **biểu tượng con mắt** ở bên phải (trong trạng thái được tô sáng), bạn có thể xem dữ liệu từ nhiều không gian cùng lúc.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Quản lý dữ liệu đa không gian

Sau khi kích hoạt plugin, hệ thống sẽ tự động thêm một **trường Không gian** khi tạo một **bộ sưu tập**.
**Chỉ những bộ sưu tập có chứa trường này mới được đưa vào logic quản lý không gian.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Đối với các **bộ sưu tập** hiện có, bạn có thể thêm trường Không gian thủ công để kích hoạt quản lý không gian:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logic mặc định

Trong các **bộ sưu tập** có chứa trường Không gian, hệ thống sẽ tự động áp dụng logic sau:

1. Khi tạo dữ liệu, dữ liệu sẽ tự động được liên kết với không gian hiện đang được chọn;
2. Khi lọc dữ liệu, dữ liệu sẽ tự động được giới hạn trong không gian hiện đang được chọn.

### Phân loại dữ liệu cũ vào đa không gian

Đối với dữ liệu đã tồn tại trước khi plugin Đa không gian được kích hoạt, bạn có thể phân loại chúng vào các không gian theo các bước sau:

#### 1. Thêm trường Không gian

Thêm trường Không gian thủ công vào **bộ sưu tập** cũ:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Gán người dùng vào Không gian chưa được gán

Liên kết người dùng quản lý dữ liệu cũ với tất cả các không gian, bao gồm cả **Không gian chưa được gán (Unassigned Space)**, để xem dữ liệu chưa được gán vào bất kỳ không gian nào:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Chuyển đổi để xem tất cả dữ liệu không gian

Ở phía trên cùng, chọn để xem dữ liệu từ tất cả các không gian:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Cấu hình trang gán dữ liệu cũ

Tạo một trang mới để gán dữ liệu cũ. Hiển thị "trường Không gian" trên **trang danh sách** và **trang chỉnh sửa** để điều chỉnh thủ công việc gán không gian.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Đặt trường Không gian thành có thể chỉnh sửa

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Gán dữ liệu vào không gian thủ công

Thông qua trang đã tạo ở trên, chỉnh sửa dữ liệu thủ công để dần gán không gian chính xác cho dữ liệu cũ (bạn cũng có thể tự cấu hình chỉnh sửa hàng loạt).