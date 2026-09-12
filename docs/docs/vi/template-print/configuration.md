---
title: "Cấu hình Template In ấn"
description: "Cấu hình Template In ấn NocoBase: kích hoạt tính năng Template In ấn cho Block chi tiết và Block bảng, cấu hình Template."
keywords: "Template In ấn,Cấu hình,configuration,NocoBase"
---

## Hướng dẫn cấu hình

### Kích hoạt tính năng Template In ấn
Template In ấn hiện hỗ trợ Block chi tiết và Block bảng, dưới đây sẽ giới thiệu cách cấu hình của hai loại Block này.

#### Block chi tiết

1. **Mở Block chi tiết**:
- Trong ứng dụng, vào Block chi tiết cần sử dụng tính năng Template In ấn.

2. **Vào menu Cấu hình Action**:
- Phía trên giao diện, nhấn menu "Cấu hình Action".

3. **Chọn "Template In ấn"**:
- Trong menu thả xuống, nhấn tùy chọn "Template In ấn" để kích hoạt tính năng Plugin.

![Kích hoạt Template In ấn](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Cấu hình Template

1. **Vào trang cấu hình Template**:
- Trong menu cấu hình của nút "Template In ấn", chọn tùy chọn "Cấu hình Template".

![Tùy chọn cấu hình Template](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2. **Thêm Template mới**:
- Nhấn nút "Thêm Template" để vào trang thêm Template.

![Nút thêm Template](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3. **Điền thông tin Template**:
- Trong form Template, điền tên Template, chọn loại Template (Word, Excel, PowerPoint).
- Tải lên file Template tương ứng (hỗ trợ định dạng `.docx`, `.xlsx`, `.pptx`).

![Cấu hình tên và file Template](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4. **Chỉnh sửa và lưu Template**:
- Vào trang "Danh sách trường", sao chép trường, và điền vào Template
  ![Danh sách trường](https://static-docs.nocobase.com/20250107141010.png)
  ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
- Template In ấn đã hỗ trợ **trường tệp đính kèm** và **trường chữ ký tay**, danh sách trường sẽ tự động sinh biểu thức Template tương ứng.
- Nếu muốn xuất hình ảnh trong Template, khuyến nghị luôn sao chép biến trực tiếp từ "Danh sách trường", không nên viết tay biểu thức `:attachment()` hoặc `:signature()`.
- Sau khi điền xong, nhấn nút "Lưu" để hoàn thành thêm Template.

5. **Quản lý Template**:
- Nhấn nút "Sử dụng" bên phải danh sách Template, có thể kích hoạt Template.
- Nhấn nút "Chỉnh sửa", có thể sửa tên Template hoặc thay file Template.
- Nhấn nút "Tải xuống", có thể tải xuống file Template đã cấu hình.
- Nhấn nút "Xóa", có thể loại bỏ Template không còn cần thiết. Hệ thống sẽ nhắc nhở xác nhận thao tác để tránh xóa nhầm.
  ![Quản lý Template](https://static-docs.nocobase.com/20250107140436.png)

#### Block bảng

Cách sử dụng của Block bảng và Block chi tiết về cơ bản giống nhau, khác biệt là:
1. Hỗ trợ in nhiều bản ghi: Cần tích chọn các bản ghi muốn in trước, có thể in tối đa 100 bản ghi cùng lúc.

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2. Quản lý cách ly Template: Template của Block bảng và Block chi tiết không thông dụng với nhau — vì cấu trúc dữ liệu khác nhau (một là object, một là array).


