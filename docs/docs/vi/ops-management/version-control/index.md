---
pkg: '@nocobase/plugin-version-control'
title: "Quản lý phiên bản"
description: "Hướng dẫn plugin quản lý phiên bản: tự động lưu phiên bản khi AI Builder hoàn thành các mốc quan trọng, tạo và khôi phục phiên bản thủ công, cấu hình số lượng lưu giữ, phím tắt và các collection người dùng được đưa vào phiên bản."
keywords: "Quản lý phiên bản,Version control,vận hành,AI Builder,nocobase-revision,nb revision create,tạo phiên bản,khôi phục phiên bản,NocoBase"
---

# Quản lý phiên bản

Trong NocoBase, **Quản lý phiên bản (Version control)** giúp bạn lưu lại một phiên bản có thể khôi phục của ứng dụng hiện tại. Bạn có thể tạo phiên bản thủ công, khôi phục ứng dụng về một phiên bản đã lưu khi cần, đồng thời để AI Builder tự động lưu phiên bản sau các mốc hoàn thành có ý nghĩa.

Quản lý phiên bản dùng [Quản lý sao lưu](../backup-manager/index.mdx) để lưu và khôi phục trạng thái ứng dụng. Trước khi sử dụng quản lý phiên bản, hãy bật Quản lý sao lưu trước.

:::warning Lưu ý

Phiên bản Community và Standard không bao gồm plugin quản lý phiên bản. Nếu bạn cần lưu trạng thái ứng dụng có thể khôi phục, hãy dùng [Quản lý sao lưu](../backup-manager/index.mdx): tạo bản sao lưu thủ công trước các thay đổi quan trọng, rồi khôi phục bản sao lưu tương ứng khi cần quay lại.

:::

## Phiên bản tự động từ AI

Sau khi bật plugin quản lý phiên bản, AI Builder sẽ có thêm một lớp bảo vệ để quay lại khi cần. Khi AI Agent bắt đầu xử lý yêu cầu, nó kiểm tra các NocoBase Skills có sẵn trong ứng dụng hiện tại. Nếu nhận ra skill `nocobase-revision`, nó có thể lưu các mốc dựng ứng dụng quan trọng thành phiên bản có thể khôi phục.

![AI phát hiện skill nocobase-revision khi bắt đầu dựng ứng dụng](https://static-docs.nocobase.com/20260611115845.png)

Khi AI hoàn thành một phần có thể kiểm tra độc lập, chẳng hạn dựng xong một trang, tạo một nhóm collection hoặc cấu hình một workflow, nó sẽ chạy `nb revision create` thông qua NocoBase CLI. Bạn không cần nhấp 「Create version」 thủ công mỗi lần, và các chỉnh sửa nhỏ cũng không tạo quá nhiều bản ghi phiên bản.

![AI tạo phiên bản sau khi dựng ứng dụng](https://static-docs.nocobase.com/20260611115804.png)

Các phiên bản này sẽ xuất hiện trong danh sách phiên bản. Nếu những thay đổi tiếp theo không đúng kỳ vọng, bạn có thể khôi phục về mốc dựng ứng dụng rõ ràng trước đó rồi tiếp tục điều chỉnh từ đó.

## Mở plugin

Sau khi bật plugin, menu 「Version control」 sẽ xuất hiện trên thanh trên cùng. Từ đó bạn có thể tạo phiên bản trực tiếp hoặc chuyển tới danh sách phiên bản.

Bạn cũng có thể mở trang plugin từ 「System settings / Version control」. Phím tắt mặc định để tạo phiên bản là `Ctrl + K`, và bạn có thể đổi nó trong tab cài đặt.

![Menu Version control](https://static-docs.nocobase.com/20260611112317.png)

## Tạo phiên bản

Nhấp vào 「Create version」, nhập mô tả rồi lưu. Mô tả có thể dài tối đa 2000 ký tự. Trường này phù hợp để ghi lại bối cảnh thay đổi, ví dụ “Điều chỉnh trường và quyền trong quy trình phê duyệt”.

![Tạo phiên bản](https://static-docs.nocobase.com/20260611112739.png)

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
- [Bắt đầu nhanh với AI Builder](../../ai-builder/index.md) — dùng ngôn ngữ tự nhiên để hoàn thành mô hình dữ liệu, cấu hình trang và điều phối workflow
