---
title: "Template In ấn - Định dạng mảng"
description: "Formatter Định dạng mảng Template In ấn: arrayJoin để ghép mảng thành chuỗi, hỗ trợ tham số dấu phân cách, index, số lượng."
keywords: "Template In ấn,Định dạng mảng,arrayJoin,NocoBase"
---

### Định dạng mảng

#### 1. :arrayJoin(separator, index, count)

##### Mô tả cú pháp
Ghép một mảng chuỗi hoặc số thành một chuỗi.
Tham số:
- separator: Dấu phân cách (mặc định là dấu phẩy `,`)
- index: Tùy chọn, bắt đầu ghép từ index này
- count: Tùy chọn, số mục ghép từ index (có thể là số âm, biểu thị đếm từ cuối)

##### Ví dụ
```
['homer','bart','lisa']:arrayJoin()              // Output "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Output "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Output "homerbartlisa"
[10,50]:arrayJoin()                               // Output "10, 50"
[]:arrayJoin()                                    // Output ""
null:arrayJoin()                                  // Output null
{}:arrayJoin()                                    // Output {}
20:arrayJoin()                                    // Output 20
undefined:arrayJoin()                             // Output undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Output "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Output "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Output "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Output "homerbart"
```

##### Kết quả
Đầu ra là chuỗi được ghép theo các tham số.


#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Mô tả cú pháp
Chuyển mảng object thành chuỗi, không xử lý object hoặc mảng lồng nhau.
Tham số:
- objSeparator: Dấu phân cách giữa các object (mặc định là `, `)
- attSeparator: Dấu phân cách giữa các thuộc tính object (mặc định là `:`)
- attributes: Tùy chọn, chỉ định danh sách thuộc tính object cần xuất

##### Ví dụ
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Output "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Output "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Output "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Output "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Output "2:homer"

['homer','bart','lisa']:arrayMap()    // Output "homer, bart, lisa"
[10,50]:arrayMap()                    // Output "10, 50"
[]:arrayMap()                         // Output ""
null:arrayMap()                       // Output null
{}:arrayMap()                         // Output {}
20:arrayMap()                         // Output 20
undefined:arrayMap()                  // Output undefined
```

##### Kết quả
Đầu ra là chuỗi được ghép, bỏ qua nội dung lồng nhau trong object.


#### 3. :count(start)

##### Mô tả cú pháp
Đếm số hàng trong mảng, và xuất số hàng hiện tại.
Ví dụ:
```
{d[i].id:count()}
```
Bất kể giá trị của `id` là gì, đều xuất số hàng hiện tại.
Từ v4.0.0, Formatter này đã được thay thế nội bộ bằng `:cumCount`.

Tham số:
- start: Tùy chọn, giá trị bắt đầu đếm

##### Ví dụ và kết quả
Khi sử dụng cụ thể, số hàng đầu ra sẽ hiển thị theo thứ tự phần tử mảng.


