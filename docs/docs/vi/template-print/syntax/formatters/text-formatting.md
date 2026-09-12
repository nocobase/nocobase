---
title: "Template In ấn - Định dạng văn bản"
description: "Formatter Định dạng văn bản Template In ấn: lowerCase, upperCase, trim, replace... và các chuyển đổi và xử lý văn bản."
keywords: "Template In ấn,Định dạng văn bản,lowerCase,upperCase,NocoBase"
---

### Định dạng văn bản

Cung cấp nhiều Formatter cho dữ liệu văn bản, dưới đây lần lượt giới thiệu cú pháp, ví dụ và kết quả của từng Formatter.

#### 1. :lowerCase

##### Mô tả cú pháp
Chuyển tất cả chữ cái thành chữ thường.

##### Ví dụ
```
'My Car':lowerCase()   // Output "my car"
'my car':lowerCase()   // Output "my car"
null:lowerCase()       // Output null
1203:lowerCase()       // Output 1203
```

##### Kết quả
Kết quả đầu ra của các ví dụ như được chỉ ra trong các comment.


#### 2. :upperCase

##### Mô tả cú pháp
Chuyển tất cả chữ cái thành chữ hoa.

##### Ví dụ
```
'My Car':upperCase()   // Output "MY CAR"
'my car':upperCase()   // Output "MY CAR"
null:upperCase()       // Output null
1203:upperCase()       // Output 1203
```

##### Kết quả
Kết quả đầu ra của các ví dụ như được chỉ ra trong các comment.


#### 3. :ucFirst

##### Mô tả cú pháp
Chỉ chuyển chữ cái đầu tiên của chuỗi thành chữ hoa, các chữ còn lại giữ nguyên.

##### Ví dụ
```
'My Car':ucFirst()     // Output "My Car"
'my car':ucFirst()     // Output "My car"
null:ucFirst()         // Output null
undefined:ucFirst()    // Output undefined
1203:ucFirst()         // Output 1203
```

##### Kết quả
Kết quả đầu ra xem mô tả comment.


#### 4. :ucWords

##### Mô tả cú pháp
Chuyển chữ cái đầu của mỗi từ trong chuỗi thành chữ hoa.

##### Ví dụ
```
'my car':ucWords()     // Output "My Car"
'My cAR':ucWords()     // Output "My CAR"
null:ucWords()         // Output null
undefined:ucWords()    // Output undefined
1203:ucWords()         // Output 1203
```

##### Kết quả
Kết quả đầu ra như ví dụ.


#### 5. :print(message)

##### Mô tả cú pháp
Luôn trả về thông điệp chỉ định, bất kể dữ liệu gốc là gì, dùng làm Formatter dự phòng.
Tham số:
- message: Văn bản cần in

##### Ví dụ
```
'My Car':print('hello!')   // Output "hello!"
'my car':print('hello!')   // Output "hello!"
null:print('hello!')       // Output "hello!"
1203:print('hello!')       // Output "hello!"
```

##### Kết quả
Đều trả về chuỗi "hello!" chỉ định.


#### 6. :printJSON

##### Mô tả cú pháp
Chuyển object hoặc mảng thành chuỗi định dạng JSON xuất ra.

##### Ví dụ
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Output "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Output ""my car""
```

##### Kết quả
Kết quả đầu ra trong ví dụ là chuỗi JSON sau khi chuyển đổi.


#### 7. :unaccent

##### Mô tả cú pháp
Loại bỏ dấu trong văn bản, làm cho văn bản trở thành định dạng không dấu.

##### Ví dụ
```
'crÃ¨me brulÃ©e':unaccent()   // Output "creme brulee"
'CRÃME BRULÃE':unaccent()   // Output "CREME BRULEE"
'Ãªtre':unaccent()           // Output "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Output "euieea"
```

##### Kết quả
Kết quả đầu ra của các ví dụ đều đã loại bỏ dấu.


#### 8. :convCRLF

##### Mô tả cú pháp
Chuyển ký tự xuống dòng (`
` hoặc `
`) trong văn bản thành dấu xuống dòng trong tài liệu, áp dụng cho các định dạng như DOCX, PPTX, ODT, ODP và ODS.
Lưu ý: Khi sử dụng `:html` trước Formatter `:convCRLF`, `
` sẽ được chuyển thành thẻ `<br>`.

##### Ví dụ
```
// Đối với định dạng ODT:
'my blue 
 car':convCRLF()    // Output "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Output "my blue <text:line-break/> car"

// Đối với định dạng DOCX:
'my blue 
 car':convCRLF()    // Output "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Output "my blue </w:t><w:br/><w:t> car"
