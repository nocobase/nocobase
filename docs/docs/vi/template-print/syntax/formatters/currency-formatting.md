---
title: "Template In ấn - Định dạng tiền tệ"
description: "Formatter Định dạng tiền tệ Template In ấn: formatC để Định dạng số tiền, hỗ trợ số chữ số thập phân, tiền tệ đích, nhiều định dạng đầu ra."
keywords: "Template In ấn,Định dạng tiền tệ,formatC,NocoBase"
---

### Định dạng tiền tệ

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Mô tả cú pháp
Định dạng số tiền, có thể chỉ định số chữ số thập phân hoặc định dạng đầu ra cụ thể.
Tham số:
- precisionOrFormat: Tham số tùy chọn, có thể là số (chỉ định số chữ số thập phân), cũng có thể là mã định dạng cụ thể:
  - Số nguyên: Thay đổi độ chính xác thập phân mặc định
  - `'M'`: Chỉ xuất tên tiền tệ chính
  - `'L'`: Xuất số kèm ký hiệu tiền tệ (mặc định)
  - `'LL'`: Xuất số kèm tên tiền tệ chính
- targetCurrency: Tùy chọn, mã tiền tệ đích (chữ hoa, như USD, EUR), sẽ ghi đè cài đặt toàn cục

##### Ví dụ
```
'1000.456':formatC()      // Output "$2,000.91"
'1000.456':formatC('M')    // Output "dollars"
'1':formatC('M')           // Output "dollar"
'1000':formatC('L')        // Output "$2,000.00"
'1000':formatC('LL')       // Output "2,000.00 dollars"
```

##### Kết quả
Kết quả đầu ra dựa trên các tùy chọn API và cài đặt tỷ giá.


#### 2. :convCurr(target, source)

##### Mô tả cú pháp
Chuyển đổi số từ một loại tiền tệ sang loại tiền tệ khác. Tỷ giá có thể truyền qua tùy chọn API hoặc cài đặt toàn cục.
Nếu không chỉ định tham số, tự động chuyển đổi từ `options.currencySource` sang `options.currencyTarget`.
Tham số:
- target: Tùy chọn, mã tiền tệ đích (mặc định bằng `options.currencyTarget`)
- source: Tùy chọn, mã tiền tệ nguồn (mặc định bằng `options.currencySource`)

##### Ví dụ
```
10:convCurr()              // Output 20
1000:convCurr()            // Output 2000
1000:convCurr('EUR')        // Output 1000
1000:convCurr('USD')        // Output 2000
1000:convCurr('USD', 'USD') // Output 1000
```

##### Kết quả
Đầu ra là giá trị tiền tệ sau khi chuyển đổi.


