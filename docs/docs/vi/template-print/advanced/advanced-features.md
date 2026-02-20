:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Tính năng nâng cao

### Phân trang

#### 1. Cập nhật số trang

##### Cú pháp
Chỉ cần chèn vào phần mềm Office của bạn.

##### Ví dụ
Trong Microsoft Word:
- Sử dụng chức năng "Chèn → Số trang"
Trong LibreOffice:
- Sử dụng chức năng "Chèn → Trường → Số trang"

##### Kết quả
Trong báo cáo được tạo, số trang trên mỗi trang sẽ tự động cập nhật.

#### 2. Tạo mục lục

##### Cú pháp
Chỉ cần chèn vào phần mềm Office của bạn.

##### Ví dụ
Trong Microsoft Word:
- Sử dụng chức năng "Chèn → Chỉ mục và Bảng → Mục lục"
Trong LibreOffice:
- Sử dụng chức năng "Chèn → Mục lục và Chỉ mục → Mục lục, Chỉ mục hoặc Thư mục tham khảo"

##### Kết quả
Mục lục của báo cáo được tạo sẽ tự động cập nhật dựa trên nội dung tài liệu.

#### 3. Lặp lại tiêu đề bảng

##### Cú pháp
Chỉ cần chèn vào phần mềm Office của bạn.

##### Ví dụ
Trong Microsoft Word:
- Nhấp chuột phải vào tiêu đề bảng → Thuộc tính Bảng → Đánh dấu chọn "Lặp lại làm hàng tiêu đề ở đầu mỗi trang"
Trong LibreOffice:
- Nhấp chuột phải vào tiêu đề bảng → Thuộc tính Bảng → Thẻ Luồng văn bản → Đánh dấu chọn "Lặp lại tiêu đề"

##### Kết quả
Khi bảng trải dài qua nhiều trang, tiêu đề bảng sẽ tự động lặp lại ở đầu mỗi trang.

### Quốc tế hóa (i18n)

#### 1. Dịch văn bản tĩnh

##### Cú pháp
Sử dụng thẻ `{t(văn bản)}` để quốc tế hóa văn bản tĩnh:
```
{t(meeting)}
```

##### Ví dụ
Trong template:
```
{t(meeting)} {t(apples)}
```
Dữ liệu JSON hoặc từ điển bản địa hóa bên ngoài (ví dụ: cho "fr-fr") cung cấp các bản dịch tương ứng, chẳng hạn như "meeting" → "rendez-vous", "apples" → "Pommes".

##### Kết quả
Khi tạo báo cáo, văn bản sẽ được thay thế bằng bản dịch tương ứng dựa trên ngôn ngữ đích.

#### 2. Dịch văn bản động

##### Cú pháp
Đối với nội dung dữ liệu, bạn có thể sử dụng bộ định dạng `:t`, ví dụ:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Ví dụ
Trong template:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Dữ liệu JSON và từ điển bản địa hóa cung cấp các bản dịch phù hợp.

##### Kết quả
Dựa trên điều kiện, kết quả sẽ là "lundi" hoặc "mardi" (lấy ví dụ bằng ngôn ngữ đích).

### Ánh xạ khóa-giá trị

#### 1. Chuyển đổi Enum (:convEnum)

##### Cú pháp
```
{dữ liệu:convEnum(tênEnum)}
```
Ví dụ:
```
0:convEnum('ORDER_STATUS')
```

##### Ví dụ
Trong ví dụ về tùy chọn API, dữ liệu được truyền vào như sau:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Trong template:
```
0:convEnum('ORDER_STATUS')
```

##### Kết quả
Kết quả xuất ra là "pending"; nếu chỉ mục vượt quá phạm vi enum, giá trị gốc sẽ được xuất ra.

### Hình ảnh động
:::info
Hiện tại hỗ trợ các loại tệp XLSX, DOCX
:::
Bạn có thể chèn "hình ảnh động" vào các template tài liệu. Điều này có nghĩa là các hình ảnh giữ chỗ (placeholder) trong template sẽ tự động được thay thế bằng hình ảnh thực tế dựa trên dữ liệu khi rendering. Quá trình này rất đơn giản, chỉ cần:

