---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/multi-space/multi-space).
:::

# Đa không gian (Multi-space)

## Giới thiệu

**Plugin Đa không gian (Multi-space)** cho phép tạo ra nhiều không gian dữ liệu độc lập thông qua việc cách ly logic trong cùng một instance ứng dụng duy nhất.

#### Các kịch bản áp dụng
- **Nhiều cửa hàng hoặc nhà máy**: Quy trình kinh doanh và cấu hình hệ thống có tính nhất quán cao — ví dụ như quản lý kho bãi, kế hoạch sản xuất, chiến lược bán hàng và mẫu báo cáo thống nhất — nhưng cần đảm bảo dữ liệu của mỗi đơn vị kinh doanh không can thiệp lẫn nhau.
- **Quản lý đa tổ chức hoặc công ty con**: Nhiều tổ chức hoặc công ty con thuộc một tập đoàn cùng chia sẻ một nền tảng, nhưng mỗi thương hiệu có dữ liệu khách hàng, sản phẩm và đơn hàng độc lập.

## Cài đặt

Tìm plugin **Đa không gian (Multi-workspace)** trong trình quản lý plugin và kích hoạt nó.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Hướng dẫn sử dụng

### Quản lý đa không gian

Sau khi kích hoạt plugin, hãy truy cập trang cài đặt **「Người dùng & Quyền hạn」**, chuyển sang bảng **Không gian** để quản lý các không gian.

> Ở trạng thái ban đầu, sẽ có một **Không gian chưa được phân bổ (Unassigned Space)** mặc định, chủ yếu được sử dụng để xem các dữ liệu cũ chưa được liên kết với không gian nào.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Tạo không gian

Nhấp vào nút "Thêm không gian" để tạo không gian mới:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Phân bổ người dùng

Sau khi chọn không gian đã tạo, bạn có thể thiết lập người dùng thuộc về không gian đó ở phía bên phải:

> **Gợi ý:** Sau khi phân bổ người dùng vào không gian, bạn cần **làm mới trang thủ công** để danh sách chuyển đổi không gian ở góc trên bên phải cập nhật và hiển thị các không gian mới nhất.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Chuyển đổi và xem đa không gian

Bạn có thể chuyển đổi không gian hiện tại ở góc trên bên phải.  
Khi nhấp vào **biểu tượng con mắt** ở bên phải (trạng thái được làm nổi bật), bạn có thể xem dữ liệu của nhiều không gian cùng một lúc.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Quản lý dữ liệu đa không gian

Sau khi bật plugin, hệ thống sẽ tự động thiết lập sẵn một **trường không gian** khi tạo bộ sưu tập (Collection).  
**Chỉ những bộ sưu tập chứa trường này mới được đưa vào logic quản lý không gian.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Đối với các bộ sưu tập hiện có, bạn có thể thêm trường không gian thủ công để kích hoạt quản lý không gian:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logic mặc định

Trong các bộ sưu tập có chứa trường không gian, hệ thống sẽ tự động áp dụng các logic sau:

1. Khi tạo dữ liệu, hệ thống tự động liên kết với không gian hiện đang được chọn;
2. Khi lọc dữ liệu, hệ thống tự động giới hạn trong phạm vi dữ liệu của không gian hiện đang được chọn.

### Phân loại đa không gian cho dữ liệu cũ

Đối với dữ liệu đã tồn tại trước khi kích hoạt plugin Đa không gian, bạn có thể thực hiện phân loại không gian theo các bước sau:

#### 1. Thêm trường không gian

Thêm trường không gian thủ công cho bộ sưu tập cũ:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Phân bổ người dùng vào không gian chưa được phân bổ

Liên kết người dùng quản lý dữ liệu cũ với tất cả các không gian, bao gồm cả **Không gian chưa được phân bổ (Unassigned Space)** để xem các dữ liệu chưa thuộc về không gian nào:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Chuyển sang chế độ xem dữ liệu của tất cả không gian

Nhấp chọn xem dữ liệu của tất cả các không gian ở thanh công cụ phía trên:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Cấu hình trang phân bổ dữ liệu cũ

Tạo một trang mới để phân bổ dữ liệu cũ, hiển thị "Trường không gian" trong **Khối danh sách** và **Form chỉnh sửa** để điều chỉnh không gian sở hữu một cách thủ công.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Chuyển trường không gian sang chế độ có thể chỉnh sửa:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Phân bổ không gian dữ liệu thủ công

Thông qua trang trên, hãy chỉnh sửa dữ liệu thủ công để dần dần phân bổ không gian chính xác cho dữ liệu cũ (bạn cũng có thể tự cấu hình chỉnh sửa hàng loạt).