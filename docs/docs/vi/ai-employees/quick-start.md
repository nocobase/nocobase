---
pkg: '@nocobase/plugin-ai'
title: 'Bắt đầu nhanh với AI Employee'
description: 'Hoàn thành cấu hình tối thiểu của AI Employee trong 5 phút: cài đặt Plugin, cấu hình mô hình LLM, kích hoạt AI Employee tích hợp sẵn và bắt đầu cộng tác. Bao gồm tổng quan các AI Employee có sẵn như Cole, Ellis, Dex, Viz.'
keywords: 'Bắt đầu nhanh AI Employee,Cấu hình AI NocoBase,Dịch vụ LLM,AI Employee tích hợp sẵn,Cole,Dex,Viz'
---

# Bắt đầu nhanh

Hãy dành 5 phút để hoàn thành cấu hình tối thiểu cho AI Employee.

## Cài đặt Plugin

AI Employee là Plugin tích hợp sẵn của NocoBase (`@nocobase/plugin-ai`), không cần cài đặt riêng.

## Cấu hình mô hình

Bạn có thể cấu hình dịch vụ LLM thông qua một trong các lối vào sau:

1. Lối vào quản trị: `Cài đặt hệ thống -> AI Employee -> Dịch vụ LLM`.
2. Lối tắt ở giao diện người dùng: Khi chọn mô hình trong bảng trò chuyện AI, nhấn vào lối tắt "Thêm dịch vụ LLM" để chuyển trực tiếp.

![20260425172540](https://static-docs.nocobase.com/20260425172540.png)

Thông thường bạn cần:

1. Chọn nhà cung cấp dịch vụ.
2. Điền API Key.
3. Cấu hình các mô hình được kích hoạt, mặc định sử dụng mô hình được khuyến nghị là đủ.

## Kích hoạt AI Employee tích hợp sẵn

Tất cả các AI Employee tích hợp sẵn đã được kích hoạt theo mặc định, thông thường không cần phải bật từng cái thủ công.

Nếu bạn cần điều chỉnh phạm vi khả dụng (kích hoạt/vô hiệu hóa một AI Employee nào đó), bạn có thể chỉnh sửa công tắc `Enabled` tại trang danh sách `Cài đặt hệ thống -> AI Employee`.

![](https://static-docs.nocobase.com/202604230813855.png)

## Bắt đầu cộng tác

Nhấn vào lối vào AI Employee ở góc dưới bên phải để mở hộp thoại.

![](https://static-docs.nocobase.com/202604230814677.png)

AI Employee mặc định là trưởng nhóm Atlas, bạn có thể nhập câu hỏi trực tiếp để bắt đầu trò chuyện. Khi cần thiết, anh ấy sẽ gọi AI Employee phù hợp dựa trên câu hỏi của bạn để cộng tác hoàn thành nhiệm vụ. Bạn cũng có thể chuyển đổi thủ công sang AI Employee và mô hình phù hợp tùy theo nhu cầu cụ thể.

![](https://static-docs.nocobase.com/202604230816190.png)

Bạn còn có thể:

- Thêm Block
- Thêm tệp đính kèm
- Bật tìm kiếm trên web

## Tác vụ nhanh

Bạn có thể thiết lập sẵn các tác vụ thường dùng cho mỗi AI Employee tại vị trí hiện tại, cấu hình trước thông tin về bối cảnh tác vụ, tin nhắn người dùng, context Block, v.v. Như vậy, chỉ cần một cú nhấp là có thể bắt đầu công việc, tiện lợi và nhanh chóng.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Tổng quan các AI Employee tích hợp sẵn

NocoBase đã tích hợp sẵn nhiều AI Employee phục vụ cho các tình huống khác nhau.

Bạn chỉ cần:

1. Cấu hình dịch vụ LLM.
2. Điều chỉnh trạng thái kích hoạt của AI Employee theo nhu cầu (mặc định đã kích hoạt).
3. Chọn mô hình trong cuộc trò chuyện và bắt đầu cộng tác.

| Tên AI Employee | Vai trò                          | Năng lực cốt lõi                                                                                                |
| :-------------- | :------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Atlas**       | Trưởng nhóm                      | AI Employee tổng quát mặc định, nhận diện ý định người dùng, tự động phân công AI Employee phù hợp xử lý vấn đề |
| **Dex**         | Chuyên gia chỉnh lý dữ liệu      | Dịch Field, định dạng, trích xuất thông tin                                                                     |
| **Viz**         | Chuyên gia phân tích             | Thấu hiểu dữ liệu, phân tích xu hướng, diễn giải các chỉ số quan trọng                                          |
| **Lexi**        | Trợ lý dịch thuật                | Dịch đa ngôn ngữ, hỗ trợ giao tiếp                                                                              |
| **Vera**        | Chuyên gia nghiên cứu            | Tìm kiếm trên web, tổng hợp thông tin, nghiên cứu chuyên sâu                                                    |
| **Ellis**       | Chuyên gia email                 | Soạn email, tạo tóm tắt, đề xuất phản hồi                                                                       |
| **Orin**        | Chuyên gia mô hình hóa dữ liệu   | Hỗ trợ thiết kế cấu trúc bảng dữ liệu, đề xuất Field                                                            |
| **Nathan**      | Kỹ sư front-end                  | Hỗ trợ viết đoạn mã front-end, điều chỉnh styles                                                                |
| **Dara**        | Chuyên gia trực quan hóa dữ liệu | Cấu hình biểu đồ                                                                                                |

**Ghi chú**

Một số AI Employee tích hợp sẵn có tình huống làm việc chuyên dụng:

- Orin: Trang mô hình hóa dữ liệu.
- Dara: Block cấu hình biểu đồ.
- Nathan: Trình soạn thảo mã như JS Block.
