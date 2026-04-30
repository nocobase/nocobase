---
title: "Field Table"
description: "Field Table: component cột trong Block Table, hỗ trợ tùy chỉnh render cột, sắp xếp, lọc."
keywords: "Field Table,TableColumn,cột Table,render cột,Interface Builder,NocoBase"
---

# Field Table

## Giới thiệu

Field Table ngoài việc hỗ trợ điều chỉnh độ rộng cột, tiêu đề Field, sắp xếp, v.v., đối với các Field cụ thể (như Field ngày tháng, Field quan hệ, Field số) còn hỗ trợ cấu hình hiển thị cá nhân hóa hơn.

![20251024174558](https://static-docs.nocobase.com/20251024174558.png)

## Tùy chọn cấu hình Field

### Định dạng Field ngày tháng

![20251024175303](https://static-docs.nocobase.com/20251024175303.png)

Xem thêm tại [Định dạng ngày tháng](/interface-builder/fields/specific/date-picker)

### Định dạng Field số

Hỗ trợ chuyển đổi đơn vị đơn giản, dấu phân cách hàng nghìn, tiền tố và hậu tố, độ chính xác, ký hiệu khoa học.

![20251024175445](https://static-docs.nocobase.com/20251024175445.png)

Xem thêm tại [Định dạng số](/interface-builder/fields/field-settings/number-format)

### Bật chỉnh sửa nhanh

Khi bật chỉnh sửa nhanh, khi di chuột qua cột này sẽ xuất hiện nút chỉnh sửa, nhấp vào để chỉnh sửa nhanh và lưu dữ liệu trong Popup.

![20251025171158](https://static-docs.nocobase.com/20251025171158.gif)

### Bật mở khi nhấp

Ngoài Field quan hệ hỗ trợ mở Popup khi nhấp, các Field thông thường cũng có thể bật mở khi nhấp để làm điểm vào mở Popup.

![20251025172308](https://static-docs.nocobase.com/20251025172308.gif)

### Cách hiển thị khi nội dung tràn

Khi nội dung cột tràn chiều rộng cột Table, bạn có thể cấu hình cách hiển thị tràn

- Hiển thị rút gọn (mặc định)
- Xuống dòng

![20251025172549](https://static-docs.nocobase.com/20251025172549.png)

### Cố định cột

![20251025170858](https://static-docs.nocobase.com/20251025170858.gif)

### Component Field

Một số Field hỗ trợ nhiều dạng hiển thị, bạn có thể chuyển đổi component Field để đạt được các hiệu ứng hiển thị khác nhau, đáp ứng nhu cầu trong các kịch bản khác nhau. Ví dụ, Field kiểu **URL** có thể chuyển sang component **Preview** để hiển thị nội dung liên kết hoặc xem trước hình ảnh tốt hơn.

![20251025171658](https://static-docs.nocobase.com/20251025171658.png)

### Kiểu hiển thị

- Tag
- Văn bản

![20251025172723](https://static-docs.nocobase.com/20251025172723.png)

### Có thể sắp xếp

Hiện tại hầu hết các loại Field đều hỗ trợ Sắp xếp phía server, khi bật sắp xếp, hỗ trợ sắp xếp dữ liệu theo thứ tự giảm/tăng dần theo Field mục tiêu

![20251125221247](https://static-docs.nocobase.com/20251125221247.png)

#### Sắp xếp Field trong Block Table

![20251125221425](https://static-docs.nocobase.com/20251125221425.gif)

#### Sắp xếp Field Sub-Table trong Block Chi tiết

![20251125221949](https://static-docs.nocobase.com/20251125221949.gif)
