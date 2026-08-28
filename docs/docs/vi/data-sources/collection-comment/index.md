---
pkg: "@nocobase/plugin-comments"
title: "Bảng bình luận"
description: "Bảng bình luận lưu trữ bình luận, phản hồi và ý kiến về các bản ghi nghiệp vụ, hỗ trợ nội dung rich text, theo dõi người dùng, bình luận nhiều cấp và khối bình luận."
keywords: "bảng bình luận,tính năng bình luận,bình luận rich text,bình luận nhiều cấp,Collection Comment,NocoBase"
---

# Bảng bình luận

## Giới thiệu

Bảng bình luận phù hợp để lưu các cuộc thảo luận, phản hồi và ghi chú xoay quanh các bản ghi nghiệp vụ. Ví dụ: bình luận về nhiệm vụ, ý kiến phê duyệt, bình luận bài viết và phản hồi của khách hàng đều có thể được lưu bằng bảng bình luận.

Bảng bình luận thường không được sử dụng độc lập như bảng nghiệp vụ chính. Cách làm phổ biến hơn là: trước tiên tạo bảng bình luận, sau đó cấu hình trường quan hệ trong bảng nghiệp vụ, cuối cùng thêm khối bình luận vào trang chi tiết hoặc cửa sổ bật lên của bản ghi nghiệp vụ.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Tình huống áp dụng

Bảng bình luận phù hợp với các tình huống nghiệp vụ sau:

- Thảo luận cộng tác về nhiệm vụ, yêu cầu và lỗi
- Ý kiến xử lý phiếu phê duyệt, phiếu công việc và hợp đồng
- Bình luận về bài viết, cơ sở tri thức và thông báo
- Phản hồi của khách hàng, theo dõi sau bán hàng và ghi chú nội bộ

## Quy trình sử dụng

Bảng bình luận thường được sử dụng cùng với bảng nghiệp vụ và khối bình luận:

1. Tạo bảng bình luận để lưu nội dung bình luận, quan hệ phản hồi, người tạo, thời gian tạo và các thông tin khác.
2. Tạo trường quan hệ trong bảng nghiệp vụ để liên kết với bảng bình luận. Ví dụ: liên kết bảng 「Nhiệm vụ」 với bảng 「Bình luận nhiệm vụ」.
3. Thêm khối bình luận vào trang chi tiết hoặc cửa sổ bật lên của bảng nghiệp vụ.
4. Người dùng đăng bình luận hoặc phản hồi trong khối bình luận. Dữ liệu bình luận sẽ được ghi vào bảng bình luận và liên kết với bản ghi nghiệp vụ hiện tại.
5. Cấu hình quyền của bảng bình luận theo nhu cầu nghiệp vụ để kiểm soát ai có thể xem, tạo hoặc xóa bình luận.

## Tạo và cấu hình

Trong cơ sở dữ liệu chính, nhấp vào 「Create collection」 rồi chọn 「Comment collection」 để tạo bảng bình luận.

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của bảng dữ liệu trên giao diện, chẳng hạn như 「Bình luận nhiệm vụ」「Ý kiến phê duyệt」「Bình luận bài viết」. |
| Collection name | Tên nhận dạng của bảng dữ liệu, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc và các thành phần khác. |
| Inherits | Chọn bảng cha cần kế thừa. Chỉ hiển thị khi cơ sở dữ liệu chính là PostgreSQL. |
| Categories | Phân loại bảng dữ liệu. Việc phân loại chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi cấu trúc bảng dữ liệu. |
| Description | Mô tả bảng dữ liệu. Có thể ghi rõ bảng bình luận này phục vụ đối tượng nghiệp vụ nào, do ai bảo trì và quyền bình luận được thiết kế ra sao. |
| Preset fields | Các trường thiết lập sẵn. Khi tạo bảng bình luận, nên giữ lại các trường hệ thống và trường tích hợp sẵn của bảng bình luận. |

### Các trường tích hợp sẵn

Sau khi tạo, bảng bình luận thường bao gồm các trường tích hợp sẵn sau. Khối bình luận chủ yếu dựa vào `content`, `createdBy` và `createdAt` để hiển thị nội dung bình luận, người bình luận và thời gian bình luận.

