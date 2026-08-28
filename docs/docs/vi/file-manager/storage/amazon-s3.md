---
pkg: '@nocobase/plugin-file-manager'
title: "Storage engine: Amazon S3"
description: "Cấu hình storage engine Amazon S3 tích hợp sẵn của NocoBase: Region, AccessKey ID/Secret, tên Bucket, dùng cho AWS Cloud Storage."
keywords: "Amazon S3,AWS,Bucket,AccessKey,Cloud Storage,Cấu hình S3,NocoBase"
---

# Storage engine: Amazon S3

Storage engine dựa trên Amazon S3, cần chuẩn bị tài khoản và quyền liên quan trước khi sử dụng.


:::warning Lưu ý

Engine này không hỗ trợ truy cập riêng tư. Sau khi file được upload, NocoBase tạo URL có thể truy cập trực tiếp, và bất kỳ ai có URL đó đều có thể truy cập file.

Ngay cả khi bucket S3 được cấu hình riêng tư, engine Amazon S3 tích hợp sẵn cũng không tạo URL ký tạm thời để truy cập file. Nếu cần truy cập riêng tư, hãy dùng [S3 Pro](./s3-pro). Nếu đã có file lịch sử, hãy xem [Di chuyển sang S3 Pro](./migrate-to-s3-pro.md).

:::

## Tham số cấu hình

![Ví dụ cấu hình storage engine Amazon S3](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số dành riêng cho storage engine Amazon S3. Đối với các tham số chung, vui lòng tham khảo [Tham số chung của engine](./index#tham-số-chung).
:::

### Region

Điền Region của S3, ví dụ: `us-west-1`.

:::info{title=Mẹo}
Có thể xem thông tin Region của Bucket tại [Amazon S3 Console](https://console.aws.amazon.com/s3/), chỉ cần lấy phần tiền tố Region (không cần tên miền đầy đủ).
:::

### AccessKey ID

Điền ID của khóa truy cập được ủy quyền của Amazon S3.

### AccessKey Secret

Điền Secret của khóa truy cập được ủy quyền của Amazon S3.

### Bucket

Điền tên Bucket của S3.
