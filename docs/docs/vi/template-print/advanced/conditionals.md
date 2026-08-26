---
title: "conditionals"
description: "Đánh giá điều kiện cho phép kiểm soát động việc hiển thị hoặc ẩn nội dung trong tài liệu dựa trên giá trị dữ liệu. Cung cấp ba cách viết điều kiện chính: - **Điều kiện inline**: Trực tiếp xuất văn bản (hoặc thay thế bằng văn bản khác). - **Block điều kiện**: Hiển thị hoặc ẩn một vùng trong tài liệu, áp dụng cho nhiều thẻ, đoạn, bảng..."
keywords: "conditionals,NocoBase"
---

## Đánh giá điều kiện

Đánh giá điều kiện cho phép kiểm soát động việc hiển thị hoặc ẩn nội dung trong tài liệu dựa trên giá trị dữ liệu. Cung cấp ba cách viết điều kiện chính:

- **Điều kiện inline**: Trực tiếp xuất văn bản (hoặc thay thế bằng văn bản khác).
- **Block điều kiện**: Hiển thị hoặc ẩn một vùng trong tài liệu, áp dụng cho nhiều thẻ, đoạn, bảng...
- **Điều kiện thông minh**: Thông qua một thẻ trực tiếp loại bỏ hoặc giữ phần tử mục tiêu (như hàng, đoạn, hình ảnh...), cú pháp ngắn gọn hơn.

Tất cả điều kiện đều bắt đầu bằng một Formatter đánh giá logic (ví dụ ifEQ, ifGT...), tiếp theo là Formatter thực thi hành động (như show, elseShow, drop, keep...).


### Tổng quan

Các toán tử logic và Formatter hành động được hỗ trợ trong đánh giá điều kiện bao gồm:

- **Toán tử logic**
  - **ifEQ(value)**: Đánh giá dữ liệu có bằng giá trị chỉ định không
  - **ifNE(value)**: Đánh giá dữ liệu có khác giá trị chỉ định không
  - **ifGT(value)**: Đánh giá dữ liệu có lớn hơn giá trị chỉ định không
  - **ifGTE(value)**: Đánh giá dữ liệu có lớn hơn hoặc bằng giá trị chỉ định không
  - **ifLT(value)**: Đánh giá dữ liệu có nhỏ hơn giá trị chỉ định không
  - **ifLTE(value)**: Đánh giá dữ liệu có nhỏ hơn hoặc bằng giá trị chỉ định không
  - **ifIN(value)**: Đánh giá dữ liệu có nằm trong mảng hoặc chuỗi không
  - **ifNIN(value)**: Đánh giá dữ liệu có không nằm trong mảng hoặc chuỗi không
  - **ifEM()**: Đánh giá dữ liệu có rỗng không (như null, undefined, chuỗi rỗng, mảng rỗng hoặc object rỗng)
  - **ifNEM()**: Đánh giá dữ liệu có không rỗng không
  - **ifTE(type)**: Đánh giá loại dữ liệu có bằng loại chỉ định không (ví dụ "string", "number", "boolean"...)
  - **and(value)**: Logic "và", dùng để kết nối nhiều điều kiện
  - **or(value)**: Logic "hoặc", dùng để kết nối nhiều điều kiện

- **Formatter hành động**
  - **:show(text) / :elseShow(text)**: Dùng cho điều kiện inline, trực tiếp xuất văn bản chỉ định
  - **:hideBegin / :hideEnd** và **:showBegin / :showEnd**: Dùng cho block điều kiện, ẩn hoặc hiển thị block tài liệu
  - **:drop(element) / :keep(element)**: Dùng cho điều kiện thông minh, loại bỏ hoặc giữ phần tử tài liệu chỉ định

Tiếp theo lần lượt giới thiệu cú pháp chi tiết, ví dụ và kết quả của từng cách dùng.


### Điều kiện inline

#### 1. :show(text) / :elseShow(text)

