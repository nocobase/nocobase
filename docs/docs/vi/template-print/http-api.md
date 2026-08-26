---
title: "Template In ấn HTTP API"
description: "NocoBase Template In ấn HTTP API: Thông qua Action templatePrint để in các bản ghi đã chọn, kết quả lọc hiện tại hoặc tất cả dữ liệu thỏa mãn điều kiện, và tải xuống file Word, Excel, PowerPoint hoặc PDF được sinh ra."
keywords: "Template In ấn,HTTP API,templatePrint,PDF,In bản ghi đã chọn,In tất cả,NocoBase"
---

# HTTP API

Template In ấn hỗ trợ kích hoạt render và tải xuống tài liệu trực tiếp qua HTTP API. Dù là Block chi tiết hay Block bảng, về bản chất đều là phát hành Action `templatePrint` trên tài nguyên nghiệp vụ hiện tại.

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

Giải thích:
- `<resource_name>` là tên tài nguyên tương ứng với bảng dữ liệu hiện tại.
- API trả về luồng file nhị phân, không phải dữ liệu JSON.
- Bên gọi cần có quyền truy vấn tài nguyên hiện tại, cùng với quyền sử dụng nút Template In ấn tương ứng.
- Khi gọi API cần truyền JWT token dựa trên đăng nhập người dùng qua header Authorization, nếu không sẽ bị từ chối truy cập.

## Tham số request body

| Tham số | Loại | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `templateName` | `string` | Có | Tên Template, tương ứng với mã định danh Template được cấu hình trong quản lý Template. |
| `blockName` | `string` | Có | Loại Block. Block bảng truyền `table`, Block chi tiết truyền `details`. |
| `timezone` | `string` | Không | Múi giờ, ví dụ `Asia/Shanghai`. Dùng cho việc render ngày giờ trong Template. |
| `uid` | `string` | Không | schema uid của nút Template In ấn, dùng cho kiểm tra quyền. |
| `convertedToPDF` | `boolean` | Không | Có chuyển đổi thành PDF không. Khi truyền `true` sẽ trả về file `.pdf`. |
| `queryParams` | `object` | Không | Tham số truyền cho truy vấn dữ liệu cấp dưới. |
| `queryParams.page` | `number \| null` | Không | Số trang phân trang. Đặt `null` nghĩa là không cắt theo trang. |
| `queryParams.pageSize` | `number \| null` | Không | Số bản ghi mỗi trang. Đặt `null` nghĩa là không cắt theo trang. |
| `queryParams.filter` | `object` | Không | Điều kiện lọc, sẽ tự động gộp với điều kiện lọc cố định của ACL. |
| `queryParams.appends` | `string[]` | Không | Trường liên kết cần truy vấn bổ sung. |
| `queryParams.filterByTk` | `string \| object` | Không | Block chi tiết thường dùng, để chỉ định giá trị khóa chính. |
| `queryParams.sort` và các tham số khác | `any` | Không | Các tham số truy vấn khác sẽ được truyền nguyên trạng đến truy vấn tài nguyên cấp dưới. |

## Block bảng

Block bảng sử dụng cùng một API, thông qua `blockName: "table"` để chỉ định chế độ in danh sách. Server sẽ thực hiện truy vấn `find` trên tài nguyên, và truyền mảng kết quả vào Template.

### In bản ghi đã chọn hoặc kết quả trang hiện tại

Áp dụng cho việc tích chọn một số bản ghi từ Block bảng để in, hoặc giữ ngữ cảnh phân trang trang hiện tại để in. Cách làm thông thường là:

- Đặt `queryParams.page` và `queryParams.pageSize` bằng số trang hiện tại và số bản ghi mỗi trang.
- Ghép khóa chính của các bản ghi đã chọn thành điều kiện `filter.id.$in`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Ý nghĩa của loại request này như sau:

- `blockName` là `table`, nghĩa là render Template theo dữ liệu danh sách.
- `filter.id.$in` dùng để chỉ định tập hợp bản ghi cần in.
- `page` và `pageSize` giữ ngữ cảnh phân trang hiện tại, để nhất quán với hành vi giao diện.
- `appends` có thể bổ sung trường liên kết theo nhu cầu.

### In tất cả dữ liệu thỏa mãn điều kiện

Áp dụng cho cách gọi khi nhấn "In tất cả bản ghi" trong Block bảng. Lúc này không cắt theo phân trang trang hiện tại, mà trực tiếp lấy tất cả dữ liệu thỏa mãn điều kiện lọc hiện tại.

Điểm chính là truyền `queryParams.page` và `queryParams.pageSize` rõ ràng là `null`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Ý nghĩa của loại request này như sau:

- `page: null` và `pageSize: null` nghĩa là hủy giới hạn phân trang.
- `filter: {}` nghĩa là không thêm điều kiện lọc; nếu giao diện đã có điều kiện lọc, cũng có thể trực tiếp đặt vào đây.
- Server sẽ truy vấn tất cả dữ liệu thỏa mãn điều kiện và render Template hàng loạt.

> Lưu ý: Block bảng mỗi lần in tối đa 300 bản ghi. Khi vượt quá giới hạn, API sẽ trả về lỗi `400`.

## Block chi tiết

Block chi tiết cũng sử dụng Action `templatePrint`, nhưng thường truyền:

- `blockName: "details"`
- `queryParams.filterByTk` chỉ định khóa chính của bản ghi hiện tại
- `queryParams.appends` chỉ định trường liên kết cần truy vấn bổ sung

Server sẽ thực hiện truy vấn `findOne` trên tài nguyên, và truyền object kết quả vào Template.

## Kết quả trả về

Sau khi gọi thành công, API trực tiếp trả về luồng file, header phản hồi điển hình như sau:

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

Giải thích:

- Khi `convertedToPDF` là `true`, đuôi file trả về là `.pdf`.
- Ngược lại trả về file tương ứng với loại Template gốc, ví dụ `.docx`, `.xlsx` hoặc `.pptx`.
- Frontend thường kích hoạt tải xuống trình duyệt theo tên file trong `Content-Disposition`.

## Tài nguyên khác
- [Sử dụng API key trong NocoBase](../integration/api-keys/usage.md)