```

##### Kết quả
Kết quả đầu ra hiển thị dấu xuống dòng theo các định dạng tài liệu khác nhau.


#### 9. :substr(begin, end, wordMode)

##### Mô tả cú pháp
Cắt chuỗi, bắt đầu từ index `begin` (dựa trên 0), kết thúc trước index `end`.
Tham số tùy chọn `wordMode` (boolean hoặc `last`) dùng để kiểm soát có giữ nguyên từ hay không, không ngắt giữa từ.

##### Ví dụ
```
'foobar':substr(0, 3)            // Output "foo"
'foobar':substr(1)               // Output "oobar"
'foobar':substr(-2)              // Output "ar"
'foobar':substr(2, -1)           // Output "oba"
'abcd efg hijklm':substr(0, 11, true)  // Output "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Output "abcd efg "
```

##### Kết quả
Theo các tham số khác nhau, đầu ra đoạn chuỗi tương ứng.


#### 10. :split(delimiter)

##### Mô tả cú pháp
Tách chuỗi thành mảng bằng dấu phân cách `delimiter` chỉ định.
Tham số:
- delimiter: Chuỗi phân cách

##### Ví dụ
```
'abcdefc12':split('c')    // Output ["ab", "def", "12"]
1222.1:split('.')         // Output ["1222", "1"]
'ab/cd/ef':split('/')      // Output ["ab", "cd", "ef"]
```

##### Kết quả
Kết quả ví dụ là mảng sau khi tách.


#### 11. :padl(targetLength, padString)

##### Mô tả cú pháp
Điền ký tự chỉ định vào bên trái chuỗi, làm cho chiều dài chuỗi cuối đạt `targetLength`.
Nếu chiều dài đích nhỏ hơn chiều dài chuỗi gốc, thì trả về chuỗi gốc.
Tham số:
- targetLength: Tổng chiều dài đích
- padString: Chuỗi dùng để điền, mặc định là khoảng trắng

##### Ví dụ
```
'abc':padl(10)              // Output "       abc"
'abc':padl(10, 'foo')       // Output "foofoofabc"
'abc':padl(6, '123465')     // Output "123abc"
'abc':padl(8, '0')          // Output "00000abc"
'abc':padl(1)               // Output "abc"
```

##### Kết quả
Đầu ra của các ví dụ là chuỗi sau khi điền.


#### 12. :padr(targetLength, padString)

##### Mô tả cú pháp
Điền ký tự chỉ định vào bên phải chuỗi, làm cho chiều dài chuỗi cuối đạt `targetLength`.
Tham số như trên.

##### Ví dụ
```
'abc':padr(10)              // Output "abc       "
'abc':padr(10, 'foo')       // Output "abcfoofoof"
'abc':padr(6, '123465')     // Output "abc123"
'abc':padr(8, '0')          // Output "abc00000"
'abc':padr(1)               // Output "abc"
```

##### Kết quả
Đầu ra là chuỗi sau khi điền bên phải.


#### 13. :ellipsis(maximum)

##### Mô tả cú pháp
Nếu văn bản vượt quá số ký tự chỉ định, thêm dấu chấm lửng "..." ở cuối.
Tham số:
- maximum: Số ký tự tối đa cho phép

##### Ví dụ
```
'abcdef':ellipsis(3)      // Output "abc..."
'abcdef':ellipsis(6)      // Output "abcdef"
'abcdef':ellipsis(10)     // Output "abcdef"
```

##### Kết quả
Kết quả ví dụ là văn bản bị cắt ngắn và thêm dấu chấm lửng.


#### 14. :prepend(textToPrepend)

##### Mô tả cú pháp
Thêm prefix chỉ định vào trước văn bản.
Tham số:
- textToPrepend: Văn bản prefix

##### Ví dụ
```
'abcdef':prepend('123')     // Output "123abcdef"
```

##### Kết quả
Đầu ra là chuỗi sau khi thêm prefix.


#### 15. :append(textToAppend)

##### Mô tả cú pháp
Thêm suffix chỉ định vào sau văn bản.
Tham số:
- textToAppend: Văn bản suffix

##### Ví dụ
```
'abcdef':append('123')      // Output "abcdef123"
```

##### Kết quả
Đầu ra là chuỗi sau khi thêm suffix.


#### 16. :replace(oldText, newText)

##### Mô tả cú pháp
Thay thế tất cả `oldText` khớp trong văn bản thành `newText`.
Tham số:
- oldText: Văn bản cũ cần thay thế
- newText: Văn bản mới được thay thế bằng
  Lưu ý: Nếu newText là null, nghĩa là xóa các mục khớp.

##### Ví dụ
```
'abcdef abcde':replace('cd', 'OK')    // Output "abOKef abOKe"
'abcdef abcde':replace('cd')          // Output "abef abe"
'abcdef abcde':replace('cd', null)      // Output "abef abe"
'abcdef abcde':replace('cd', 1000)      // Output "ab1000ef ab1000e"
```

##### Kết quả
Kết quả đầu ra là chuỗi sau khi thay thế.


#### 17. :len

##### Mô tả cú pháp
Trả về chiều dài của chuỗi hoặc mảng.

##### Ví dụ
```
'Hello World':len()     // Output 11
'':len()                // Output 0
[1,2,3,4,5]:len()       // Output 5
[1,'Hello']:len()       // Output 2
```

##### Kết quả
Đầu ra là giá trị chiều dài tương ứng.


#### 18. :t

##### Mô tả cú pháp
Dịch văn bản theo từ điển dịch.
Ví dụ và kết quả tùy thuộc vào cấu hình từ điển dịch thực tế.


#### 19. :preserveCharRef

##### Mô tả cú pháp
Mặc định, sẽ loại bỏ một số ký tự bất hợp pháp trong XML (như &, >, <...), Formatter này có thể giữ tham chiếu ký tự (ví dụ `&#xa7;` giữ nguyên), áp dụng cho kịch bản sinh XML cụ thể.
Ví dụ và kết quả tùy thuộc vào kịch bản sử dụng cụ thể.


