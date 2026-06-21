---
title: "Giá trị mặc định"
description: "Cấu hình Field: cài đặt giá trị mặc định của Field, hỗ trợ giá trị cố định, biểu thức, tham chiếu biến."
keywords: "giá trị mặc định,default value,Field mặc định,Interface Builder,NocoBase"
---

# Giá trị mặc định

## Giới thiệu

Giá trị mặc định là giá trị ban đầu của Field ở trạng thái thêm mới. Bạn có thể cài đặt giá trị mặc định cho Field khi cấu hình Field trong Table dữ liệu, cũng có thể chỉ định giá trị mặc định cho Field trong Block Form thêm mới, có thể cài đặt là hằng số hoặc biến.

## Có thể cài đặt giá trị mặc định ở đâu

### Field Table dữ liệu

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Field của Form thêm mới

Hầu hết các Field trong Form thêm mới đều hỗ trợ cài đặt giá trị mặc định.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Thêm trong Sub-Form

Bất kể là dữ liệu con được thêm vào Field Sub-Form trong Form thêm mới hay Form chỉnh sửa đều có giá trị mặc định.

Add new của Sub-Form
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Khi chỉnh sửa dữ liệu hiện có, dữ liệu trống sẽ không được điền giá trị mặc định, chỉ dữ liệu mới được thêm mới được điền giá trị mặc định.

### Giá trị mặc định của dữ liệu quan hệ

Chỉ các quan hệ kiểu "**nhiều-một**" và "**nhiều-nhiều**", và sử dụng component Picker (Select, RecordPicker) mới có giá trị mặc định.

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Biến giá trị mặc định

### Có những biến nào

- Người dùng hiện tại;
- Bản ghi hiện tại, chỉ dữ liệu đã tồn tại mới có khái niệm bản ghi hiện tại;
- Form hiện tại, lý tưởng chỉ liệt kê các Field trong Form;
- Đối tượng hiện tại, khái niệm trong Sub-Form (đối tượng dữ liệu mỗi hàng trong Sub-Form);
- Tham số URL
  Xem thêm về biến tại [Biến](/interface-builder/variables)

### Biến giá trị mặc định Field

Chia thành hai loại Field không quan hệ và Field quan hệ.

#### Biến giá trị mặc định Field quan hệ

- Đối tượng biến phải là bản ghi collection;
- Phải là Table trong chuỗi kế thừa, có thể là Table hiện tại, cũng có thể là Table cha-con;
- Biến "Bản ghi được chọn trong Form" chỉ có thể sử dụng trong Field quan hệ "nhiều-nhiều" và "một-nhiều/nhiều-một";
- **Khi nhiều cấp, cần làm phẳng và loại bỏ trùng lặp**

```typescript
// Bản ghi được chọn trong Table:
[{id:1},{id:2},{id:3},{id:4}]

// Bản ghi được chọn trong Table/quan hệ một:
[{quan_hệ_một: {id:2}}, {quan_hệ_một: {id:3}}, {quan_hệ_một: {id:3}}]
// Làm phẳng và loại bỏ trùng lặp
[{id: 2}, {id: 3}]

// Bản ghi được chọn trong Table/quan hệ nhiều:
[{quan_hệ_nhiều: [{id: 1}, {id:2}]}, {quan_hệ_nhiều: {[id:3}, {id:4}]}]
// Làm phẳng
[{id:1},{id:2},{id:3},{id:4}]
```

#### Biến giá trị mặc định không quan hệ

- Loại nhất quán hoặc tương thích, ví dụ chuỗi tương thích với số, và tất cả các đối tượng có cung cấp phương thức toString;
- Field JSON khá đặc biệt, có thể lưu trữ bất kỳ dữ liệu nào;

### Cấp độ Field (Field tùy chọn)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Biến giá trị mặc định không quan hệ
  - Khi chọn Field nhiều cấp, chỉ giới hạn ở quan hệ đến một, không hỗ trợ quan hệ đến nhiều;
  - Field JSON khá đặc biệt, có thể không giới hạn;

- Biến giá trị mặc định quan hệ
  - hasOne, chỉ hỗ trợ quan hệ đến một;
  - hasMany, đến một (chuyển đổi nội bộ) và đến nhiều đều được;
  - belongsToMany, đến một (chuyển đổi nội bộ) và đến nhiều đều được;
  - belongsTo, thường là đến một, khi quan hệ cha là hasMany, cũng hỗ trợ đến nhiều (vì hasMany/belongsTo về bản chất là quan hệ nhiều-nhiều);

## Giải thích các trường hợp đặc biệt

### "Nhiều-nhiều" tương đương với tổ hợp "một-nhiều/nhiều-một"

Mô hình

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Tại sao một-một và một-nhiều không có giá trị mặc định?

Ví dụ quan hệ A.B, b1 đã được a1 liên kết, thì không thể được a2 liên kết, nếu b1 liên kết a2, thì sẽ giải tỏa liên kết với a1, trong trường hợp này dữ liệu không phải là chia sẻ, mà giá trị mặc định là cơ chế chia sẻ (đều có thể liên kết), do đó một-một và một-nhiều không thể cài đặt giá trị mặc định.

### Tại sao Sub-Form hoặc Sub-Table của nhiều-một và nhiều-nhiều cũng không thể có giá trị mặc định?

Bởi vì điểm nhấn của Sub-Form và Sub-Table là chỉnh sửa trực tiếp dữ liệu quan hệ (bao gồm thêm mới, xóa), trong khi giá trị mặc định quan hệ là cơ chế chia sẻ, đều có thể liên kết, nhưng không thể sửa đổi dữ liệu quan hệ. Do đó trong trường hợp này không phù hợp để cung cấp giá trị mặc định.

Ngoài ra, Sub-Form hoặc Sub-Table có Field con, giá trị mặc định của Sub-Form hoặc Sub-Table cài đặt là giá trị mặc định hàng hay giá trị mặc định cột sẽ khó phân biệt.

Xem xét tổng hợp, bất kể quan hệ gì Sub-Form hoặc Sub-Table đều không thể cài đặt trực tiếp giá trị mặc định là phù hợp hơn.
