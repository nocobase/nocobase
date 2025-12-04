:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


### Định dạng số

#### 1. :formatN(precision)

##### Giải thích cú pháp
Định dạng số theo cài đặt bản địa hóa.  
Tham số:
- `precision`: Số chữ số thập phân.  
  Đối với định dạng ODS/XLSX, số chữ số thập phân hiển thị được xác định bởi trình soạn thảo văn bản; các định dạng khác sẽ phụ thuộc vào tham số này.

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "en-us" }
'10':formatN()         // Kết quả "10.000"
'1000.456':formatN()   // Kết quả "1,000.456"
```

##### Kết quả
Số được xuất ra theo độ chính xác và định dạng bản địa hóa đã chỉ định.


#### 2. :round(precision)

##### Giải thích cú pháp
Làm tròn số, tham số chỉ định số chữ số thập phân.

##### Ví dụ
```
10.05123:round(2)      // Kết quả 10.05
1.05:round(1)          // Kết quả 1.1
```

##### Kết quả
Kết quả là giá trị đã được làm tròn.


#### 3. :add(value)

##### Giải thích cú pháp
Cộng giá trị đã chỉ định vào số hiện tại.  
Tham số:
- `value`: Số cần cộng.

##### Ví dụ
```
1000.4:add(2)         // Kết quả 1002.4
'1000.4':add('2')      // Kết quả 1002.4
```

##### Kết quả
Kết quả là tổng của các số.


#### 4. :sub(value)

##### Giải thích cú pháp
Trừ giá trị đã chỉ định khỏi số hiện tại.  
Tham số:
- `value`: Số cần trừ.

##### Ví dụ
```
1000.4:sub(2)         // Kết quả 998.4
'1000.4':sub('2')      // Kết quả 998.4
```

##### Kết quả
Kết quả là hiệu của các số.


#### 5. :mul(value)

##### Giải thích cú pháp
Nhân số hiện tại với giá trị đã chỉ định.  
Tham số:
- `value`: Số nhân.

##### Ví dụ
```
1000.4:mul(2)         // Kết quả 2000.8
'1000.4':mul('2')      // Kết quả 2000.8
```

##### Kết quả
Kết quả là tích của các số.


#### 6. :div(value)

##### Giải thích cú pháp
Chia số hiện tại cho giá trị đã chỉ định.  
Tham số:
- `value`: Số chia.

##### Ví dụ
```
1000.4:div(2)         // Kết quả 500.2
'1000.4':div('2')      // Kết quả 500.2
```

##### Kết quả
Kết quả là thương của phép chia.


#### 7. :mod(value)

##### Giải thích cú pháp
Tính toán số dư (modulo) của số hiện tại khi chia cho giá trị đã chỉ định.  
Tham số:
- `value`: Số chia lấy dư.

##### Ví dụ
```
4:mod(2)              // Kết quả 0
3:mod(2)              // Kết quả 1
```

##### Kết quả
Kết quả là số dư của phép toán modulo.


#### 8. :abs

##### Giải thích cú pháp
Trả về giá trị tuyệt đối của số.

##### Ví dụ
```
-10:abs()             // Kết quả 10
-10.54:abs()          // Kết quả 10.54
10.54:abs()           // Kết quả 10.54
'-200':abs()          // Kết quả 200
```

##### Kết quả
Kết quả là giá trị tuyệt đối.


#### 9. :ceil

##### Giải thích cú pháp
Làm tròn lên, tức là trả về số nguyên nhỏ nhất lớn hơn hoặc bằng số hiện tại.

##### Ví dụ
```
10.05123:ceil()       // Kết quả 11
1.05:ceil()           // Kết quả 2
-1.05:ceil()          // Kết quả -1
```

##### Kết quả
Kết quả là số nguyên đã được làm tròn lên.


#### 10. :floor

##### Giải thích cú pháp
Làm tròn xuống, tức là trả về số nguyên lớn nhất nhỏ hơn hoặc bằng số hiện tại.

##### Ví dụ
```
10.05123:floor()      // Kết quả 10
1.05:floor()          // Kết quả 1
-1.05:floor()         // Kết quả -2
```

##### Kết quả
Kết quả là số nguyên đã được làm tròn xuống.


#### 11. :int

##### Giải thích cú pháp
Chuyển đổi số thành số nguyên (không khuyến nghị sử dụng).

##### Ví dụ và Kết quả
Tùy thuộc vào trường hợp chuyển đổi cụ thể.


#### 12. :toEN

##### Giải thích cú pháp
Chuyển đổi số sang định dạng tiếng Anh (dấu thập phân là '.'). Không khuyến nghị sử dụng.

##### Ví dụ và Kết quả
Tùy thuộc vào trường hợp chuyển đổi cụ thể.


#### 13. :toFixed

##### Giải thích cú pháp
Chuyển đổi số thành chuỗi, chỉ giữ lại số chữ số thập phân đã chỉ định. Không khuyến nghị sử dụng.

##### Ví dụ và Kết quả
Tùy thuộc vào trường hợp chuyển đổi cụ thể.


#### 14. :toFR

##### Giải thích cú pháp
Chuyển đổi số sang định dạng tiếng Pháp (dấu thập phân là ','). Không khuyến nghị sử dụng.

##### Ví dụ và Kết quả
Tùy thuộc vào trường hợp chuyển đổi cụ thể.