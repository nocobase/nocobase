---
title: "Template In ấn - Tính năng nâng cao"
description: "Tính năng nâng cao Template In ấn: cập nhật số trang, sinh mục lục, kiểm soát phân trang, cách chèn Word và LibreOffice."
keywords: "Template In ấn,Tính năng nâng cao,Số trang,Mục lục,Phân trang,NocoBase"
---

## Tính năng nâng cao

### Phân trang

#### 1. Cập nhật số trang

##### Cú pháp
Chèn trong phần mềm Office là được.

##### Ví dụ
Trong Microsoft Word:
- Sử dụng tính năng "Insert → Page Number"
  Trong LibreOffice:
- Sử dụng tính năng "Insert → Field → Page Number"

##### Kết quả
Trong báo cáo được sinh ra, số trang của mỗi trang sẽ tự động cập nhật.


#### 2. Sinh mục lục

##### Cú pháp
Chèn trong phần mềm Office là được.

##### Ví dụ
Trong Microsoft Word:
- Sử dụng tính năng "Insert → Index and Tables → Table of Contents"
  Trong LibreOffice:
- Sử dụng tính năng "Insert → Table of Contents and Index → Table of Contents, Index or Bibliography"

##### Kết quả
Mục lục báo cáo được sinh ra sẽ tự động cập nhật theo nội dung tài liệu.


#### 3. Lặp lại header bảng

##### Cú pháp
Chèn trong phần mềm Office là được.

##### Ví dụ
Trong Microsoft Word:
- Nhấn chuột phải vào header → Table Properties → Tích "Repeat as header row at the top of each page"
  Trong LibreOffice:
- Nhấn chuột phải vào header → Table Properties → Tab Text Flow → Tích "Repeat heading"

##### Kết quả
Khi bảng vượt qua trang, header sẽ tự động lặp lại ở đầu mỗi trang.


### Quốc tế hóa (i18n)

#### 1. Dịch văn bản tĩnh

##### Cú pháp
Sử dụng nhãn `{t(văn bản)}` để quốc tế hóa văn bản tĩnh:
```
{t(meeting)}
```

##### Ví dụ
Trong Template:
```
{t(meeting)} {t(apples)}
```
Cung cấp bản dịch tương ứng trong dữ liệu JSON hoặc từ điển bản địa hóa bên ngoài (ví dụ cho "fr-fr"), như "meeting" → "rendez-vous", "apples" → "Pommes".

##### Kết quả
Khi sinh báo cáo, văn bản sẽ được thay thế bằng bản dịch tương ứng theo ngôn ngữ đích.


#### 2. Dịch văn bản động

##### Cú pháp
Đối với nội dung dữ liệu có thể sử dụng Formatter `:t`, ví dụ:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Ví dụ
Trong Template:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Cung cấp bản dịch tương ứng trong dữ liệu JSON và từ điển bản địa hóa.

##### Kết quả
Theo điều kiện đánh giá, xuất "lundi" hoặc "mardi" (lấy ngôn ngữ đích làm ví dụ).


### Ánh xạ key-value

#### 1. Chuyển đổi enum (:convEnum)

##### Cú pháp
```
{Dữ liệu:convEnum(tên enum)}
```
Ví dụ:
```
0:convEnum('ORDER_STATUS')
```

##### Ví dụ
Trong API options ví dụ truyền vào:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Trong Template:
```
0:convEnum('ORDER_STATUS')
```

##### Kết quả
Xuất "pending"; nếu index vượt quá phạm vi enum, thì xuất giá trị gốc.


### Hình ảnh động
:::info
Hiện tại hỗ trợ file loại XLSX, DOCX
:::
Bạn có thể chèn "hình ảnh động" trong Template tài liệu, nghĩa là, hình ảnh placeholder trong Template sẽ tự động được thay thế bằng hình ảnh thực khi render dựa trên dữ liệu. Quá trình này rất đơn giản, chỉ cần:

1. Chèn một hình ảnh tạm làm placeholder

