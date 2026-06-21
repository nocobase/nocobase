---
title: "Cấu hình nâng cao"
description: "Cấu hình nâng cao: các tùy chọn runtime như giao dịch, thử lại khi thất bại, timeout, đồng thời, giúp tối ưu độ ổn định và hiệu suất thực thi."
keywords: "workflow,cấu hình nâng cao,Options,giao dịch,thử lại khi thất bại,timeout,đồng thời,NocoBase"
---

# Cấu hình nâng cao

## Cấu hình timeout

Từ phiên bản `2.1.0`, Workflow hỗ trợ cấu hình thời gian timeout, dùng để giới hạn thời lượng tối đa của một lần thực thi từ lúc bắt đầu xử lý đến khi kết thúc. Cấu hình timeout phù hợp để tránh việc Workflow chiếm dụng tài nguyên thực thi quá lâu do chạy trong thời gian dài, chờ xử lý thủ công hoặc chờ callback bên ngoài.

Trong popup tạo mới hoặc chỉnh sửa Workflow, mở rộng "Tùy chọn nâng cao" để cấu hình "Cấu hình timeout":

![20260604212454](https://static-docs.nocobase.com/20260604212454.png)

Các mục có thể cấu hình như sau:

- Nhập `0` nghĩa là không giới hạn thời gian timeout (giá trị mặc định).
- Nhập giá trị lớn hơn `0` nghĩa là bật giới hạn timeout. Giao diện hỗ trợ chọn giây, phút, giờ, ngày làm đơn vị.
- Thời gian timeout tối đa có thể đặt là 180 ngày.

### Quy tắc tính thời gian

Thời gian timeout bắt đầu tính từ khi Workflow lần đầu đi vào bộ xử lý. Sau khi Workflow được kích hoạt, nếu vẫn đang chờ điều phối trong hàng đợi, hoặc được lưu tạm để khởi động trì hoãn, thời gian này sẽ không tiêu hao thời gian timeout.

Sau khi đi vào bộ xử lý, thời gian timeout sẽ tiếp tục được tính, bao gồm thời gian thực thi thực tế của Node và cả thời gian của các Node đã đi vào trạng thái chờ, ví dụ như xử lý thủ công, phê duyệt, trì hoãn, chờ callback bên ngoài... Thời gian timeout sẽ không tạm dừng khi Workflow tạm dừng để chờ thao tác của người dùng.

Thời điểm hết hạn timeout được xác định khi lần thực thi này bắt đầu. Việc sửa cấu hình timeout của Workflow chỉ ảnh hưởng đến các lần thực thi bắt đầu xử lý sau đó, không tính lại các lần thực thi đã bắt đầu.

### Xử lý sau khi timeout

Nếu đến thời gian timeout mà lần thực thi này vẫn chưa kết thúc, hệ thống sẽ chấm dứt lần thực thi đó:

- Trạng thái lịch sử thực thi sẽ chuyển thành "Đã chấm dứt", lý do chấm dứt hiển thị là "Đã timeout".
- Các tác vụ Node đang chạy hoặc đang chờ sẽ được đánh dấu là "Đã chấm dứt".
- Các Node phía sau sẽ không tiếp tục thực thi.
- Nếu dưới lần thực thi này còn có lần thực thi subflow đang chạy, subflow cũng sẽ bị chấm dứt cùng với lần thực thi cha.

Ví dụ:

- Khi Node vòng lặp thực thi một vòng lặp quá dài, các xử lý bên trong vòng lặp đều khá tốn thời gian, dẫn đến thời gian thực thi của toàn bộ Node vòng lặp vượt quá thời gian timeout đã cấu hình, thì Node vòng lặp đang chạy và các Node bên trong sẽ bị bắt buộc chấm dứt, các Node phía sau sẽ không tiếp tục thực thi.
- Khi Node xử lý thủ công hoặc phê duyệt chờ quá lâu và vượt quá thời gian timeout đã cấu hình, Node xử lý thủ công đang chờ sẽ bị bắt buộc chấm dứt, các Node phía sau sẽ không tiếp tục thực thi, và các tác vụ liên quan cũng sẽ bị hủy.

:::info{title=Mẹo}
Cấu hình timeout là giới hạn toàn cục cho toàn bộ lần thực thi Workflow, không phải timeout riêng của một Node. Nếu chỉ cần giới hạn thời gian chờ của một Node như HTTP Request hoặc JavaScript Script, hãy sử dụng cấu hình timeout riêng của Node tương ứng.
:::

:::info{title=Mẹo}
Nếu cần triển khai xử lý giới hạn thời gian ở cấp nghiệp vụ, ví dụ "nếu phiếu công việc không có ai xử lý trong 10 phút thì cập nhật thành đã timeout", thông thường nên dùng [Node trì hoãn](../nodes/delay.md) kết hợp với nhánh song song để biên soạn xử lý tiếp theo. Timeout toàn cục sẽ trực tiếp chấm dứt lần thực thi hiện tại, phù hợp để làm cơ chế bảo vệ dự phòng, không phù hợp để gánh các nhánh nghiệp vụ tiếp theo.
:::

## Chế độ thực thi

Workflow dựa trên loại Trigger được chọn khi tạo sẽ thực thi theo cách "bất đồng bộ" hoặc "đồng bộ". Chế độ bất đồng bộ có nghĩa là sau khi sự kiện cụ thể được kích hoạt, sẽ vào hàng đợi của Workflow và được bộ điều phối trong nền thực thi tuần tự, còn chế độ đồng bộ sau khi được kích hoạt sẽ không vào hàng đợi điều phối mà trực tiếp bắt đầu thực thi và phản hồi ngay sau khi thực thi xong.

Sự kiện bảng dữ liệu, sự kiện sau Action, sự kiện Action tùy chỉnh, sự kiện tác vụ định kỳ và sự kiện phê duyệt sẽ mặc định thực thi theo cách bất đồng bộ, sự kiện trước Action sẽ mặc định thực thi theo cách đồng bộ. Trong đó sự kiện bảng dữ liệu và sự kiện form đều hỗ trợ cả hai chế độ, có thể chọn khi tạo Workflow:

![Chế độ đồng bộ_Tạo Workflow đồng bộ](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Mẹo}
Workflow ở chế độ đồng bộ bị giới hạn bởi chế độ của nó, bên trong không thể sử dụng các Node có thể sinh ra trạng thái "Chờ", ví dụ như "Xử lý thủ công"...
:::

## Tự động xóa lịch sử

Khi Workflow được kích hoạt khá thường xuyên, bạn có thể cấu hình tự động xóa lịch sử để giảm nhiễu, đồng thời cũng giúp giảm áp lực lưu trữ của cơ sở dữ liệu.

Tương tự, trong popup tạo mới và chỉnh sửa Workflow có thể cấu hình quy trình tương ứng có tự động xóa lịch sử hay không:

![Cấu hình tự động xóa lịch sử](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Tự động xóa có thể được cấu hình theo trạng thái kết quả thực thi, trong đa số trường hợp, khuyến nghị chỉ chọn trạng thái "Hoàn tất" để giữ lại các bản ghi thực thi thất bại nhằm dễ dàng kiểm tra vấn đề về sau.

Khuyến nghị không bật tự động xóa lịch sử khi đang debug Workflow để có thể thông qua lịch sử kiểm tra logic thực thi của Workflow có đúng như mong đợi không.

:::info{title=Mẹo}
Việc xóa lịch sử Workflow không làm giảm số lần Workflow đã được thực thi.
:::
