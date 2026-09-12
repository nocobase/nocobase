---
title: "Component Field quan hệ"
description: "Component Field quan hệ: cấu hình và cách sử dụng chung của các Field liên kết như BelongsTo, HasMany, BelongsToMany."
keywords: "Field quan hệ,Association,BelongsTo,HasMany,BelongsToMany,Interface Builder,NocoBase"
---

# Component Field quan hệ

## Giới thiệu

Component Field quan hệ của NocoBase được thiết kế để giúp bạn hiển thị và xử lý dữ liệu liên kết tốt hơn. Bất kể loại quan hệ nào, các component này đều linh hoạt và đa năng, bạn có thể chọn và cấu hình các component này theo nhu cầu cụ thể.

### Select dropdown

Ngoại trừ tất cả các Field quan hệ có Table mục tiêu là Table tập tin, component mặc định ở trạng thái chỉnh sửa đều là Select dropdown, các tùy chọn dropdown hiển thị giá trị của Field tiêu đề, phù hợp với các trường hợp chọn nhanh dữ liệu liên kết bằng cách hiển thị thông tin một Field quan trọng.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Xem thêm tại [Select dropdown](/interface-builder/fields/specific/select)

### Data Picker

Data Picker hiển thị dữ liệu dưới dạng Popup, bạn có thể cấu hình các Field cần hiển thị (bao gồm cả Field quan hệ của quan hệ) trong Data Picker, từ đó chọn dữ liệu liên kết một cách chính xác hơn.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Xem thêm tại [Data Picker](/interface-builder/fields/specific/picker)

### Sub-Form

Khi xử lý dữ liệu quan hệ phức tạp hơn, việc sử dụng Select dropdown hoặc Data Picker sẽ không tiện lợi. Trong trường hợp này, bạn cần thường xuyên mở Popup. Đối với trường hợp này, bạn có thể sử dụng Sub-Form, cho phép bạn duy trì các Field của Table quan hệ trực tiếp trên Trang hoặc Popup hiện tại mà không cần phải mở Popup mới nhiều lần, quy trình thao tác mượt mà hơn. Quan hệ nhiều cấp được hiển thị dưới dạng Form lồng nhau.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Xem thêm tại [Sub-Form](/interface-builder/fields/specific/sub-form)

### Sub-Table

Sub-Table hiển thị các bản ghi quan hệ một-nhiều hoặc nhiều-nhiều dưới dạng Table. Nó cung cấp một cách rõ ràng, có cấu trúc để hiển thị và quản lý dữ liệu liên kết, hỗ trợ tạo dữ liệu hàng loạt hoặc chọn dữ liệu hiện có để liên kết.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Xem thêm tại [Sub-Table](/interface-builder/fields/specific/sub-table)

### Sub-Detail

Sub-Detail là component tương ứng của Sub-Form ở chế độ đọc, hỗ trợ hiển thị dữ liệu lồng nhau ở nhiều cấp quan hệ.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Xem thêm tại [Sub-Detail](/interface-builder/fields/specific/sub-detail)

### File Manager

File Manager là component Field quan hệ chuyên dùng để xử lý các Field quan hệ có Table mục tiêu là Table tập tin.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Xem thêm tại [File Manager](/interface-builder/fields/specific/file-manager)

### Tiêu đề

Component Field tiêu đề là component Field quan hệ được sử dụng ở chế độ đọc, bằng cách cấu hình Field tiêu đề có thể cấu hình component Field tương ứng.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Xem thêm tại [Tiêu đề](/interface-builder/fields/specific/title)