1. Chèn một hình ảnh tạm thời làm hình ảnh giữ chỗ (placeholder).
2. Chỉnh sửa "Văn bản thay thế (Alt Text)" của hình ảnh đó để đặt nhãn trường.
3. Rendering tài liệu, hệ thống sẽ tự động thay thế hình ảnh giữ chỗ bằng hình ảnh thực tế.

Dưới đây, chúng ta sẽ cùng tìm hiểu cách thực hiện cho DOCX và XLSX thông qua các ví dụ cụ thể.

#### Chèn hình ảnh động vào tệp DOCX
##### Thay thế một hình ảnh

1. Mở template DOCX của bạn và chèn một hình ảnh tạm thời (có thể là bất kỳ hình ảnh giữ chỗ nào, ví dụ như [hình ảnh màu xanh lam thuần túy](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Hướng dẫn định dạng hình ảnh**

- Hiện tại, hình ảnh giữ chỗ chỉ hỗ trợ định dạng PNG. Chúng tôi khuyến nghị sử dụng hình ảnh ví dụ được cung cấp: [hình ảnh màu xanh lam thuần túy](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- Hình ảnh đích khi rendering chỉ hỗ trợ các định dạng PNG, JPG, JPEG. Các loại hình ảnh khác có thể không rendering thành công.

**Hướng dẫn kích thước hình ảnh**

Dù là DOCX hay XLSX, kích thước hình ảnh cuối cùng khi rendering sẽ theo kích thước của hình ảnh tạm thời trong template. Điều này có nghĩa là hình ảnh thực tế được thay thế sẽ tự động điều chỉnh kích thước để khớp với hình ảnh giữ chỗ mà bạn đã chèn. Nếu bạn muốn hình ảnh sau khi rendering có kích thước 150×150, vui lòng sử dụng một hình ảnh tạm thời trong template và điều chỉnh nó về kích thước đó.
:::

2. Nhấp chuột phải vào hình ảnh này, chỉnh sửa "Văn bản thay thế (Alt Text)" của nó, và điền nhãn trường hình ảnh bạn muốn chèn, ví dụ `{d.imageUrl}`:

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Sử dụng dữ liệu ví dụ sau để rendering:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. Sau khi rendering, hình ảnh tạm thời sẽ được thay thế bằng hình ảnh thực tế:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Thay thế nhiều hình ảnh theo vòng lặp

Nếu bạn muốn chèn một nhóm hình ảnh vào template, ví dụ như danh sách sản phẩm, bạn cũng có thể thực hiện bằng cách lặp. Các bước cụ thể như sau:
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

2. Thiết lập vùng lặp trong template DOCX, và chèn hình ảnh tạm thời vào mỗi mục lặp, với văn bản thay thế được đặt là `{d.products[i].imageUrl}`, như hình dưới đây:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Sau khi rendering, tất cả các hình ảnh tạm thời sẽ được thay thế bằng hình ảnh dữ liệu tương ứng:

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Chèn hình ảnh động vào tệp XLSX

Cách thao tác trong template Excel (XLSX) về cơ bản là tương tự, chỉ cần lưu ý một vài điểm sau:

1. Sau khi chèn hình ảnh, hãy đảm bảo rằng bạn chọn "hình ảnh trong ô" chứ không phải hình ảnh nổi trên ô.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Sau khi chọn ô, nhấp để xem "Văn bản thay thế (Alt Text)" và điền nhãn trường, ví dụ `{d.imageUrl}`.

### Mã vạch
:::info
Hiện tại hỗ trợ các loại tệp XLSX, DOCX
:::

#### Tạo mã vạch (ví dụ mã QR)

Việc tạo mã vạch tương tự như hình ảnh động, chỉ cần ba bước:

1. Chèn một hình ảnh tạm thời vào template để đánh dấu vị trí mã vạch.
2. Chỉnh sửa "Văn bản thay thế (Alt Text)" của hình ảnh, điền nhãn trường định dạng mã vạch, ví dụ `{d.code:barcode(qrcode)}`, trong đó `qrcode` là loại mã vạch (xem danh sách hỗ trợ bên dưới).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Sau khi rendering, hình ảnh giữ chỗ đó sẽ tự động được thay thế bằng hình ảnh mã vạch tương ứng:

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Các loại mã vạch được hỗ trợ

| Tên mã vạch | Loại   |
| ----------- | ------ |
| Mã QR       | qrcode |