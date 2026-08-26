---
title: "Quản lý phiên bản"
description: "Quản lý phiên bản: phiên bản quy trình Workflow, phát hành, rollback, so sánh và khôi phục phiên bản lịch sử, hỗ trợ nhiều phiên bản cùng tồn tại."
keywords: "workflow,quản lý phiên bản,Revisions,phát hành rollback,phiên bản lịch sử,NocoBase"
---

# Quản lý phiên bản

Sau khi Workflow đã được cấu hình và kích hoạt ít nhất một lần, nếu muốn sửa cấu hình của Workflow hoặc các Node trong đó, bạn cần tạo phiên bản mới rồi sửa, làm như vậy cũng đảm bảo khi xem lại lịch sử thực thi của Workflow đã từng được kích hoạt sẽ không bị ảnh hưởng bởi những thay đổi trong tương lai.

Trong trang cấu hình Workflow, bạn có thể xem các phiên bản đã có của Workflow ở menu phiên bản góc trên bên phải:

![Xem phiên bản Workflow](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

Trong menu thao tác thêm ("...") bên phải, bạn có thể chọn sao chép từ phiên bản đang xem sang phiên bản mới:

![Sao chép Workflow thành phiên bản mới](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Sau khi sao chép sang phiên bản mới, bấm công tắc "Bật"/"Tắt" để chuyển phiên bản tương ứng sang trạng thái bật, phiên bản Workflow mới sẽ có hiệu lực.

Nếu cần chọn lại phiên bản cũ, sau khi chuyển từ menu phiên bản, bấm lại công tắc "Bật"/"Tắt" để chuyển sang trạng thái bật, phiên bản đang xem sẽ có hiệu lực, các kích hoạt sau đó sẽ thực thi quy trình của phiên bản tương ứng.

Khi cần tắt Workflow, bấm công tắc "Bật"/"Tắt" để chuyển sang trạng thái tắt, Workflow này sẽ không còn được kích hoạt nữa.

:::info{title=Mẹo}
Khác với "Sao chép" Workflow trong danh sách quản lý Workflow, Workflow "Sao chép sang phiên bản mới" vẫn được nhóm chung trong cùng một nhóm Workflow, chỉ có thể phân biệt qua phiên bản. Nhưng Workflow được sao chép sẽ được coi là một Workflow hoàn toàn mới, không liên quan đến phiên bản của Workflow trước đó, và số lần thực thi cũng sẽ được đặt về 0.
:::
