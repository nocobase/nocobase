---
pkg: '@nocobase/plugin-gantt'
title: 'Khối Gantt'
description: 'Khối Gantt hiển thị ngày bắt đầu, ngày kết thúc và tiến độ của bản ghi trên dòng thời gian. Khối này phù hợp cho lập kế hoạch dự án, lên lịch công việc và theo dõi cột mốc, đồng thời hỗ trợ trường tiêu đề, trường ngày, trường tiến độ, trường màu, thang thời gian, bảng bên trái và popup sự kiện.'
keywords: 'Khối Gantt,Gantt,lập kế hoạch dự án,lên lịch công việc,dòng thời gian,quản lý tiến độ,xây dựng giao diện,NocoBase'
---

# Khối Gantt

## Giới thiệu

Khối Gantt hiển thị ngày bắt đầu, ngày kết thúc và tiến độ của bản ghi trên dòng thời gian. Khối này phù hợp cho lập kế hoạch dự án, lên lịch công việc, theo dõi cột mốc và các tình huống cần xem khoảng thời gian của công việc theo thời gian.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_30_AM.png)

## Cài đặt

Khối này là plugin tích hợp sẵn, không cần cài đặt thêm.

## Thêm khối

Sau khi chọn khối Gantt và chỉ định bảng dữ liệu, hãy cấu hình các trường cần thiết trong popup:

1. Chọn trường tiêu đề, dùng để hiển thị tên công việc
2. Chọn trường ngày bắt đầu, dùng để xác định thời điểm bắt đầu công việc
3. Chọn trường ngày kết thúc, dùng để xác định thời điểm kết thúc công việc
4. Nếu cần, chọn trường tiến độ, dùng để hiển thị và kéo để cập nhật tiến độ công việc
5. Nếu cần, chọn trường màu, dùng để phân biệt các công việc khác nhau
6. Chọn thang thời gian, dùng để điều khiển độ chi tiết của dòng thời gian

Sau khi hoàn tất cấu hình, bạn có thể tạo khối Gantt.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM%20(1).png>)

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM.png)

## Cài đặt khối

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_28_AM.png)

### Trường Gantt

Các trường Gantt quyết định cách bản ghi được ánh xạ thành công việc trên dòng thời gian.

Bao gồm:

- Trường tiêu đề quyết định tên hiển thị trên thanh công việc
- Trường ngày bắt đầu quyết định vị trí bắt đầu của thanh công việc
- Trường ngày kết thúc quyết định vị trí kết thúc của thanh công việc
- Trường tiến độ quyết định tiến độ hiển thị bên trong thanh công việc
- Trường màu quyết định màu của thanh công việc
- Thang thời gian quyết định dòng thời gian hiển thị theo giờ, ngày, tuần, tháng, v.v.

### Trường tiêu đề

Dùng để hiển thị tên công việc. Thông thường bạn có thể chọn trường chuỗi như tên công việc, tên dự án hoặc tiêu đề.

### Trường ngày bắt đầu

Dùng để chỉ định thời điểm bắt đầu công việc. Khối Gantt dùng trường này để đặt công việc lên dòng thời gian.

### Trường ngày kết thúc

Dùng để chỉ định thời điểm kết thúc công việc. Khi ngày bắt đầu và ngày kết thúc giống nhau, công việc sẽ hiển thị như một khoảng thời gian ngắn hơn.

### Trường tiến độ

Dùng để hiển thị tiến độ hoàn thành công việc và hỗ trợ cập nhật bằng cách kéo tay nắm tiến độ trên thanh công việc.

Trường tiến độ dùng trường float. Dữ liệu được lưu từ `0` đến `1` và hiển thị dưới dạng phần trăm trong khối Gantt. Ví dụ, `0.6` sẽ hiển thị là `60%`.

### Trường màu

Dùng để đặt màu thanh công việc, giúp dễ phân biệt các loại, trạng thái hoặc mức độ ưu tiên của công việc.

Trường màu hỗ trợ:

- Trường chọn một
- Trường màu

Nếu dùng trường chọn một, khối Gantt sẽ ưu tiên dùng màu đã cấu hình cho tùy chọn được chọn.

### Thang thời gian

Dùng để điều khiển độ chi tiết hiển thị của dòng thời gian.

Hiện hỗ trợ:

- Giờ
- Một phần tư ngày
- Nửa ngày
- Ngày
- Tuần
- Tháng
- Năm
- Quý

Với công việc có khoảng thời gian ngắn, có thể dùng giờ, nửa ngày hoặc ngày. Với công việc có khoảng thời gian dài, có thể dùng tuần, tháng, quý hoặc năm.

### Hiển thị bảng

Khi bật, khối Gantt hiển thị khu vực bảng ở bên trái. Bạn có thể cấu hình cột bảng để hiển thị các thuộc tính chính của công việc.

Khi tắt, khối chỉ hiển thị dòng thời gian ở bên phải. Cách này phù hợp khi không gian trang bị giới hạn hoặc chỉ cần xem lịch trình.

