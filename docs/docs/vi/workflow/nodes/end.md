---
title: "Node Workflow - Kết thúc quy trình"
description: "Node kết thúc quy trình: ngay lập tức kết thúc Workflow và thoát với trạng thái thành công/thất bại được cấu hình, tương tự return."
keywords: "workflow,kết thúc quy trình,End,dừng quy trình,NocoBase"
---

# Kết thúc quy trình

Khi Node này được thực thi sẽ ngay lập tức kết thúc Workflow đang thực thi và kết thúc với trạng thái được cấu hình của Node. Thường được dùng để điều khiển luồng cho logic cụ thể, sau khi thỏa mãn một số điều kiện logic, thoát khỏi Workflow hiện tại và không tiếp tục xử lý quy trình tiếp theo. Có thể so sánh với chỉ thị `return` trong ngôn ngữ lập trình, được dùng để thoát khỏi hàm đang thực thi.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Kết thúc quy trình":

![Kết thúc quy trình_thêm](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Cấu hình Node

![Kết thúc quy trình_cấu hình Node](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Trạng thái kết thúc

Trạng thái kết thúc sẽ ảnh hưởng đến trạng thái cuối cùng của kế hoạch thực thi Workflow này, có thể được cấu hình là "Thành công" hoặc "Thất bại". Khi quy trình thực thi đến Node này sẽ thoát ngay với trạng thái được cấu hình.

:::info{title=Mẹo}
Khi sử dụng trong quy trình loại "Sự kiện trước Action", sẽ dẫn đến việc chặn request phát động Action. Xem chi tiết tại [hướng dẫn sử dụng "Sự kiện trước Action"](../triggers/pre-action).

Đồng thời, ngoài việc dẫn đến việc chặn request phát động Action, cấu hình trạng thái kết thúc còn ảnh hưởng đến trạng thái thông tin phản hồi của "Thông báo phản hồi" trong loại quy trình này.
:::
