---
title: "Quản lý phiên bản"
description: "Hướng dẫn plugin quản lý phiên bản: tạo phiên bản, khôi phục phiên bản, cấu hình số lượng lưu giữ, phím tắt và các collection người dùng được đưa vào phiên bản."
keywords: "Quản lý phiên bản,Version control,vận hành,tạo phiên bản,khôi phục phiên bản,NocoBase"
---

# Quản lý phiên bản

Trong NocoBase, **Quản lý phiên bản (Version control)** giúp bạn lưu lại một phiên bản có thể khôi phục của ứng dụng hiện tại. Bạn có thể tạo phiên bản thủ công, khôi phục ứng dụng về một phiên bản đã lưu khi cần, đồng thời dùng phần cài đặt của plugin để kiểm soát số lượng phiên bản được giữ lại, phím tắt sử dụng và những collection người dùng nào sẽ được lưu kèm.

Plugin này phụ thuộc vào [Quản lý sao lưu](../backup-manager/index.mdx). Nếu bạn đã bật plugin quản lý phiên bản nhưng hệ thống vẫn hiển thị lỗi liên quan, trước hết hãy kiểm tra xem plugin Quản lý sao lưu đã được bật chưa.

## Mở plugin

Bạn có thể mở plugin từ 「System settings」 → 「Version control」. Một nút quản lý phiên bản cũng xuất hiện trên thanh trên cùng. Từ đó bạn có thể tạo phiên bản trực tiếp hoặc chuyển tới danh sách phiên bản. Phím tắt mặc định để tạo phiên bản là `Ctrl + K`, và bạn có thể đổi nó trong tab cài đặt.

![](https://static-docs.nocobase.com/20260526220402.png)

## Tạo phiên bản

Nhấp vào 「Create version」, nhập mô tả rồi lưu. Mô tả có thể dài tối đa 2000 ký tự. Trường này phù hợp để ghi lại bối cảnh thay đổi, ví dụ “Điều chỉnh trường và quyền trong quy trình phê duyệt”.

![](https://static-docs.nocobase.com/20260526220510.png)

Sau khi nhấp lưu, danh sách sẽ hiển thị trước một dòng tạm thời ở trạng thái “Saving”. Khi hoàn tất, phiên bản đã lưu sẽ xuất hiện trong danh sách.

Các điểm chính:

- Tên phiên bản được tạo tự động
- Tạo từ thanh trên cùng, phím tắt hoặc trang danh sách đều cho cùng một kết quả
- Danh sách hiển thị tên phiên bản, mô tả, kích thước tệp, thời gian tạo, người tạo và các thao tác khả dụng

## Quản lý và khôi phục phiên bản

Danh sách phiên bản chủ yếu cung cấp các thao tác sau:

- 「Refresh」 tải lại danh sách hiện tại
- 「Delete」 xóa một phiên bản hoặc nhiều phiên bản đã chọn
- 「Restore」 khôi phục ứng dụng về trạng thái đã lưu trong phiên bản đó

:::warning Lưu ý

Khôi phục phiên bản sẽ ghi đè cấu hình hiện tại của ứng dụng và dữ liệu được bao gồm trong phiên bản đó. Bạn nên tạo trước một phiên bản của trạng thái hiện tại để có thể quay lại khi cần.

:::

Sau khi nhấp 「Restore」, ứng dụng sẽ vào chế độ bảo trì trong thời gian ngắn khi quá trình khôi phục đang chạy. Đừng gửi thêm một yêu cầu khôi phục khác trong lúc này. Nếu khôi phục thất bại, giao diện sẽ hiển thị thông báo lỗi.

## Cấu hình quy tắc phiên bản

Mở tab 「Settings」 để kiểm soát số lượng lưu giữ và nội dung của mỗi phiên bản.

![](https://static-docs.nocobase.com/20260526220720.png)

Các mục cài đặt gồm:

- `Versions to keep`: số lượng phiên bản lưu tối đa. Các phiên bản cũ sẽ bị xóa tự động khi vượt quá giới hạn
- `Shortcut: create version`: phím tắt để tạo phiên bản. Nhấn `Ctrl + một chữ cái` để đặt, hoặc `Backspace` để xóa
- `User collections`: chọn dữ liệu từ những collection do người dùng tạo sẽ được đưa vào các phiên bản đã lưu

:::tip

Mặc định, các phiên bản đã lưu không bao gồm dữ liệu từ collection do người dùng tạo. Bạn chỉ cần chọn collection ở đây khi muốn khôi phục cả một phần dữ liệu nghiệp vụ cùng với phiên bản của ứng dụng.

:::

Nếu bạn đưa một collection người dùng vào, NocoBase cũng sẽ tự động đưa các collection liên quan vào, vì vậy kết quả khôi phục thường đầy đủ hơn.

## Liên kết liên quan

- [Quản lý sao lưu](../backup-manager/index.mdx) — năng lực nền tảng mà quản lý phiên bản phụ thuộc vào
- [Quản lý di chuyển](../migration-manager/index.md) — chuyển cấu hình ứng dụng giữa các môi trường
- [Quản lý phát hành](../release-management/index.md) — lên kế hoạch quy trình phát hành với sao lưu, di chuyển và biến cấu hình
