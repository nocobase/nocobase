---
title: "Template In ấn - Định dạng trường media"
description: "Formatter Định dạng trường media Template In ấn: attachment và signature dùng để xuất hình ảnh tệp đính kèm và hình ảnh chữ ký tay trong Template."
keywords: "Template In ấn,Trường media,attachment,signature,NocoBase"
---

### Định dạng trường media

#### 1. :attachment

##### Mô tả cú pháp

Xuất hình ảnh trong trường tệp đính kèm. Thường có thể trực tiếp sao chép biến từ "Danh sách trường".

##### Ví dụ

```text
{d.contractFiles[0].id:attachment()}
```

##### Kết quả

Xuất hình ảnh tệp đính kèm tương ứng.

#### 2. :signature

##### Mô tả cú pháp

Xuất hình ảnh chữ ký liên kết với trường chữ ký tay. Thường có thể trực tiếp sao chép biến từ "Danh sách trường".

##### Ví dụ

```text
{d.customerSignature:signature()}
```

##### Kết quả

Xuất hình ảnh chữ ký tay tương ứng.

> **Lưu ý:** Đối với trường tệp đính kèm và trường chữ ký tay, khuyến nghị trực tiếp sao chép biến từ danh sách trường trong "Cấu hình Template", tránh viết tay sai sót.
