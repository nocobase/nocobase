---
title: "Template In ấn - Định dạng số"
description: "Formatter Định dạng số Template In ấn: formatN để Định dạng số theo cài đặt bản địa hóa, hỗ trợ số chữ số thập phân."
keywords: "Template In ấn,Định dạng số,formatN,NocoBase"
---

### Định dạng số

#### 1. :formatN(precision)

##### Mô tả cú pháp
Định dạng số theo cài đặt bản địa hóa.
Tham số:
- precision: Số chữ số thập phân
  Đối với định dạng ODS/XLSX, số chữ số thập phân hiển thị do trình soạn thảo văn bản quyết định; các định dạng khác phụ thuộc vào tham số này.

##### Ví dụ
```
'10':formatN()         // Output "10.000"
'1000.456':formatN()   // Output "1,000.456"
```

##### Kết quả
Số được xuất theo độ chính xác và định dạng bản địa hóa chỉ định.


#### 2. :round(precision)

##### Mô tả cú pháp
Làm tròn số, tham số chỉ định số chữ số thập phân.

##### Ví dụ
```
10.05123:round(2)      // Output 10.05
1.05:round(1)          // Output 1.1
```

##### Kết quả
Đầu ra là giá trị sau khi làm tròn.


#### 3. :add(value)

##### Mô tả cú pháp
Cộng số hiện tại với giá trị chỉ định.
Tham số:
- value: Số cộng

##### Ví dụ
```
1000.4:add(2)         // Output 1002.4
'1000.4':add('2')      // Output 1002.4
```

##### Kết quả
Đầu ra là giá trị sau khi cộng.


#### 4. :sub(value)

##### Mô tả cú pháp
Trừ số hiện tại với giá trị chỉ định.
Tham số:
- value: Số trừ

##### Ví dụ
```
1000.4:sub(2)         // Output 998.4
'1000.4':sub('2')      // Output 998.4
```

##### Kết quả
Đầu ra là giá trị sau khi trừ.


#### 5. :mul(value)

##### Mô tả cú pháp
Nhân số hiện tại với giá trị chỉ định.
Tham số:
- value: Số nhân

##### Ví dụ
```
1000.4:mul(2)         // Output 2000.8
'1000.4':mul('2')      // Output 2000.8
```

##### Kết quả
Đầu ra là giá trị sau khi nhân.


#### 6. :div(value)

##### Mô tả cú pháp
Chia số hiện tại cho giá trị chỉ định.
Tham số:
- value: Số chia

##### Ví dụ
```
1000.4:div(2)         // Output 500.2
'1000.4':div('2')      // Output 500.2
```

##### Kết quả
Đầu ra là giá trị sau khi chia.


#### 7. :mod(value)

##### Mô tả cú pháp
Tính modulo (lấy dư) của số hiện tại với giá trị chỉ định.
Tham số:
- value: Số modulo

##### Ví dụ
```
4:mod(2)              // Output 0
3:mod(2)              // Output 1
```

##### Kết quả
Đầu ra là kết quả phép modulo.


#### 8. :abs

##### Mô tả cú pháp
Trả về giá trị tuyệt đối của số.

##### Ví dụ
```
-10:abs()             // Output 10
-10.54:abs()          // Output 10.54
10.54:abs()           // Output 10.54
'-200':abs()          // Output 200
```

##### Kết quả
Đầu ra là giá trị tuyệt đối.


#### 9. :ceil

##### Mô tả cú pháp
Làm tròn lên, tức trả về số nguyên nhỏ nhất lớn hơn hoặc bằng số hiện tại.

##### Ví dụ
```
10.05123:ceil()       // Output 11
1.05:ceil()           // Output 2
-1.05:ceil()          // Output -1
```

##### Kết quả
Đầu ra là số nguyên sau khi làm tròn.


#### 10. :floor

##### Mô tả cú pháp
Làm tròn xuống, tức trả về số nguyên lớn nhất nhỏ hơn hoặc bằng số hiện tại.

##### Ví dụ
```
10.05123:floor()      // Output 10
1.05:floor()          // Output 1
-1.05:floor()         // Output -2
```

##### Kết quả
Đầu ra là số nguyên sau khi làm tròn.


#### 11. :int

##### Mô tả cú pháp
Chuyển số thành số nguyên (không khuyến nghị sử dụng).

##### Ví dụ và kết quả
Tùy thuộc vào tình huống chuyển đổi cụ thể.


#### 12. :toEN

##### Mô tả cú pháp
Chuyển số sang định dạng tiếng Anh (dấu thập phân là '.'), không khuyến nghị sử dụng.

##### Ví dụ và kết quả
Tùy thuộc vào tình huống chuyển đổi cụ thể.


#### 13. :toFixed

##### Mô tả cú pháp
Chuyển số thành chuỗi, chỉ giữ số chữ số thập phân chỉ định, không khuyến nghị sử dụng.

##### Ví dụ và kết quả
Tùy thuộc vào tình huống chuyển đổi cụ thể.


#### 14. :toFR

##### Mô tả cú pháp
Chuyển số sang định dạng tiếng Pháp (dấu thập phân là ','), không khuyến nghị sử dụng.

##### Ví dụ và kết quả
Tùy thuộc vào tình huống chuyển đổi cụ thể.