### Chiều rộng bảng

Dùng để đặt chiều rộng khu vực bảng bên trái. Cài đặt này chỉ xuất hiện khi Hiển thị bảng được bật.

Nếu bảng có nhiều trường, bạn có thể tăng chiều rộng bảng. Nếu chỉ giữ lại một vài trường, có thể giảm chiều rộng để dành thêm không gian cho dòng thời gian.

### Bật kéo để lên lịch lại

Khi bật, bạn có thể kéo thanh công việc trên dòng thời gian để điều chỉnh ngày bắt đầu và ngày kết thúc.

Chi tiết:

- Kéo toàn bộ thanh công việc để đồng thời điều chỉnh ngày bắt đầu và ngày kết thúc
- Kéo tay nắm ở hai bên thanh công việc để điều chỉnh ngày bắt đầu hoặc ngày kết thúc
- Kéo tay nắm tiến độ để cập nhật trường tiến độ

Nếu không muốn người dùng chỉnh lịch trực tiếp trong khối Gantt, hãy tắt tùy chọn này.

### Cuộn đến hôm nay khi hiển thị lần đầu

Khi bật, khối Gantt sẽ tự động cuộn đến hôm nay khi được hiển thị lần đầu.

Tùy chọn này phù hợp với dự án có khoảng thời gian công việc dài. Khi mở trang, người dùng có thể thấy trước các công việc gần ngày hiện tại.

### Cài đặt popup sự kiện

Dùng để cấu hình cách mở thanh công việc sau khi được nhấp.

Bạn có thể cấu hình:

- Cách mở, như drawer, dialog hoặc page
- Kích thước popup
- Mẫu popup

Sau khi nhấp vào thanh công việc, NocoBase sẽ mở bản ghi hiện tại theo cấu hình này, giúp xem hoặc chỉnh sửa chi tiết công việc thuận tiện hơn.

### Phạm vi dữ liệu

Dùng để giới hạn dữ liệu hiển thị trong khối Gantt.

Ví dụ: chỉ hiển thị công việc thuộc dự án hiện tại, hoặc chỉ hiển thị công việc chưa hoàn thành.

Xem thêm tại [Phạm vi dữ liệu](../block-settings/data-scope).

### Kích thước trang

Dùng để kiểm soát số bản ghi tải trên mỗi trang. Khi có nhiều bản ghi, người dùng có thể chuyển trang để xem thêm công việc.

### Hiển thị số dòng

Khi bật, bảng bên trái hiển thị số dòng, giúp định vị bản ghi dễ hơn khi có nhiều công việc.

### Bảng cây

Nếu bảng dữ liệu hiện tại là bảng cây, khối Gantt có thể bật chế độ bảng cây. Sau khi bật, bảng bên trái hiển thị bản ghi theo phân cấp cha-con, và dòng thời gian bên phải cũng hiển thị công việc theo cùng phân cấp.

Trong chế độ bảng cây, bạn cũng có thể cấu hình Mặc định mở rộng tất cả các dòng.

## Cấu hình trường

Khu vực bảng bên trái dùng cột bảng để hiển thị trường của bản ghi.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM.png)

### Thêm trường

Sau khi bật Hiển thị bảng, bạn có thể thêm cột trường vào bảng bên trái. Cài đặt trường có thể tham khảo [Cột bảng](../../fields/generic/table-column).

### Cột thao tác

Khối Gantt mặc định có cột thao tác. Bạn có thể thêm các thao tác bản ghi như xem, sửa, xóa vào cột này.

Nếu đã cấu hình Cài đặt popup sự kiện, bạn cũng có thể nhấp trực tiếp vào thanh công việc bên phải để mở chi tiết bản ghi.

## Cấu hình thao tác

Khối Gantt hỗ trợ cấu hình thao tác toàn cục ở phía trên. Các loại thao tác có thể hiển thị sẽ thay đổi theo năng lực đang được bật trong môi trường hiện tại.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM%20(1).png>)

### Thao tác tích hợp

- Hôm nay: nhanh chóng cuộn đến hôm nay
- Mở rộng/Thu gọn: mở rộng hoặc thu gọn tất cả dòng trong chế độ bảng cây

### Thao tác toàn cục

- [Thêm mới](../../actions/types/add-new)
- [Popup](../../actions/types/pop-up)
- [Liên kết](../../actions/types/link)
- [Làm mới](../../actions/types/refresh)
- [Bộ lọc](../../actions/types/filter)
- [Sửa hàng loạt](../../actions/types/bulk-edit)
- [Cập nhật hàng loạt](../../actions/types/bulk-update)
- [Kích hoạt workflow](../../actions/types/trigger-workflow)
- [Yêu cầu tùy chỉnh](../../actions/types/custom-request)
- [JS Item](../../actions/types/js-item)
- [JS Action](../../actions/types/js-action)
- [Nhân viên AI](../../actions/types/ai-employee)
