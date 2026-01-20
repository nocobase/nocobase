:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


### Định dạng Văn bản

Phần này cung cấp nhiều bộ định dạng khác nhau cho dữ liệu văn bản. Các phần dưới đây sẽ lần lượt giới thiệu cú pháp, ví dụ và kết quả của từng bộ định dạng.

#### 1. :lowerCase

##### Giải thích Cú pháp
Chuyển đổi tất cả các chữ cái thành chữ thường.

##### Ví dụ
```
'My Car':lowerCase()   // Outputs "my car"
'my car':lowerCase()   // Outputs "my car"
null:lowerCase()       // Outputs null
1203:lowerCase()       // Outputs 1203
```

##### Kết quả
Kết quả đầu ra của mỗi ví dụ được hiển thị như trong phần chú thích.

#### 2. :upperCase

##### Giải thích Cú pháp
Chuyển đổi tất cả các chữ cái thành chữ hoa.

##### Ví dụ
```
'My Car':upperCase()   // Outputs "MY CAR"
'my car':upperCase()   // Outputs "MY CAR"
null:upperCase()       // Outputs null
1203:upperCase()       // Outputs 1203
```

##### Kết quả
Kết quả đầu ra của mỗi ví dụ được hiển thị như trong phần chú thích.

#### 3. :ucFirst

##### Giải thích Cú pháp
Chỉ viết hoa chữ cái đầu tiên của chuỗi, các phần còn lại giữ nguyên.

##### Ví dụ
```
'My Car':ucFirst()     // Outputs "My Car"
'my car':ucFirst()     // Outputs "My car"
null:ucFirst()         // Outputs null
undefined:ucFirst()    // Outputs undefined
1203:ucFirst()         // Outputs 1203
```

##### Kết quả
Kết quả đầu ra được mô tả trong phần chú thích.

#### 4. :ucWords

##### Giải thích Cú pháp
Viết hoa chữ cái đầu tiên của mỗi từ trong chuỗi.

##### Ví dụ
```
'my car':ucWords()     // Outputs "My Car"
'My cAR':ucWords()     // Outputs "My CAR"
null:ucWords()         // Outputs null
undefined:ucWords()    // Outputs undefined
1203:ucWords()         // Outputs 1203
```

##### Kết quả
Kết quả đầu ra được hiển thị như trong các ví dụ.

#### 5. :print(message)

##### Giải thích Cú pháp
Luôn trả về thông báo được chỉ định, bất kể dữ liệu gốc là gì, hữu ích như một bộ định dạng dự phòng.
Tham số:
- **message:** Văn bản cần in.

##### Ví dụ
```
'My Car':print('hello!')   // Outputs "hello!"
'my car':print('hello!')   // Outputs "hello!"
null:print('hello!')       // Outputs "hello!"
1203:print('hello!')       // Outputs "hello!"
```

##### Kết quả
Trong tất cả các trường hợp, trả về chuỗi "hello!" được chỉ định.

#### 6. :printJSON

##### Giải thích Cú pháp
Chuyển đổi một đối tượng hoặc mảng thành chuỗi định dạng JSON.

##### Ví dụ
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Outputs "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Outputs ""my car""
```

##### Kết quả
Kết quả đầu ra là chuỗi định dạng JSON đã được chuyển đổi từ dữ liệu đã cho.

#### 7. :unaccent

##### Giải thích Cú pháp
Loại bỏ các dấu phụ (dấu trọng âm) khỏi văn bản, chuyển đổi nó thành định dạng không dấu.

##### Ví dụ
```
'crÃ¨me brulÃ©e':unaccent()   // Outputs "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Outputs "CREME BRULEE"
'Ãªtre':unaccent()           // Outputs "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Outputs "euieea"
```

##### Kết quả
Tất cả các ví dụ đều cho ra văn bản đã loại bỏ dấu phụ.

#### 8. :convCRLF

##### Giải thích Cú pháp
Chuyển đổi các ký tự xuống dòng và về đầu dòng (`\r\n` hoặc `\n`) trong văn bản thành các thẻ ngắt dòng dành riêng cho tài liệu. Điều này hữu ích cho các định dạng như DOCX, PPTX, ODT, ODP và ODS.
**Lưu ý:** Khi sử dụng `:html` trước bộ định dạng `:convCRLF`, `\r\n` sẽ được chuyển đổi thành thẻ `<br>`.

##### Ví dụ
```
// For ODT format:
'my blue 
 car':convCRLF()    // Outputs "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Outputs "my blue <text:line-break/> car"

