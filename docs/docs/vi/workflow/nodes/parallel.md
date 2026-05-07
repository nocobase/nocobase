---
pkg: '@nocobase/plugin-workflow-parallel'
title: "Node Workflow - Nhánh song song"
description: "Node nhánh song song: chia quy trình thành nhiều nhánh thực thi đồng thời, có thể cấu hình các chế độ nhánh khác nhau."
keywords: "workflow,nhánh song song,Parallel,thực thi đồng thời,chế độ nhánh,NocoBase"
---

# Nhánh song song

Node nhánh song song có thể chia quy trình thành nhiều nhánh, mỗi nhánh có thể cấu hình các Node khác nhau, dựa vào chế độ nhánh khác nhau, cách thực thi của nhánh cũng khác nhau. Trong tình huống cần thực thi đồng thời nhiều thao tác, có thể sử dụng Node nhánh song song.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Nhánh song song":

![Nhánh song song_thêm](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Sau khi thêm Node nhánh song song trong quy trình, mặc định sẽ thêm hai nhánh con, đồng thời cũng có thể bấm nút thêm nhánh để thêm tùy ý nhiều nhánh, mỗi nhánh có thể thêm tùy ý các Node, các nhánh không cần có thể được xóa bằng cách bấm nút xóa ở đầu nhánh.

![Nhánh song song_quản lý nhánh](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Cấu hình Node

### Chế độ nhánh

Node nhánh song song có ba chế độ sau:

- **Tất cả thành công**: tất cả nhánh thực thi thành công thì quy trình mới tiếp tục thực thi các Node sau khi nhánh kết thúc. Ngược lại bất kỳ nhánh nào dừng sớm, bất kể thất bại, gặp lỗi hay các trạng thái không thành công khác, đều dẫn đến toàn bộ Node nhánh song song dừng sớm với trạng thái đó, còn gọi là "Chế độ All".
- **Bất kỳ thành công**: bất kỳ nhánh nào thực thi thành công thì quy trình sẽ tiếp tục thực thi các Node sau khi nhánh kết thúc. Trừ khi tất cả các nhánh đều dừng sớm, bất kể thất bại, gặp lỗi hay các trạng thái không thành công khác, mới dẫn đến toàn bộ Node nhánh song song dừng sớm với trạng thái đó, còn gọi là "Chế độ Any".
- **Bất kỳ thành công và thất bại**: sau khi bất kỳ nhánh nào thực thi thành công thì quy trình sẽ tiếp tục thực thi các Node sau khi nhánh kết thúc, nhưng sau khi bất kỳ Node nào thất bại sẽ dẫn đến toàn bộ song song dừng sớm với trạng thái đó, còn gọi là "Chế độ Race".

Bất kể ở chế độ nào, đều sẽ thử thực thi từng nhánh từ trái sang phải, cho đến khi thỏa mãn các điều kiện liên quan của chế độ nhánh được đặt trước thì tiếp tục thực thi các Node tiếp theo hoặc thoát sớm.

## Ví dụ

Tham khảo ví dụ trong [Node trì hoãn](./delay.md).
