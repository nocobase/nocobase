:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


### Định dạng Mảng

#### 1. :arrayJoin(separator, index, count)

##### Giải thích Cú pháp
Nối một mảng các chuỗi hoặc số thành một chuỗi duy nhất.
Tham số:
- **separator:** Ký tự phân tách (mặc định là dấu phẩy `,`).
- **index:** Tùy chọn, chỉ mục bắt đầu để nối.
- **count:** Tùy chọn, số lượng phần tử cần nối bắt đầu từ `index` (có thể là số âm để đếm ngược từ cuối).

##### Ví dụ
```
['homer','bart','lisa']:arrayJoin()              // Outputs "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Outputs "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Outputs "homerbartlisa"
[10,50]:arrayJoin()                               // Outputs "10, 50"
[]:arrayJoin()                                    // Outputs ""
null:arrayJoin()                                  // Outputs null
{}:arrayJoin()                                    // Outputs {}
20:arrayJoin()                                    // Outputs 20
undefined:arrayJoin()                             // Outputs undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Outputs "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Outputs "homerbart"
```

##### Kết quả
Kết quả trả về là một chuỗi được tạo bằng cách nối các phần tử của mảng theo các tham số đã chỉ định.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Giải thích Cú pháp
Chuyển đổi một mảng các đối tượng thành một chuỗi. Hàm này không xử lý các đối tượng hoặc mảng lồng nhau.
Tham số:
- **objSeparator:** Ký tự phân tách giữa các đối tượng (mặc định là `, `).
- **attSeparator:** Ký tự phân tách giữa các thuộc tính của đối tượng (mặc định là `:`).
- **attributes:** Tùy chọn, danh sách các thuộc tính của đối tượng cần xuất.

##### Ví dụ
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Outputs "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Outputs "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Outputs "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Outputs "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Outputs "2:homer"

['homer','bart','lisa']:arrayMap()    // Outputs "homer, bart, lisa"
[10,50]:arrayMap()                    // Outputs "10, 50"
[]:arrayMap()                         // Outputs ""
null:arrayMap()                       // Outputs null
{}:arrayMap()                         // Outputs {}
20:arrayMap()                         // Outputs 20
undefined:arrayMap()                  // Outputs undefined
```

##### Kết quả
Kết quả trả về là một chuỗi được tạo bằng cách ánh xạ và nối các phần tử của mảng, bỏ qua nội dung đối tượng lồng nhau.

#### 3. :count(start)

##### Giải thích Cú pháp
Đếm số thứ tự dòng trong một mảng và xuất ra số thứ tự dòng hiện tại.
Ví dụ:
```
{d[i].id:count()}
```
Bất kể giá trị của `id` là gì, hàm này đều xuất ra số đếm dòng hiện tại.
Kể từ phiên bản v4.0.0, bộ định dạng này đã được thay thế nội bộ bằng `:cumCount`.

Tham số:
- **start:** Tùy chọn, giá trị bắt đầu cho việc đếm.

##### Ví dụ và Kết quả
Khi sử dụng, số thứ tự dòng được xuất ra sẽ hiển thị theo thứ tự các phần tử của mảng.