// For DOCX format:
'my blue 
 car':convCRLF()    // Outputs "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Outputs "my blue </w:t><w:br/><w:t> car"
```

##### Kết quả
Kết quả đầu ra hiển thị các ký hiệu ngắt dòng phù hợp với định dạng tài liệu đích.

#### 9. :substr(begin, end, wordMode)

##### Giải thích Cú pháp
Thực hiện các thao tác cắt chuỗi, bắt đầu từ chỉ mục `begin` (dựa trên 0) và kết thúc ngay trước chỉ mục `end`.
Tham số tùy chọn `wordMode` (giá trị boolean hoặc `last`) dùng để kiểm soát việc có giữ nguyên từ hay không, tránh cắt ngang giữa chừng.

##### Ví dụ
```
'foobar':substr(0, 3)            // Outputs "foo"
'foobar':substr(1)               // Outputs "oobar"
'foobar':substr(-2)              // Outputs "ar"
'foobar':substr(2, -1)           // Outputs "oba"
'abcd efg hijklm':substr(0, 11, true)  // Outputs "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Outputs "abcd efg "
```

##### Kết quả
Kết quả đầu ra là chuỗi con được trích xuất theo các tham số đã cho.

#### 10. :split(delimiter)

##### Giải thích Cú pháp
Tách một chuỗi thành một mảng bằng cách sử dụng ký tự phân tách `delimiter` được chỉ định.
Tham số:
- **delimiter:** Chuỗi ký tự phân tách.

##### Ví dụ
```
'abcdefc12':split('c')    // Outputs ["ab", "def", "12"]
1222.1:split('.')         // Outputs ["1222", "1"]
'ab/cd/ef':split('/')      // Outputs ["ab", "cd", "ef"]
```

##### Kết quả
Kết quả ví dụ là một mảng đã được tách bởi ký tự phân tách đã cho.

#### 11. :padl(targetLength, padString)

##### Giải thích Cú pháp
Đệm các ký tự được chỉ định vào bên trái của chuỗi cho đến khi chuỗi cuối cùng đạt độ dài `targetLength`.
Nếu độ dài mục tiêu nhỏ hơn độ dài chuỗi gốc, chuỗi gốc sẽ được trả về.
Tham số:
- **targetLength:** Tổng độ dài mong muốn.
- **padString:** Chuỗi dùng để đệm (mặc định là một khoảng trắng).

##### Ví dụ
```
'abc':padl(10)              // Outputs "       abc"
'abc':padl(10, 'foo')       // Outputs "foofoofabc"
'abc':padl(6, '123465')     // Outputs "123abc"
'abc':padl(8, '0')          // Outputs "00000abc"
'abc':padl(1)               // Outputs "abc"
```

##### Kết quả
Mỗi ví dụ đều cho ra chuỗi đã được đệm bên trái tương ứng.

#### 12. :padr(targetLength, padString)

##### Giải thích Cú pháp
Đệm các ký tự được chỉ định vào bên phải của chuỗi cho đến khi chuỗi cuối cùng đạt độ dài `targetLength`.
Các tham số tương tự như đối với `:padl`.

##### Ví dụ
```
'abc':padr(10)              // Outputs "abc       "
'abc':padr(10, 'foo')       // Outputs "abcfoofoof"
'abc':padr(6, '123465')     // Outputs "abc123"
'abc':padr(8, '0')          // Outputs "abc00000"
'abc':padr(1)               // Outputs "abc"
```

##### Kết quả
Kết quả đầu ra hiển thị chuỗi đã được đệm bên phải.

#### 13. :ellipsis(maximum)

##### Giải thích Cú pháp
Nếu văn bản vượt quá số ký tự được chỉ định, dấu ba chấm ("...") sẽ được thêm vào cuối.
Tham số:
- **maximum:** Số ký tự tối đa được phép.

##### Ví dụ
```
'abcdef':ellipsis(3)      // Outputs "abc..."
'abcdef':ellipsis(6)      // Outputs "abcdef"
'abcdef':ellipsis(10)     // Outputs "abcdef"
```

##### Kết quả
Các ví dụ hiển thị văn bản đã được cắt bớt và thêm dấu ba chấm nếu cần.

#### 14. :prepend(textToPrepend)

##### Giải thích Cú pháp
Thêm văn bản tiền tố được chỉ định vào đầu chuỗi.
Tham số:
- **textToPrepend:** Văn bản tiền tố.

##### Ví dụ
```
'abcdef':prepend('123')     // Outputs "123abcdef"
```

##### Kết quả
Kết quả đầu ra hiển thị văn bản đã được thêm tiền tố.

#### 15. :append(textToAppend)

##### Giải thích Cú pháp
Thêm văn bản hậu tố được chỉ định vào cuối chuỗi.
Tham số:
- **textToAppend:** Văn bản hậu tố.

##### Ví dụ
```
'abcdef':append('123')      // Outputs "abcdef123"
```

##### Kết quả
Kết quả đầu ra hiển thị văn bản đã được thêm hậu tố.

#### 16. :replace(oldText, newText)

##### Giải thích Cú pháp
Thay thế tất cả các lần xuất hiện của `oldText` trong văn bản bằng `newText`.
Tham số:
- **oldText:** Văn bản cần thay thế.
- **newText:** Văn bản mới để thay thế.
  **Lưu ý:** Nếu `newText` là `null`, điều đó có nghĩa là mục khớp sẽ bị xóa.

##### Ví dụ
```
'abcdef abcde':replace('cd', 'OK')    // Outputs "abOKef abOKe"
'abcdef abcde':replace('cd')          // Outputs "abef abe"
'abcdef abcde':replace('cd', null)      // Outputs "abef abe"
'abcdef abcde':replace('cd', 1000)      // Outputs "ab1000ef ab1000e"
```

##### Kết quả
Kết quả đầu ra là chuỗi sau khi đã thay thế các đoạn được chỉ định.

#### 17. :len

##### Giải thích Cú pháp
Trả về độ dài của một chuỗi hoặc một mảng.

##### Ví dụ
```
'Hello World':len()     // Outputs 11
'':len()                // Outputs 0
[1,2,3,4,5]:len()       // Outputs 5
[1,'Hello']:len()       // Outputs 2
```

##### Kết quả
Kết quả đầu ra là giá trị độ dài tương ứng.

#### 18. :t

##### Giải thích Cú pháp
Dịch văn bản bằng cách sử dụng từ điển dịch.
Các ví dụ và kết quả phụ thuộc vào cấu hình từ điển dịch thực tế.

#### 19. :preserveCharRef

##### Giải thích Cú pháp
Theo mặc định, một số ký tự không hợp lệ trong XML (như `&`, `>`, `<`, v.v.) sẽ bị xóa. Bộ định dạng này có thể giữ nguyên các tham chiếu ký tự (ví dụ: `&#xa7;` vẫn giữ nguyên), phù hợp cho các kịch bản tạo XML cụ thể.
Các ví dụ và kết quả phụ thuộc vào trường hợp sử dụng cụ thể.