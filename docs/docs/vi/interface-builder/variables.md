:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Biến

## Giới thiệu

Biến là các thẻ dùng để định danh một giá trị trong ngữ cảnh hiện tại. Chúng có thể được sử dụng trong nhiều trường hợp, chẳng hạn như cấu hình phạm vi dữ liệu cho các khối, giá trị mặc định của trường, quy tắc liên kết và các luồng công việc.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Các biến hiện được hỗ trợ

### Người dùng hiện tại

Đại diện cho dữ liệu của người dùng đang đăng nhập.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Vai trò hiện tại

Đại diện cho định danh vai trò (tên vai trò) của người dùng đang đăng nhập.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Biểu mẫu hiện tại

Giá trị của biểu mẫu hiện tại, chỉ được sử dụng trong các khối biểu mẫu. Các trường hợp sử dụng bao gồm:

- Quy tắc liên kết cho biểu mẫu hiện tại
- Giá trị mặc định cho các trường biểu mẫu (chỉ có hiệu lực khi thêm dữ liệu mới)
- Cài đặt phạm vi dữ liệu cho các trường quan hệ
- Cấu hình gán giá trị trường cho các thao tác gửi

#### Quy tắc liên kết cho biểu mẫu hiện tại

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Giá trị mặc định cho các trường biểu mẫu (chỉ biểu mẫu thêm mới)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Cài đặt phạm vi dữ liệu cho các trường quan hệ

Được sử dụng để lọc động các tùy chọn của một trường phụ thuộc dựa trên một trường chính, đảm bảo nhập liệu chính xác.

**Ví dụ:**

1. Người dùng chọn giá trị cho trường **Owner**.
2. Hệ thống tự động lọc các tùy chọn cho trường **Account** dựa trên **userName** của Owner đã chọn.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Bản ghi hiện tại

Bản ghi là một hàng trong bảng dữ liệu, mỗi hàng đại diện cho một bản ghi duy nhất. Biến "Bản ghi hiện tại" có sẵn trong **quy tắc liên kết cho các thao tác trên hàng** của các khối hiển thị.

Ví dụ: Vô hiệu hóa nút xóa cho các tài liệu "Đã thanh toán".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Bản ghi cửa sổ bật lên hiện tại

Các thao tác cửa sổ bật lên đóng vai trò rất quan trọng trong cấu hình giao diện của NocoBase.

- Cửa sổ bật lên cho thao tác trên hàng: Mỗi cửa sổ bật lên sẽ có một biến "Bản ghi cửa sổ bật lên hiện tại", đại diện cho bản ghi hàng hiện tại.
- Cửa sổ bật lên cho trường quan hệ: Mỗi cửa sổ bật lên sẽ có một biến "Bản ghi cửa sổ bật lên hiện tại", đại diện cho bản ghi quan hệ được nhấp hiện tại.

Các khối bên trong cửa sổ bật lên đều có thể sử dụng biến "Bản ghi cửa sổ bật lên hiện tại". Các trường hợp sử dụng liên quan bao gồm:

- Cấu hình phạm vi dữ liệu của một khối
- Cấu hình phạm vi dữ liệu của một trường quan hệ
- Cấu hình giá trị mặc định cho các trường (trong biểu mẫu thêm dữ liệu mới)
- Cấu hình quy tắc liên kết cho các thao tác

### Tham số truy vấn URL

Biến này đại diện cho các tham số truy vấn trong URL của trang hiện tại. Biến này chỉ khả dụng khi có chuỗi truy vấn trong URL của trang. Việc sử dụng biến này cùng với [thao tác Liên kết](/interface-builder/actions/types/link) sẽ tiện lợi hơn.

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API token

Giá trị của biến này là một chuỗi, đóng vai trò là thông tin xác thực để truy cập API của NocoBase. Bạn có thể sử dụng nó để xác minh danh tính người dùng.

### Loại thiết bị hiện tại

Ví dụ: Không hiển thị thao tác "In mẫu" trên các thiết bị không phải máy tính để bàn.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)