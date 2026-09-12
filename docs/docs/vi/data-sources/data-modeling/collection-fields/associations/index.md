---
title: "Trường quan hệ"
description: "Trường quan hệ được dùng để thiết lập liên kết giữa các bảng dữ liệu, hỗ trợ các loại quan hệ một-một, một-nhiều, nhiều-một, nhiều-nhiều và nhiều-nhiều dạng mảng."
keywords: "Trường quan hệ,BelongsTo,HasMany,O2O,O2M,M2O,M2M,Trường liên kết,NocoBase"
---

# Trường quan hệ

Trong NocoBase, **trường quan hệ** được dùng để thiết lập liên kết giữa các bảng dữ liệu khác nhau. Trường này cho phép một bản ghi tham chiếu đến một bản ghi trong bảng khác hoặc tham chiếu đến nhiều bản ghi, chẳng hạn như đơn hàng liên kết với khách hàng, nhiệm vụ liên kết với người phụ trách, sinh viên liên kết với khóa học.

Trường quan hệ không hoàn toàn giống với trường thông thường. Trường thông thường thường tương ứng với một cột thực trong cơ sở dữ liệu, dùng để lưu các giá trị văn bản, số, ngày tháng; còn trường quan hệ lưu cấu hình liên kết giữa các bảng và các khóa dùng để xác định bản ghi liên quan. Đối với cơ sở dữ liệu chính, trường quan hệ có thể tạo cấu hình quan hệ cần thiết khi tạo trường; đối với cơ sở dữ liệu bên ngoài, quan hệ thường được thiết lập dựa trên khóa chính, khóa ngoại hoặc trường duy nhất có sẵn, và sẽ không tự động sửa đổi cấu trúc bảng của cơ sở dữ liệu bên ngoài.

## Lựa chọn loại quan hệ

Các loại quan hệ phổ biến như sau:

| Loại quan hệ | Trường hợp sử dụng |
| --- | --- |
| [Một-một](./o2o/index.md) | Một bản ghi chỉ liên kết với một bản ghi trong bảng khác. Ví dụ: nhân viên liên kết với một hồ sơ tuyển dụng. |
| [Một-nhiều](./o2m/index.md) | Một bản ghi liên kết với nhiều bản ghi trong bảng khác. Ví dụ: khách hàng liên kết với nhiều đơn hàng. |
| [Nhiều-một](./m2o/index.md) | Nhiều bản ghi liên kết với cùng một bản ghi đích. Ví dụ: nhiều đơn hàng liên kết với cùng một khách hàng. |
| [Nhiều-nhiều](./m2m/index.md) | Hai bảng có thể liên kết với nhiều bản ghi của nhau. Ví dụ: sinh viên và khóa học liên kết với nhau. |
| [Nhiều-nhiều (mảng)](../../../field-m2m-array/index.md) | Dùng trường dạng mảng để lưu mã định danh của nhiều bản ghi đích, phù hợp với các trường hợp trong đó cấu trúc bảng hiện có đã dùng mảng để lưu các giá trị liên kết. |

Trước tiên, hãy xác định dựa trên ngữ nghĩa nghiệp vụ: nếu bản ghi hiện tại chỉ thuộc về một bản ghi đích, thường dùng nhiều-một; nếu bản ghi hiện tại cần hiển thị nhiều bản ghi trong bảng đích, thường dùng một-nhiều; nếu cả hai bên đều có thể liên kết với nhiều bản ghi, thường dùng nhiều-nhiều.

## Các điểm cần lưu ý khi cấu hình

Khi cấu hình trường quan hệ, cần xác nhận các nội dung sau:

- Bảng dữ liệu đích: quan hệ cần liên kết với bảng nào
- Loại quan hệ: một-một, một-nhiều, nhiều-một, nhiều-nhiều hoặc nhiều-nhiều dạng mảng
- Khóa quan hệ: sử dụng những trường nào để xác định bản ghi ở hai bên, thường là khóa chính, khóa ngoại hoặc trường duy nhất
- Trường tiêu đề: trường nào của bản ghi liên quan sẽ được hiển thị mặc định trong bộ chọn và các khối

:::warning Lưu ý

Trường quan hệ trong cơ sở dữ liệu bên ngoài chủ yếu là siêu dữ liệu quan hệ do NocoBase lưu trữ. Việc thêm trường quan hệ sẽ không tự động tạo khóa ngoại, chỉ mục hoặc bảng trung gian thực trong cơ sở dữ liệu bên ngoài. Nếu cần ràng buộc khóa ngoại ở cấp cơ sở dữ liệu, hãy hoàn tất trước ở phía cơ sở dữ liệu, sau đó quay lại NocoBase để đồng bộ và cấu hình trường.

:::

## Liên kết liên quan

- [Một-một](./o2o/index.md) — Xem cấu hình trường quan hệ một-một
- [Một-nhiều](./o2m/index.md) — Xem cấu hình trường quan hệ một-nhiều
- [Nhiều-một](./m2o/index.md) — Xem cấu hình trường quan hệ nhiều-một
- [Nhiều-nhiều](./m2m/index.md) — Xem cấu hình trường quan hệ nhiều-nhiều
- [Nhiều-nhiều (mảng)](../../../field-m2m-array/index.md) — Xem quan hệ nhiều-nhiều dạng mảng