| Trường | Tên trường | Mô tả |
| --- | --- | --- |
| ID | `id` | Trường khóa chính mặc định, dùng để nhận dạng duy nhất một bản ghi bình luận. |
| Nội dung bình luận | `content` | Lưu nội dung bình luận do người dùng nhập, mặc định sử dụng thành phần Markdown Vditor. |
| Thời gian tạo | `createdAt` | Tự động ghi lại thời gian tạo bình luận; khối bình luận sử dụng trường này để hiển thị thời gian bình luận. |
| Người tạo | `createdBy` | Tự động ghi lại người dùng đăng bình luận; khối bình luận sử dụng trường này để hiển thị người bình luận. |
| Thời gian cập nhật | `updatedAt` | Tự động ghi lại thời gian cập nhật bình luận gần nhất. |
| Người cập nhật | `updatedBy` | Tự động ghi lại người dùng cập nhật bình luận gần nhất. |
| Không gian | `space` | Khả dụng sau khi bật [plugin đa không gian](../../multi-app/multi-space/index.md), dùng để cô lập dữ liệu theo không gian. Trường này sẽ không xuất hiện nếu chưa bật tính năng đa không gian. |

:::warning Lưu ý

Các trường tích hợp sẵn của bảng bình luận thường được khối bình luận quản lý. Không nên tùy ý xóa hoặc chuyển chúng sang ý nghĩa nghiệp vụ khác. Nếu cần lưu thông tin như phân loại bình luận hoặc trạng thái xử lý, có thể thêm các trường nghiệp vụ mới.

:::

### Trường khóa chính

Bảng bình luận cũng như bảng thông thường đều cần có trường khóa chính. Khối bình luận sẽ sử dụng khóa chính để xác định bản ghi bình luận và quan hệ phản hồi.

Nếu bảng bình luận không có khóa chính, cần thiết lập 「Record unique key」 khi chỉnh sửa bảng dữ liệu; nếu không, khối bình luận có thể không xem, phản hồi hoặc xóa bình luận chính xác.

## Tạo quan hệ liên kết
Tạo trường quan hệ trong bảng nghiệp vụ để liên kết với bảng bình luận
![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## Cấu hình và sử dụng trên trang

Bảng bình luận thường được sử dụng thông qua khối bình luận. Bạn có thể thêm khối bình luận vào trang chi tiết, cửa sổ bật lên hoặc trang bản ghi của bảng nghiệp vụ để người dùng đăng bình luận xoay quanh bản ghi hiện tại.

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| Vị trí cấu hình | Mục đích |
| --- | --- |
| [Khối chi tiết](../../interface-builder/blocks/data-blocks/details.md) | Hiển thị lối vào bình luận trong phần chi tiết bản ghi nghiệp vụ. |
| [Khối biểu mẫu](../../interface-builder/blocks/data-blocks/form.md) | Sử dụng trường quan hệ bình luận cùng với quy trình chỉnh sửa bảng nghiệp vụ. |
| Khối bình luận | Hiển thị danh sách bình luận, đăng bình luận và phản hồi bình luận. |

## Cấu hình chỉnh sửa

Trong danh sách bảng dữ liệu, nhấp vào 「Edit」 ở bên phải bảng bình luận để sửa tên hiển thị, phân loại, mô tả, chế độ phân trang đơn giản và các cấu hình như 「Record unique key」.

Sau khi bảng bình luận được đưa vào sử dụng, không nên tùy ý điều chỉnh trường nội dung bình luận và trường quan hệ phản hồi. Khối bình luận, quyền, quy trình làm việc và API có thể phụ thuộc vào các trường này.

## Xóa bảng dữ liệu

Trong danh sách bảng dữ liệu, nhấp vào 「Delete」 ở bên phải bảng bình luận để xóa bảng bình luận.

Xóa bảng bình luận sẽ xóa các bản ghi bình luận, quan hệ phản hồi và siêu dữ liệu Collection liên quan. Trước khi xóa, hãy xác nhận liệu các trường quan hệ trong bảng nghiệp vụ, khối bình luận, quyền, quy trình làm việc và API có còn phụ thuộc vào bảng này hay không.

:::danger Cảnh báo

Xóa bảng bình luận sẽ khiến các bản ghi nghiệp vụ hiện có mất dữ liệu bình luận. Bình luận thường chứa thông tin về quá trình cộng tác và ý kiến xử lý; trước khi thao tác, hãy xác nhận có cần sao lưu hoặc lưu trữ dữ liệu hay không.

:::

## Liên kết liên quan

- [Bảng thông thường](../data-source-main/general-collection.md) — Xem cấu hình chung và cách sử dụng các khối
- [Trường quan hệ](../data-modeling/collection-fields/associations/index.md) — Tìm hiểu cách liên kết bảng nghiệp vụ với bảng bình luận
- [Plugin bình luận](../../plugins/@nocobase/plugin-comments/index.md) — Xem khối bình luận và các tính năng bình luận
- [Đa không gian](../../multi-app/multi-space/index.md) — Tìm hiểu về trường không gian và khả năng cô lập không gian