##### Cú pháp
```
{Dữ liệu:Điều kiện:show(văn bản)}
{Dữ liệu:Điều kiện:show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
Giả sử dữ liệu là:
```json
{
  "val2": 2,
  "val5": 5
}
```
Template như sau:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Kết quả
```
val2 = 2
val2 = low
val5 = high
```


#### 2. Switch Case (đánh giá nhiều điều kiện)

##### Cú pháp
Sử dụng Formatter điều kiện liên tiếp để xây dựng cấu trúc giống switch-case:
```
{Dữ liệu:ifEQ(giá trị 1):show(kết quả 1):ifEQ(giá trị 2):show(kết quả 2):elseShow(kết quả mặc định)}
```
Hoặc dùng toán tử or để triển khai:
```
{Dữ liệu:ifEQ(giá trị 1):show(kết quả 1):or(Dữ liệu):ifEQ(giá trị 2):show(kết quả 2):elseShow(kết quả mặc định)}
```

##### Ví dụ
Dữ liệu:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Template:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Kết quả
```
val1 = A
val2 = B
val3 = C
```


#### 3. Đánh giá điều kiện đa biến

##### Cú pháp
Sử dụng toán tử logic and/or có thể kiểm tra nhiều biến:
```
{Dữ liệu 1:ifEQ(điều kiện 1):and(.Dữ liệu 2):ifEQ(điều kiện 2):show(kết quả):elseShow(kết quả thay thế)}
{Dữ liệu 1:ifEQ(điều kiện 1):or(.Dữ liệu 2):ifEQ(điều kiện 2):show(kết quả):elseShow(kết quả thay thế)}
```

##### Ví dụ
Dữ liệu:
```json
{
  "val2": 2,
  "val5": 5
}
```
Template:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Kết quả
```
and = KO
or = OK
```


### Toán tử logic và Formatter

Các Formatter được giới thiệu trong các phần dưới đây đều áp dụng dạng điều kiện inline, định dạng cú pháp:
```
{Dữ liệu:Formatter(tham số):show(văn bản):elseShow(văn bản thay thế)}
```

#### 1. :and(value)

##### Cú pháp
```
{Dữ liệu:ifEQ(giá trị):and(dữ liệu mới hoặc điều kiện):ifGT(giá trị khác):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Kết quả
Nếu `d.car` bằng `'delorean'` và `d.speed` lớn hơn 80, thì xuất `TravelInTime`; ngược lại xuất `StayHere`.


#### 2. :or(value)

##### Cú pháp
```
{Dữ liệu:ifEQ(giá trị):or(dữ liệu mới hoặc điều kiện):ifGT(giá trị khác):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Kết quả
Nếu `d.car` bằng `'delorean'` hoặc `d.speed` lớn hơn 80, thì xuất `TravelInTime`; ngược lại xuất `StayHere`.


#### 3. :ifEM()

##### Cú pháp
```
{Dữ liệu:ifEM():show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Kết quả
Đối với `null` hoặc mảng rỗng, xuất `Result true`; ngược lại xuất `Result false`.


#### 4. :ifNEM()

##### Cú pháp
```
{Dữ liệu:ifNEM():show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Kết quả
Đối với dữ liệu không rỗng (như số 0 hoặc chuỗi 'homer'), xuất `Result true`; dữ liệu rỗng thì xuất `Result false`.


#### 5. :ifEQ(value)

##### Cú pháp
```
{Dữ liệu:ifEQ(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Kết quả
Nếu dữ liệu bằng giá trị chỉ định thì xuất `Result true`, ngược lại xuất `Result false`.


#### 6. :ifNE(value)

##### Cú pháp
```
{Dữ liệu:ifNE(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu xuất `Result false`, ví dụ thứ hai xuất `Result true`.


#### 7. :ifGT(value)

##### Cú pháp
```
{Dữ liệu:ifGT(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu xuất `Result true`, ví dụ thứ hai xuất `Result false`.


#### 8. :ifGTE(value)

##### Cú pháp
```
{Dữ liệu:ifGTE(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu xuất `Result true`, ví dụ thứ hai xuất `Result false`.


#### 9. :ifLT(value)

##### Cú pháp
```
{Dữ liệu:ifLT(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu xuất `Result true`, ví dụ thứ hai xuất `Result false`.


#### 10. :ifLTE(value)

##### Cú pháp
```
{Dữ liệu:ifLTE(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu xuất `Result true`, ví dụ thứ hai xuất `Result false`.


#### 11. :ifIN(value)

##### Cú pháp
```
{Dữ liệu:ifIN(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Kết quả
Cả hai ví dụ đều xuất `Result true` (vì chuỗi chứa 'is', mảng chứa 2).


#### 12. :ifNIN(value)

##### Cú pháp
```
{Dữ liệu:ifNIN(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu xuất `Result false` (vì chuỗi chứa 'is'), ví dụ thứ hai xuất `Result false` (vì mảng chứa 2).


#### 13. :ifTE(type)

##### Cú pháp
```
{Dữ liệu:ifTE('loại'):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu xuất `Result true` ('homer' là chuỗi), ví dụ thứ hai xuất `Result true` (10.5 là số).


### Block điều kiện

Block điều kiện dùng để hiển thị hoặc ẩn một vùng trong tài liệu, thường dùng để bao bọc nhiều thẻ hoặc cả đoạn văn bản.

#### 1. :showBegin / :showEnd

##### Cú pháp
```
{Dữ liệu:ifEQ(điều kiện):showBegin}
Nội dung block tài liệu
{Dữ liệu:showEnd}
```

##### Ví dụ
Dữ liệu:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Kết quả
Khi điều kiện thỏa mãn, nội dung ở giữa hiển thị:
```
Banana
Apple
Pineapple
Grapes
```


#### 2. :hideBegin / :hideEnd

##### Cú pháp
```
{Dữ liệu:ifEQ(điều kiện):hideBegin}
Nội dung block tài liệu
{Dữ liệu:hideEnd}
```

##### Ví dụ
Dữ liệu:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Kết quả
Khi điều kiện thỏa mãn, nội dung ở giữa bị ẩn, đầu ra:
```
Banana
Grapes
```


