:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Điều kiện phán đoán

Điều kiện phán đoán cho phép bạn kiểm soát động việc hiển thị hoặc ẩn nội dung trong tài liệu dựa trên giá trị dữ liệu. Có ba cách chính để viết điều kiện:

-   **Điều kiện nội tuyến**: Trực tiếp xuất văn bản (hoặc thay thế bằng văn bản khác).
-   **Khối điều kiện**: Hiển thị hoặc ẩn một phần của tài liệu, phù hợp cho nhiều thẻ, đoạn văn, bảng, v.v.
-   **Điều kiện thông minh**: Trực tiếp xóa hoặc giữ lại các phần tử mục tiêu (như hàng, đoạn văn, hình ảnh, v.v.) chỉ với một thẻ, cho cú pháp ngắn gọn hơn.

Tất cả các điều kiện đều bắt đầu bằng một bộ định dạng đánh giá logic (ví dụ: ifEQ, ifGT, v.v.), sau đó là các bộ định dạng hành động (như show, elseShow, drop, keep, v.v.).

### Tổng quan

Các toán tử logic và bộ định dạng hành động được hỗ trợ trong điều kiện phán đoán bao gồm:

-   **Toán tử logic**
    -   **ifEQ(value)**: Kiểm tra xem dữ liệu có bằng giá trị được chỉ định hay không.
    -   **ifNE(value)**: Kiểm tra xem dữ liệu có khác giá trị được chỉ định hay không.
    -   **ifGT(value)**: Kiểm tra xem dữ liệu có lớn hơn giá trị được chỉ định hay không.
    -   **ifGTE(value)**: Kiểm tra xem dữ liệu có lớn hơn hoặc bằng giá trị được chỉ định hay không.
    -   **ifLT(value)**: Kiểm tra xem dữ liệu có nhỏ hơn giá trị được chỉ định hay không.
    -   **ifLTE(value)**: Kiểm tra xem dữ liệu có nhỏ hơn hoặc bằng giá trị được chỉ định hay không.
    -   **ifIN(value)**: Kiểm tra xem dữ liệu có chứa trong một mảng hoặc chuỗi hay không.
    -   **ifNIN(value)**: Kiểm tra xem dữ liệu có không chứa trong một mảng hoặc chuỗi hay không.
    -   **ifEM()**: Kiểm tra xem dữ liệu có rỗng hay không (ví dụ: null, undefined, chuỗi rỗng, mảng rỗng hoặc đối tượng rỗng).
    -   **ifNEM()**: Kiểm tra xem dữ liệu có không rỗng hay không.
    -   **ifTE(type)**: Kiểm tra xem kiểu dữ liệu có bằng kiểu được chỉ định hay không (ví dụ: "string", "number", "boolean", v.v.).
    -   **and(value)**: Toán tử logic "và", dùng để nối nhiều điều kiện.
    -   **or(value)**: Toán tử logic "hoặc", dùng để nối nhiều điều kiện.

-   **Bộ định dạng hành động**
    -   **:show(text) / :elseShow(text)**: Dùng trong điều kiện nội tuyến để trực tiếp xuất văn bản được chỉ định.
    -   **:hideBegin / :hideEnd** và **:showBegin / :showEnd**: Dùng trong khối điều kiện để ẩn hoặc hiển thị các phần của tài liệu.
    -   **:drop(element) / :keep(element)**: Dùng trong điều kiện thông minh để xóa hoặc giữ lại các phần tử tài liệu được chỉ định.

Các phần tiếp theo sẽ giới thiệu cú pháp chi tiết, ví dụ và kết quả cho từng cách sử dụng.

### Điều kiện nội tuyến

#### 1. :show(text) / :elseShow(text)

##### Cú pháp
```
{dữ liệu:điều kiện:show(văn bản)}
{dữ liệu:điều kiện:show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
Giả sử dữ liệu là:
```json
{
  "val2": 2,
  "val5": 5
}
```
Mẫu như sau:
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

#### 2. Switch Case (Điều kiện đa dạng)

##### Cú pháp
Sử dụng các bộ định dạng điều kiện liên tiếp để xây dựng cấu trúc tương tự switch-case:
```
{dữ liệu:ifEQ(giá trị 1):show(kết quả 1):ifEQ(giá trị 2):show(kết quả 2):elseShow(kết quả mặc định)}
```
Hoặc thực hiện tương tự với toán tử or:
```
{dữ liệu:ifEQ(giá trị 1):show(kết quả 1):or(dữ liệu):ifEQ(giá trị 2):show(kết quả 2):elseShow(kết quả mặc định)}
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
Mẫu:
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

#### 3. Điều kiện đa biến

##### Cú pháp
Sử dụng các toán tử logic and/or để kiểm tra nhiều biến:
```
{dữ liệu 1:ifEQ(điều kiện 1):and(.dữ liệu 2):ifEQ(điều kiện 2):show(kết quả):elseShow(kết quả thay thế)}
{dữ liệu 1:ifEQ(điều kiện 1):or(.dữ liệu 2):ifEQ(điều kiện 2):show(kết quả):elseShow(kết quả thay thế)}
```

