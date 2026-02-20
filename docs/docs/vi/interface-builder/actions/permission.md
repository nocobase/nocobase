:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quyền thao tác

## Giới thiệu

Trong NocoBase 2.0, quyền thao tác hiện được kiểm soát chủ yếu bởi quyền tài nguyên **bộ sưu tập**:

- **Quyền tài nguyên bộ sưu tập**: Dùng để kiểm soát thống nhất các quyền thao tác cơ bản (như Tạo (Create), Xem (View), Cập nhật (Update), Xóa (Delete)) của các vai trò khác nhau đối với một **bộ sưu tập**. Quyền này áp dụng cho toàn bộ **bộ sưu tập** trong **nguồn dữ liệu**, đảm bảo quyền thao tác tương ứng của một vai trò đối với **bộ sưu tập** đó luôn nhất quán trên các trang, cửa sổ bật lên và khối khác nhau.

### Quyền tài nguyên bộ sưu tập

Trong hệ thống quyền của NocoBase, quyền thao tác **bộ sưu tập** về cơ bản được phân chia theo các chiều CRUD để đảm bảo tính nhất quán và tiêu chuẩn hóa trong quản lý quyền. Ví dụ:

- **Quyền Tạo (Create)**: Kiểm soát tất cả các thao tác liên quan đến việc tạo mới cho **bộ sưu tập**, bao gồm thao tác thêm mới, thao tác sao chép, v.v. Miễn là một vai trò có quyền tạo mới cho **bộ sưu tập** này, thì các thao tác thêm mới, sao chép và các thao tác tạo mới khác của **bộ sưu tập** đó sẽ hiển thị trên tất cả các trang và trong tất cả các cửa sổ bật lên.
- **Quyền Xóa (Delete)**: Kiểm soát thao tác xóa cho **bộ sưu tập** này. Quyền vẫn nhất quán, cho dù đó là thao tác xóa hàng loạt trong một khối bảng hay thao tác xóa một bản ghi đơn lẻ trong một khối chi tiết.
- **Quyền Cập nhật (Update)**: Kiểm soát các thao tác thuộc loại cập nhật cho **bộ sưu tập** này, như thao tác chỉnh sửa, thao tác cập nhật bản ghi.
- **Quyền Xem (View)**: Kiểm soát khả năng hiển thị dữ liệu của **bộ sưu tập** này. Các khối dữ liệu liên quan (Bảng, Danh sách, Chi tiết, v.v.) chỉ hiển thị khi vai trò có quyền xem cho **bộ sưu tập** này.

Phương pháp quản lý quyền phổ quát này phù hợp cho việc kiểm soát quyền dữ liệu được tiêu chuẩn hóa, đảm bảo rằng đối với `cùng một bộ sưu tập`, `cùng một thao tác` có các quy tắc quyền `nhất quán` trên `các trang, cửa sổ bật lên và khối khác nhau`, mang lại tính thống nhất và khả năng bảo trì.

#### Quyền toàn cục

Quyền thao tác toàn cục áp dụng cho tất cả các **bộ sưu tập** trong **nguồn dữ liệu**, được phân loại theo loại tài nguyên như sau:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Quyền thao tác bộ sưu tập cụ thể

Quyền thao tác **bộ sưu tập** cụ thể ghi đè lên các quyền chung của **nguồn dữ liệu**, tinh chỉnh thêm các quyền thao tác và cho phép cấu hình quyền tùy chỉnh để truy cập tài nguyên của một **bộ sưu tập** cụ thể. Các quyền này được chia thành hai khía cạnh:

1. Quyền thao tác: Quyền thao tác bao gồm các thao tác thêm, xem, chỉnh sửa, xóa, xuất và nhập. Các quyền này được cấu hình dựa trên phạm vi dữ liệu:

   - Tất cả dữ liệu: Cho phép người dùng thực hiện các thao tác trên tất cả các bản ghi trong **bộ sưu tập**.
   - Dữ liệu của riêng mình: Hạn chế người dùng chỉ thực hiện các thao tác trên các bản ghi dữ liệu mà họ đã tạo.

2. Quyền trường: Quyền trường cho phép cấu hình quyền cho từng trường trong các thao tác khác nhau. Ví dụ, một số trường có thể được cấu hình chỉ cho phép xem mà không cho phép chỉnh sửa.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

## Tài liệu liên quan

[Cấu hình quyền]