2. Chỉnh sửa "Alt Text" của hình ảnh đó để thiết lập nhãn trường

3. Render tài liệu, hệ thống tự động thay thế nó bằng hình ảnh thực

Dưới đây chúng ta sẽ thông qua ví dụ cụ thể lần lượt giải thích cách thao tác cho DOCX và XLSX.


#### Chèn hình ảnh động trong file DOCX
##### Thay thế một hình ảnh

1. Mở Template DOCX của bạn, chèn một hình ảnh tạm (có thể là bất kỳ hình ảnh placeholder nào, ví dụ [hình ảnh màu xanh thuần](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png))

:::info
**Hướng dẫn định dạng hình ảnh**

- Hiện tại hình ảnh placeholder chỉ hỗ trợ hình ảnh loại PNG, khuyến nghị sử dụng hình ảnh ví dụ chúng tôi cung cấp [hình ảnh màu xanh thuần](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)
- Hình ảnh render mục tiêu chỉ hỗ trợ hình ảnh PNG, JPG, JPEG, các loại hình ảnh khác có thể render thất bại.

**Hướng dẫn kích thước hình ảnh**

Dù là DOCX hay XLSX, kích thước hình ảnh khi render cuối cùng, sẽ kế thừa kích thước hình ảnh tạm trong Template. Nghĩa là, hình ảnh thực được thay thế vào sẽ tự động co giãn để có cùng kích thước với hình placeholder bạn đã chèn. Nếu bạn muốn kích thước hình ảnh sau render là 150×150, vui lòng sử dụng một hình ảnh tạm trong Template và điều chỉnh kích thước đó.
:::

2. Nhấn chuột phải vào hình ảnh này, chỉnh sửa "Alt Text" của nó, điền nhãn trường hình ảnh bạn muốn chèn, ví dụ `{d.imageUrl}`:

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Sử dụng dữ liệu ví dụ sau để render:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. Kết quả sau khi render, hình ảnh tạm sẽ được thay thế bằng hình ảnh thực:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Thay thế nhiều hình ảnh vòng lặp

Nếu bạn muốn chèn một nhóm hình ảnh trong Template, ví dụ danh sách Sản phẩm, cũng có thể triển khai bằng cách vòng lặp, các bước cụ thể như sau:
1. Giả sử dữ liệu của bạn như sau:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. Trong Template DOCX thiết lập vùng vòng lặp, và chèn hình ảnh tạm trong mỗi mục vòng lặp, đặt Alt Text thành `{d.products[i].imageUrl}`, như hình dưới:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Sau khi render, tất cả hình ảnh tạm sẽ được thay thế bằng hình ảnh dữ liệu tương ứng:

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Chèn hình ảnh động trong file XLSX

Trong Template Excel (XLSX) cách thao tác về cơ bản giống nhau, chỉ cần lưu ý các điểm sau:

1. Sau khi chèn hình ảnh, vui lòng đảm bảo cái được chọn là "hình ảnh trong ô", chứ không phải hình ảnh nổi trên ô.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Sau khi chọn ô nhấn xem "Alt Text" để điền nhãn trường, ví dụ `{d.imageUrl}`.

### Mã vạch
:::info
Hiện tại hỗ trợ file loại XLSX, DOCX
:::

#### Sinh mã vạch (như mã QR)

Cách sinh mã vạch giống như hình ảnh động, chỉ cần ba bước:

1. Chèn một hình ảnh tạm trong Template, dùng để đánh dấu vị trí mã vạch

2. Chỉnh sửa "Alt Text" của hình ảnh, viết nhãn trường định dạng mã vạch, ví dụ `{d.code:barcode(qrcode)}`, trong đó `qrcode` là loại mã vạch (xem danh sách hỗ trợ ở dưới)

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Sau khi render, hình ảnh placeholder sẽ tự động được thay thế bằng hình ảnh mã vạch tương ứng:

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Loại mã vạch được hỗ trợ

| Tên mã vạch | Loại   |
| -------- | ------ |
| Mã QR   | qrcode |



