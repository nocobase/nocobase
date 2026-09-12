---
pkg: '@nocobase/plugin-workflow-response-message'
title: "Node Workflow - Thông báo phản hồi"
description: "Node thông báo phản hồi: phản hồi thông báo tùy chỉnh cho client, hỗ trợ sự kiện trước Action, sự kiện Action tùy chỉnh."
keywords: "workflow,thông báo phản hồi,Response Message,phản hồi client,NocoBase"
---

# Thông báo phản hồi

## Giới thiệu

Node thông báo phản hồi được dùng để phản hồi thông báo tùy chỉnh trong quy trình cho client gửi Action trong các loại quy trình cụ thể.

:::info{title=Mẹo}
Hiện hỗ trợ sử dụng trong Workflow loại "Sự kiện trước Action" ở chế độ đồng bộ và "Sự kiện Action tùy chỉnh".
:::

## Tạo Node

Trong các loại Workflow được hỗ trợ, có thể thêm Node "Thông báo phản hồi" tại bất kỳ vị trí nào trong quy trình, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Thông báo phản hồi":

![Thêm Node](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Thông báo phản hồi sẽ tồn tại dưới dạng mảng trong toàn bộ quá trình request, khi quy trình thực thi đến Node thông báo phản hồi bất kỳ sẽ thêm nội dung thông báo mới vào mảng, khi server gửi nội dung phản hồi sẽ gửi tất cả các thông báo cùng đến client.

## Cấu hình Node

Tổng thể nội dung thông báo là một template chuỗi, trong đó có thể chèn biến, trong cấu hình Node có thể tổ chức nội dung template đó tùy ý:

![Cấu hình Node](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Khi quy trình thực thi đến Node đó, sẽ phân tích template và sinh kết quả nội dung thông báo, trong cấu hình trên, biến "Biến cục bộ / Vòng lặp tất cả sản phẩm / Đối tượng vòng lặp / Sản phẩm / Tiêu đề" sẽ được thay thế bằng giá trị cụ thể trong quy trình thực tế, ví dụ:

```
Tồn kho của sản phẩm "iPhone 14 pro" không đủ
```

![Nội dung thông báo](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Cấu hình quy trình

Nhắc trạng thái của thông báo phản hồi tùy thuộc vào trạng thái thành công hay thất bại của việc thực thi quy trình đó, việc thực thi thất bại của bất kỳ Node nào cũng sẽ dẫn đến thất bại của toàn bộ quy trình, lúc này nội dung thông báo sẽ được trả về client với trạng thái thất bại và nhắc.

Nếu cần định nghĩa trạng thái thất bại một cách chủ động trong quy trình, có thể sử dụng "Node kết thúc" trong quy trình và cấu hình thành trạng thái thất bại, khi thực thi đến Node đó sẽ thoát quy trình với trạng thái thất bại và trả thông báo về client với trạng thái thất bại.

Nếu toàn bộ quy trình không sinh ra trạng thái thất bại và thực thi thành công đến kết thúc, nội dung thông báo sẽ được trả về client với trạng thái thành công.

:::info{title=Mẹo}
Nếu trong quy trình định nghĩa nhiều Node thông báo phản hồi, các Node đã được thực thi sẽ thêm nội dung thông báo vào mảng, khi cuối cùng trả về client sẽ trả tất cả nội dung thông báo cùng nhau và nhắc.
:::

## Tình huống sử dụng

### Quy trình "Sự kiện trước Action"

Sử dụng thông báo phản hồi trong quy trình "Sự kiện trước Action" có thể gửi phản hồi thông báo tương ứng cho client sau khi quy trình kết thúc, tham khảo cụ thể tại [Sự kiện trước Action](../triggers/pre-action.md).

### Quy trình "Sự kiện Action tùy chỉnh"

Sử dụng thông báo phản hồi trong "Sự kiện Action tùy chỉnh" ở chế độ đồng bộ có thể gửi phản hồi thông báo tương ứng cho client sau khi quy trình kết thúc, tham khảo cụ thể tại [Sự kiện Action tùy chỉnh](../triggers/custom-action.md).
