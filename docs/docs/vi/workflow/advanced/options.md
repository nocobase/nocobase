---
title: "Cấu hình nâng cao"
description: "Cấu hình nâng cao: các tùy chọn runtime như giao dịch, thử lại khi thất bại, timeout, đồng thời, giúp tối ưu độ ổn định và hiệu suất thực thi."
keywords: "workflow,cấu hình nâng cao,Options,giao dịch,thử lại khi thất bại,timeout,đồng thời,NocoBase"
---

# Cấu hình nâng cao

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
