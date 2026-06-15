---
pkg: '@nocobase/plugin-workflow-transaction'
title: "Node Workflow - Giao dịch cơ sở dữ liệu"
description: "Node giao dịch cơ sở dữ liệu: đưa các thao tác dữ liệu cùng nguồn vào một giao dịch, thành công thì commit, thất bại thì rollback."
keywords: "workflow,giao dịch cơ sở dữ liệu,Transaction,rollback,commit,thao tác dữ liệu,NocoBase"
---

# Giao dịch cơ sở dữ liệu

## Giới thiệu

Node giao dịch cơ sở dữ liệu dùng để chạy một nhóm thao tác cơ sở dữ liệu trong cùng một giao dịch. Node này phù hợp với các tình huống cần đảm bảo nhiều bước xử lý dữ liệu "tất cả thành công hoặc tất cả rollback", ví dụ tạo đơn hàng, trừ tồn kho, ghi chi tiết và cập nhật trạng thái.

Node giao dịch hiện chỉ hỗ trợ nguồn dữ liệu cơ sở dữ liệu. Các thao tác dữ liệu thuộc cùng nguồn dữ liệu trong Node sẽ tự động được đưa vào giao dịch này; các nguồn dữ liệu khác sẽ không sử dụng giao dịch này.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Giao dịch cơ sở dữ liệu".

![20260610205146](https://static-docs.nocobase.com/20260610205146.png)

Sau khi tạo, hệ thống sẽ sinh ra hai nhánh:

- **Thực thi**: nhánh chính chạy trong giao dịch. Khi toàn bộ Node trong nhánh này thành công, giao dịch sẽ tự động commit; nếu bất kỳ Node nào thất bại hoặc lỗi, giao dịch sẽ tự động rollback.
- **Sau rollback**: nhánh chạy sau khi rollback. Nhánh này chạy ngoài giao dịch, có thể dùng để ghi log, gửi thông báo hoặc thực hiện xử lý bù trừ.

![20260610205303](https://static-docs.nocobase.com/20260610205303.png)

## Cấu hình Node

![20260610205505](https://static-docs.nocobase.com/20260610205505.png)

### Nguồn dữ liệu

Chọn nguồn dữ liệu cơ sở dữ liệu do giao dịch này kiểm soát. Chỉ các Node thao tác dữ liệu cùng nguồn dữ liệu mới tự động được đưa vào giao dịch.

### Mức cô lập

Thiết lập mức cô lập giao dịch. Giá trị mặc định là `READ UNCOMMITTED`. Nếu nghiệp vụ yêu cầu tính nhất quán dữ liệu chặt chẽ hơn, hãy chọn mức cô lập khác theo khả năng của cơ sở dữ liệu và yêu cầu xử lý đồng thời.

### Tiếp tục Workflow sau rollback

Khi bật, sau khi nhánh `Sau rollback` thực thi xong, Workflow sẽ tiếp tục chạy các Node phía sau Node giao dịch.

Khi tắt, sau khi nhánh `Sau rollback` thực thi xong, Workflow sẽ kết thúc tại Node giao dịch và không chạy các Node phía sau.

## Cách sử dụng

### Ràng buộc

Nhánh `Thực thi` không hỗ trợ các Node bất đồng bộ làm tạm dừng quy trình, ví dụ xử lý thủ công hoặc trì hoãn. Giao dịch cần được commit hoặc rollback trong lần thực thi hiện tại. Nếu nhánh `Thực thi` đi vào trạng thái chờ, hệ thống sẽ rollback giao dịch và đánh dấu Workflow là thất bại.

Nhánh `Sau rollback` chạy ngoài giao dịch nên không chịu ràng buộc trên. Có thể sử dụng Node bất đồng bộ trong nhánh này theo nhu cầu nghiệp vụ, ví dụ gửi request, chờ xác nhận thủ công hoặc trì hoãn xử lý.

:::warning Lưu ý
Giao dịch sẽ chiếm kết nối cơ sở dữ liệu cho đến khi commit hoặc rollback. Tránh bố trí thao tác chạy lâu trong nhánh `Thực thi`; chỉ nên đặt các thao tác đọc, ghi và kiểm tra dữ liệu cần thiết.
:::

### Giao dịch lồng nhau

Node giao dịch có thể sử dụng lồng nhau, nhưng cần chú ý phạm vi nguồn dữ liệu:

- Khi giao dịch bên trong và bên ngoài dùng cùng nguồn dữ liệu, giao dịch bên trong sẽ được tạo trong phạm vi giao dịch bên ngoài và được xử lý theo khả năng của cơ sở dữ liệu và Sequelize.
- Khi giao dịch bên trong dùng nguồn dữ liệu khác, nó sẽ không tái sử dụng giao dịch bên ngoài mà tạo giao dịch độc lập cho nguồn dữ liệu đó.
- Nếu Workflow được kích hoạt bởi sự kiện bảng dữ liệu đồng bộ, bản thân trigger có thể đã cung cấp giao dịch cấp trên cho cùng nguồn dữ liệu. Node giao dịch sẽ ưu tiên tái sử dụng giao dịch bên ngoài cùng nguồn dữ liệu và không tái sử dụng giao dịch của nguồn dữ liệu khác.

Giao dịch lồng nhau làm tăng chi phí hiểu và xử lý sự cố. Thông thường chỉ nên dùng khi thực sự cần ranh giới rollback cục bộ. Nếu không, nên dùng một Node giao dịch để bao toàn bộ quy trình xử lý dữ liệu.

### Tình huống thường gặp

Một quy trình điển hình như sau:

1. Truy vấn hoặc tạo dữ liệu liên quan trong nhánh `Thực thi`.
2. Tiếp tục cập nhật tồn kho, trạng thái, chi tiết và dữ liệu cùng nguồn trong nhánh `Thực thi`.
3. Nếu tất cả thành công, giao dịch tự động commit.
4. Nếu bất kỳ Node nào thất bại hoặc lỗi, giao dịch tự động rollback và đi vào nhánh `Sau rollback`.
5. Trong nhánh `Sau rollback`, ghi lại nguyên nhân thất bại, gửi thông báo hoặc thực hiện logic bù trừ.

Nếu cần tiếp tục quy trình sau khi rollback, hãy bật "Tiếp tục Workflow sau rollback".