##### Ví dụ
Dữ liệu:
```json
{
  "val2": 2,
  "val5": 5
}
```
Mẫu:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Kết quả
```
and = KO
or = OK
```

### Toán tử logic và Bộ định dạng

Trong các phần sau, các bộ định dạng được mô tả đều sử dụng cú pháp điều kiện nội tuyến với định dạng sau:
```
{dữ liệu:bộ định dạng(tham số):show(văn bản):elseShow(văn bản thay thế)}
```

#### 1. :and(value)

##### Cú pháp
```
{dữ liệu:ifEQ(giá trị):and(dữ liệu hoặc điều kiện mới):ifGT(giá trị khác):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Kết quả
Nếu `d.car` bằng `'delorean'` và `d.speed` lớn hơn 80, thì kết quả là `TravelInTime`; ngược lại, kết quả là `StayHere`.

#### 2. :or(value)

##### Cú pháp
```
{dữ liệu:ifEQ(giá trị):or(dữ liệu hoặc điều kiện mới):ifGT(giá trị khác):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Kết quả
Nếu `d.car` bằng `'delorean'` hoặc `d.speed` lớn hơn 80, thì kết quả là `TravelInTime`; ngược lại, kết quả là `StayHere`.

#### 3. :ifEM()

##### Cú pháp
```
{dữ liệu:ifEM():show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Kết quả
Đối với `null` hoặc mảng rỗng, kết quả là `Result true`; ngược lại, kết quả là `Result false`.

#### 4. :ifNEM()

##### Cú pháp
```
{dữ liệu:ifNEM():show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Kết quả
Đối với dữ liệu không rỗng (như số 0 hoặc chuỗi 'homer'), kết quả là `Result true`; đối với dữ liệu rỗng, kết quả là `Result false`.

#### 5. :ifEQ(value)

##### Cú pháp
```
{dữ liệu:ifEQ(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Kết quả
Nếu dữ liệu bằng giá trị được chỉ định, kết quả là `Result true`; ngược lại, kết quả là `Result false`.

#### 6. :ifNE(value)

##### Cú pháp
```
{dữ liệu:ifNE(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu tiên cho kết quả `Result false`, trong khi ví dụ thứ hai cho kết quả `Result true`.

#### 7. :ifGT(value)

##### Cú pháp
```
{dữ liệu:ifGT(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu tiên cho kết quả `Result true`, và ví dụ thứ hai cho kết quả `Result false`.

#### 8. :ifGTE(value)

##### Cú pháp
```
{dữ liệu:ifGTE(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu tiên cho kết quả `Result true`, trong khi ví dụ thứ hai cho kết quả `Result false`.

#### 9. :ifLT(value)

##### Cú pháp
```
{dữ liệu:ifLT(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu tiên cho kết quả `Result true`, và ví dụ thứ hai cho kết quả `Result false`.

#### 10. :ifLTE(value)

##### Cú pháp
```
{dữ liệu:ifLTE(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu tiên cho kết quả `Result true`, và ví dụ thứ hai cho kết quả `Result false`.

#### 11. :ifIN(value)

##### Cú pháp
```
{dữ liệu:ifIN(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Kết quả
Cả hai ví dụ đều cho kết quả `Result true` (vì chuỗi chứa 'is', và mảng chứa 2).

#### 12. :ifNIN(value)

##### Cú pháp
```
{dữ liệu:ifNIN(giá trị):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu tiên cho kết quả `Result false` (vì chuỗi chứa 'is'), và ví dụ thứ hai cho kết quả `Result false` (vì mảng chứa 2).

#### 13. :ifTE(type)

##### Cú pháp
```
{dữ liệu:ifTE('kiểu'):show(văn bản):elseShow(văn bản thay thế)}
```

##### Ví dụ
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Kết quả
Ví dụ đầu tiên cho kết quả `Result true` (vì 'homer' là một chuỗi), và ví dụ thứ hai cho kết quả `Result true` (vì 10.5 là một số).

### Khối điều kiện

Khối điều kiện được dùng để hiển thị hoặc ẩn một phần của tài liệu, thường dùng để bao bọc nhiều thẻ hoặc toàn bộ một khối văn bản.

#### 1. :showBegin / :showEnd

##### Cú pháp
```
{dữ liệu:ifEQ(điều kiện):showBegin}
Nội dung khối tài liệu
{dữ liệu:showEnd}
```

##### Ví dụ
Dữ liệu:
```json
{
  "toBuy": true
}
```
Mẫu:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Kết quả
Khi điều kiện được đáp ứng, nội dung ở giữa được hiển thị:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Cú pháp
```
{dữ liệu:ifEQ(điều kiện):hideBegin}
Nội dung khối tài liệu
{dữ liệu:hideEnd}
```

##### Ví dụ
Dữ liệu:
```json
{
  "toBuy": true
}
```
Mẫu:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Kết quả
Khi điều kiện được đáp ứng, nội dung ở giữa bị ẩn, kết quả là:
```
Banana
Grapes
```