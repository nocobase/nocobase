---
pkg: "@nocobase/plugin-ai"
title: "Tác vụ nhanh cho Nhân viên AI"
description: "Liên kết Nhân viên AI trên Block và cài đặt sẵn các tác vụ thường dùng, thực thi bằng một cú nhấp: liên kết Block, cài đặt tác vụ (Title, Background, Default user message, Work context, Skills)."
keywords: "Tác vụ nhanh,Tác vụ AI,Liên kết Block,Cấu hình tác vụ,NocoBase"
---

# Tác vụ nhanh

Để Nhân viên AI bắt đầu công việc hiệu quả hơn, chúng ta có thể liên kết Nhân viên AI trên Block kịch bản, và cài đặt sẵn một số tác vụ thường dùng.

Như vậy người dùng có thể nhấp một lần để bắt đầu xử lý tác vụ nhanh chóng, không phải lần nào cũng cần **chọn Block** và **nhập lệnh**.

## Liên kết Nhân viên AI với Block

Sau khi trang vào chế độ chỉnh sửa UI, trên các Block hỗ trợ thiết lập `Actions`, chọn menu `AI employees` dưới `Actions`, sau đó chọn một Nhân viên AI, Nhân viên AI này sẽ được liên kết với Block hiện tại.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Sau khi hoàn thành liên kết, mỗi lần vào trang, khu vực Actions của Block sẽ hiển thị Nhân viên AI được liên kết với Block hiện tại.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Cài đặt tác vụ

Sau khi trang vào chế độ chỉnh sửa UI, di chuột qua biểu tượng Nhân viên AI được liên kết với Block, một nút menu sẽ xuất hiện, chọn `Edit tasks`, vào trang cài đặt tác vụ.

Sau khi vào trang cài đặt tác vụ, bạn có thể thêm nhiều tác vụ cho Nhân viên AI hiện tại.

Mỗi tab đại diện cho một tác vụ độc lập, nhấp vào dấu "+" bên cạnh để thêm tác vụ mới.

![20260426230344](https://static-docs.nocobase.com/20260426230344.png)

Form cài đặt tác vụ:

- Trong ô nhập `Title` nhập tiêu đề tác vụ, mô tả ngắn gọn nội dung tác vụ, tiêu đề này sẽ xuất hiện trong danh sách tác vụ của Nhân viên AI.
- Trong ô nhập `Background` nhập nội dung chính của tác vụ, nội dung này sẽ được sử dụng làm Prompt hệ thống khi trò chuyện với Nhân viên AI.
- Trong ô nhập `Default user message` nhập tin nhắn người dùng được gửi mặc định, sau khi chọn tác vụ sẽ tự động điền vào ô nhập của người dùng.
- Trong `Work context` chọn thông tin ngữ cảnh ứng dụng được gửi mặc định cho Nhân viên AI, phần thao tác này giống như thao tác trong hộp thoại.
- Trong `Skills` thiết lập `Preset` để sử dụng các Skill được cài đặt sẵn của Nhân viên AI hiện tại. Thiết lập `Customer` để cấu hình sử dụng một phần Skills của Nhân viên AI, để trống nghĩa là không sử dụng bất kỳ Skill nào.
- Trong `Tools` thiết lập `Preset` để sử dụng các Tool được cài đặt sẵn của Nhân viên AI hiện tại. Thiết lập `Customer` để cấu hình sử dụng một phần Tools của Nhân viên AI, để trống nghĩa là không sử dụng bất kỳ Tool nào.
- Hộp kiểm `Send default user message automatically` cấu hình xem có tự động gửi tin nhắn người dùng mặc định sau khi nhấp thực thi tác vụ hay không.


## Danh sách tác vụ

Sau khi cài đặt tác vụ cho Nhân viên AI, các tác vụ này sẽ hiển thị trong cửa sổ thông tin giới thiệu Nhân viên AI và trong tin nhắn chào hỏi trước khi bắt đầu phiên hội thoại, nhấp để thực thi tác vụ.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)
