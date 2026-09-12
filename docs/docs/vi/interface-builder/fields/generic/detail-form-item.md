---
title: "Field Chi tiết"
description: "Field Chi tiết: component Field chỉ đọc trong Block Chi tiết, hiển thị dữ liệu dưới dạng chỉ đọc."
keywords: "Field Chi tiết,DetailFormItem,hiển thị chỉ đọc,Block Chi tiết,Interface Builder,NocoBase"
---

# Field Chi tiết

## Giới thiệu

Cấu hình Field của Block Chi tiết, Block Danh sách, Block Lưới về cơ bản là giống nhau, chủ yếu kiểm soát hiển thị Field ở trạng thái đọc.

![20251025172851](https://static-docs.nocobase.com/20251025172851.png)

## Tùy chọn cấu hình Field

### Định dạng Field ngày tháng

![20251025173005](https://static-docs.nocobase.com/20251025173005.png)

Xem thêm tại [Định dạng ngày tháng](/interface-builder/fields/specific/date-picker)

### Định dạng Field số

![20251025173242](https://static-docs.nocobase.com/20251025173242.png)

Hỗ trợ chuyển đổi đơn vị đơn giản, dấu phân cách hàng nghìn, tiền tố và hậu tố, độ chính xác, ký hiệu khoa học.

Xem thêm tại [Định dạng số](/interface-builder/fields/field-settings/number-format)

### Bật mở khi nhấp

Ngoài Field quan hệ hỗ trợ mở Popup khi nhấp, các Field thông thường cũng có thể bật mở khi nhấp để làm điểm vào mở Popup, đồng thời còn có thể cấu hình cách mở Popup (Drawer, hộp thoại, Trang con).

![20251025173549](https://static-docs.nocobase.com/20251025173549.gif)

### Cách hiển thị khi nội dung tràn

Khi nội dung Field tràn chiều rộng, bạn có thể cấu hình cách hiển thị tràn

- Hiển thị rút gọn (mặc định)
- Xuống dòng

![20251025173917](https://static-docs.nocobase.com/20251025173917.png)

### Component Field

Một số Field hỗ trợ nhiều dạng hiển thị, có thể thực hiện bằng cách chuyển đổi component Field.

Ví dụ: component `URL` có thể chuyển sang component `Preview`.

![20251025174042](https://static-docs.nocobase.com/20251025174042.png)

Ví dụ: Field quan hệ có thể chuyển đổi các cách hiển thị khác nhau, từ component Field tiêu đề chuyển sang `Sub-Detail` để hiển thị nhiều nội dung Field quan hệ hơn.

![20251025174311](https://static-docs.nocobase.com/20251025174311.gif)

- [Chỉnh sửa tiêu đề Field](/interface-builder/fields/field-settings/edit-title)
- [Chỉnh sửa mô tả Field](/interface-builder/fields/field-settings/edit-description)
- [Chỉnh sửa thông tin gợi ý Field](/interface-builder/fields/field-settings/edit-tooltip)
