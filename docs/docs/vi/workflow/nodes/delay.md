---
title: "Node Workflow - Trì hoãn"
description: "Node trì hoãn: thêm trì hoãn trong quy trình, có thể kết hợp với nhánh song song để xử lý timeout, sau khi trì hoãn thì tiếp tục hoặc kết thúc."
keywords: "workflow,trì hoãn,Delay,xử lý timeout,nhánh song song,NocoBase"
---

# Trì hoãn

## Giới thiệu

Node trì hoãn có thể thêm một trì hoãn trong quy trình, sau khi trì hoãn kết thúc, có thể tiếp tục thực thi các Node sau khi trì hoãn kết thúc hoặc dừng quy trình sớm tùy theo cấu hình.

Thường được sử dụng kết hợp với Node nhánh song song, có thể thêm Node trì hoãn vào một trong các nhánh để đạt được mục đích xử lý liên quan sau khi timeout. Ví dụ một trong các nhánh song song chứa xử lý thủ công, nhánh khác chứa Node trì hoãn, khi xử lý thủ công bị timeout, nếu được đặt là timeout thất bại thì có nghĩa là xử lý thủ công phải hoàn thành trong thời gian giới hạn, nếu được đặt là timeout tiếp tục thì có nghĩa là sau khi đến thời gian có thể bỏ qua xử lý thủ công đó.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Trì hoãn":

![Tạo Node trì hoãn](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Cấu hình Node

![Node trì hoãn_cấu hình Node](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Thời gian trì hoãn

Thời gian trì hoãn có thể điền một số và chọn đơn vị thời gian, các đơn vị thời gian được hỗ trợ là: giây, phút, giờ, ngày và tuần.

### Trạng thái khi đến giờ

Trạng thái khi đến giờ có thể chọn "Thông qua và tiếp tục" và "Thất bại và thoát", trạng thái đầu có nghĩa là sau khi trì hoãn kết thúc, quy trình sẽ tiếp tục thực thi các Node sau khi trì hoãn kết thúc, trạng thái sau có nghĩa là sau khi trì hoãn kết thúc, quy trình sẽ dừng sớm với trạng thái thất bại.

## Ví dụ

Lấy ví dụ tình huống cần phản hồi trong thời gian giới hạn sau khi phiếu công việc được phát động, chúng ta cần thêm một Node thủ công vào một trong hai nhánh song song và thêm Node trì hoãn vào nhánh còn lại, nếu xử lý thủ công không phản hồi trong vòng 10 phút thì cập nhật trạng thái phiếu công việc thành quá hạn chưa xử lý.

![Node trì hoãn_ví dụ_tổ chức quy trình](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)
