---
title: "Node Workflow - Thêm dữ liệu"
description: "Node thêm dữ liệu: thêm một dòng vào bảng dữ liệu, hỗ trợ biến ngữ cảnh quy trình, gán giá trị trường quan hệ, tham chiếu khóa ngoại."
keywords: "workflow,thêm dữ liệu,Create,thao tác bảng dữ liệu,gán biến,NocoBase"
---

# Thêm dữ liệu

Được dùng để thêm một dòng dữ liệu vào một bảng dữ liệu nào đó.

Giá trị trường của dòng dữ liệu được thêm có thể sử dụng biến của ngữ cảnh quy trình, việc gán giá trị cho trường quan hệ có thể trực tiếp tham chiếu biến dữ liệu tương ứng trong ngữ cảnh, có thể là đối tượng hoặc giá trị khóa ngoại. Nếu không sử dụng biến thì cần điền thủ công giá trị khóa ngoại, các giá trị khóa ngoại của quan hệ một - nhiều cần sử dụng dạng phân tách bằng dấu phẩy tiếng Anh.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Thêm dữ liệu":

![Tạo Node thêm dữ liệu](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Cấu hình Node

![Node thêm_ví dụ_cấu hình Node](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Bảng dữ liệu

Chọn bảng dữ liệu cần thêm dữ liệu.

### Giá trị trường

Gán giá trị cho các trường của bảng dữ liệu, có thể sử dụng biến của ngữ cảnh quy trình hoặc điền thủ công giá trị tĩnh.

:::info{title="Mẹo"}
Dữ liệu được Node thêm trong Workflow thêm vào sẽ không tự động xử lý dữ liệu người dùng như "Người tạo", "Người sửa cuối cùng"..., cần tự cấu hình giá trị của hai trường này theo tình huống.
:::

### Preload dữ liệu quan hệ

Nếu các trường của dữ liệu được thêm chứa trường quan hệ và muốn sử dụng dữ liệu quan hệ tương ứng trong các bước tiếp theo, có thể chọn các trường quan hệ tương ứng trong cấu hình preload, như vậy sau khi thêm dữ liệu xong sẽ tự động load dữ liệu quan hệ tương ứng và lưu cùng vào dữ liệu kết quả của Node.

## Ví dụ

Ví dụ khi dữ liệu của bảng "Bài viết" được thêm hoặc cập nhật, cần tự động thêm một dữ liệu "Phiên bản bài viết" để ghi lại lịch sử một lần thay đổi của bài viết, có thể sử dụng Node thêm để triển khai:

![Node thêm_ví dụ_cấu hình quy trình](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Node thêm_ví dụ_cấu hình Node](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Sau khi cấu hình như trên và bật Workflow, khi dữ liệu của bảng "Bài viết" thay đổi, sẽ tự động thêm một dữ liệu "Phiên bản bài viết" để ghi lại lịch sử thay đổi của bài viết.
