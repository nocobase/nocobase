:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Giá trị mặc định

## Giới thiệu

Giá trị mặc định là giá trị ban đầu của một trường khi tạo bản ghi mới. Bạn có thể đặt giá trị mặc định cho một trường khi cấu hình nó trong một bộ sưu tập, hoặc chỉ định giá trị mặc định cho một trường trong khối biểu mẫu Thêm mới. Giá trị này có thể là một hằng số hoặc một biến.

## Nơi có thể thiết lập giá trị mặc định

### Trường trong bộ sưu tập

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Trường trong biểu mẫu Thêm mới

Hầu hết các trường trong biểu mẫu Thêm mới đều hỗ trợ thiết lập giá trị mặc định.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Thêm dữ liệu trong biểu mẫu con

Dữ liệu con được thêm thông qua trường biểu mẫu con, dù trong biểu mẫu Thêm mới hay Chỉnh sửa, đều sẽ có giá trị mặc định.

Thêm mới trong biểu mẫu con
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Khi chỉnh sửa dữ liệu hiện có, các trường trống sẽ không được điền giá trị mặc định. Chỉ dữ liệu mới được thêm vào mới được điền giá trị mặc định.

### Giá trị mặc định cho các trường quan hệ

Chỉ các quan hệ kiểu **Nhiều-tới-Một** và **Nhiều-tới-Nhiều** mới có giá trị mặc định khi sử dụng các thành phần chọn (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Biến giá trị mặc định

### Các biến có sẵn

- Người dùng hiện tại;
- Bản ghi hiện tại; khái niệm này chỉ áp dụng cho các bản ghi đã tồn tại;
- Biểu mẫu hiện tại, lý tưởng là chỉ liệt kê các trường trong biểu mẫu;
- Đối tượng hiện tại, một khái niệm trong biểu mẫu con (đối tượng dữ liệu cho mỗi hàng trong biểu mẫu con);
- Tham số URL
Để biết thêm thông tin về biến, hãy tham khảo [Biến](/interface-builder/variables)

### Biến giá trị mặc định của trường

Chia thành hai loại: trường không quan hệ và trường quan hệ.

#### Biến giá trị mặc định của trường quan hệ

- Đối tượng biến phải là một bản ghi của bộ sưu tập;
- Phải là một bảng trong chuỗi kế thừa, có thể là bảng hiện tại hoặc bảng cha/con;
- Biến "Các bản ghi được chọn trong bảng" chỉ khả dụng cho các trường quan hệ "Nhiều-tới-Nhiều" và "Một-tới-Nhiều/Nhiều-tới-Một";
- **Đối với các kịch bản đa cấp, cần làm phẳng và loại bỏ trùng lặp**

```typescript
// Các bản ghi được chọn trong bảng:
[{id:1},{id:2},{id:3},{id:4}]

// Các bản ghi được chọn trong bảng/một-tới-một:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Làm phẳng và loại bỏ trùng lặp
[{id: 2}, {id: 3}]

// Các bản ghi được chọn trong bảng/một-tới-nhiều:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Làm phẳng
[{id:1},{id:2},{id:3},{id:4}]
```

#### Biến giá trị mặc định của trường không quan hệ

- Các kiểu dữ liệu phải nhất quán hoặc tương thích, ví dụ như chuỗi tương thích với số, và tất cả các đối tượng cung cấp phương thức toString;
- Trường JSON là đặc biệt và có thể lưu trữ bất kỳ loại dữ liệu nào;

### Cấp độ trường (Trường tùy chọn)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Biến giá trị mặc định của trường không quan hệ
  - Khi chọn trường đa cấp, chỉ giới hạn ở quan hệ một-tới-một và không hỗ trợ quan hệ một-tới-nhiều;
  - Trường JSON là đặc biệt và có thể không bị giới hạn;

- Biến giá trị mặc định của trường quan hệ
  - hasOne, chỉ hỗ trợ quan hệ một-tới-một;
  - hasMany, hỗ trợ cả quan hệ một-tới-một (chuyển đổi nội bộ) và một-tới-nhiều;
  - belongsToMany, hỗ trợ cả quan hệ một-tới-một (chuyển đổi nội bộ) và một-tới-nhiều;
  - belongsTo, thường là quan hệ một-tới-một, nhưng khi quan hệ cha là hasMany, nó cũng hỗ trợ một-tới-nhiều (vì hasMany/belongsTo về bản chất là quan hệ nhiều-tới-nhiều);

## Các trường hợp đặc biệt

### Quan hệ "Nhiều-tới-Nhiều" tương đương với sự kết hợp của "Một-tới-Nhiều/Nhiều-tới-Một"

Mô hình

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Tại sao quan hệ Một-tới-Một và Một-tới-Nhiều không có giá trị mặc định?

Ví dụ, trong quan hệ A.B, nếu b1 đã được liên kết với a1, nó không thể liên kết với a2. Nếu b1 liên kết với a2, liên kết với a1 sẽ bị gỡ bỏ. Trong trường hợp này, dữ liệu không được chia sẻ, trong khi giá trị mặc định là một cơ chế chia sẻ (tất cả đều có thể liên kết). Do đó, quan hệ Một-tới-Một và Một-tới-Nhiều không thể thiết lập giá trị mặc định.

### Tại sao biểu mẫu con hoặc bảng con của quan hệ Nhiều-tới-Một và Nhiều-tới-Nhiều không thể có giá trị mặc định?

Bởi vì trọng tâm của biểu mẫu con và bảng con là chỉnh sửa trực tiếp dữ liệu quan hệ (bao gồm thêm mới, xóa bỏ), trong khi giá trị mặc định của quan hệ là cơ chế chia sẻ, tất cả đều có thể liên kết nhưng không thể sửa đổi dữ liệu quan hệ. Do đó, không phù hợp để cung cấp giá trị mặc định trong trường hợp này.

Ngoài ra, biểu mẫu con hoặc bảng con có các trường con, và sẽ không rõ liệu giá trị mặc định của biểu mẫu con hoặc bảng con được thiết lập là giá trị mặc định cho hàng hay cho cột.

Xem xét tổng thể, việc không thể thiết lập trực tiếp giá trị mặc định cho biểu mẫu con hoặc bảng con, bất kể loại quan hệ nào, là phù hợp hơn.