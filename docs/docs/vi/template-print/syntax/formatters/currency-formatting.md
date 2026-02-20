:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


### Định dạng Tiền tệ

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Giải thích Cú pháp
Định dạng một số tiền tệ, cho phép bạn chỉ định số chữ số thập phân hoặc một định dạng đầu ra cụ thể.  
Tham số:
- `precisionOrFormat`: Tham số tùy chọn, có thể là một số (chỉ định số chữ số thập phân) hoặc một định danh định dạng cụ thể:
  - Một số nguyên: thay đổi độ chính xác thập phân mặc định.
  - `'M'`: chỉ xuất ra tên tiền tệ chính.
  - `'L'`: xuất ra số cùng với ký hiệu tiền tệ (mặc định).
  - `'LL'`: xuất ra số cùng với tên tiền tệ chính.
- `targetCurrency`: Tùy chọn; mã tiền tệ đích (viết hoa, ví dụ: USD, EUR), sẽ ghi đè các cài đặt toàn cục.

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Xuất ra "$2,000.91"
'1000.456':formatC('M')    // Xuất ra "dollars"
'1':formatC('M')           // Xuất ra "dollar"
'1000':formatC('L')        // Xuất ra "$2,000.00"
'1000':formatC('LL')       // Xuất ra "2,000.00 dollars"

// Ví dụ tiếng Pháp (khi cài đặt môi trường khác nhau):
'1000.456':formatC()      // Xuất ra "2 000,91 ..."  
'1000.456':formatC()      // Khi tiền tệ nguồn và tiền tệ đích giống nhau, xuất ra "1 000,46 €"
```

##### Kết quả
Kết quả đầu ra phụ thuộc vào các tùy chọn API và cài đặt tỷ giá hối đoái.


#### 2. :convCurr(target, source)

##### Giải thích Cú pháp
Chuyển đổi một số từ tiền tệ này sang tiền tệ khác. Tỷ giá hối đoái có thể được truyền qua các tùy chọn API hoặc được thiết lập toàn cục.  
Nếu không chỉ định tham số nào, việc chuyển đổi sẽ tự động được thực hiện từ `options.currencySource` sang `options.currencyTarget`.  
Tham số:
- `target`: Tùy chọn; mã tiền tệ đích (mặc định là `options.currencyTarget`).
- `source`: Tùy chọn; mã tiền tệ nguồn (mặc định là `options.currencySource`).

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Xuất ra 20
1000:convCurr()            // Xuất ra 2000
1000:convCurr('EUR')        // Xuất ra 1000
1000:convCurr('USD')        // Xuất ra 2000
1000:convCurr('USD', 'USD') // Xuất ra 1000
```

##### Kết quả
Đầu ra là giá trị tiền tệ đã được chuyển đổi.