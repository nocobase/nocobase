---
pkg: '@nocobase/plugin-file-manager'
title: "Preview file"
description: "File field hỗ trợ click vào thumbnail để preview, có sẵn các định dạng được trình duyệt hỗ trợ như hình ảnh, PDF, video, có thể mở rộng plugin Office để preview Word/Excel/PPT."
keywords: "Preview file,Preview,thumbnail,Office preview,PDF preview,image preview,NocoBase"
---

# Preview file

Trong các giao diện có chứa file field (bao gồm cả field attachment), bạn có thể click vào thumbnail hoặc icon của file để preview. Tính năng preview tích hợp sẵn hỗ trợ nhiều loại file, bao gồm hình ảnh, PDF và hầu hết các loại file được trình duyệt hỗ trợ tự nhiên.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Đối với các loại file không hỗ trợ preview tự nhiên, có thể cài đặt hoặc mở rộng plugin preview file tương ứng để thực hiện tính năng preview. Ví dụ, sau khi cài đặt plugin preview file Office, bạn có thể preview các file Word, Excel và PowerPoint.

Hiện tại NocoBase cung cấp các plugin preview file:

* [Plugin preview file Office](../file-preview/ms-office.md)

## Preview PDF với storage bên ngoài

NocoBase preview PDF thông qua iframe của trình duyệt. Một số trình duyệt hoặc PDF reader có thể hỗ trợ script, form hoặc nội dung tương tác khác bên trong file PDF. Nếu file được preview đến từ nguồn không đáng tin cậy, hãy chú ý đến ranh giới bảo mật của việc thực thi script.

Chúng tôi khuyến nghị tách domain truy cập file khỏi domain của site NocoBase và domain API. Ví dụ, hãy phục vụ file từ OSS, S3, COS hoặc CDN qua một domain riêng, thay vì dùng chung origin với frontend hoặc API của NocoBase.

Nếu domain file khác với domain API, và API không bật CORS cho domain file, các script chạy trong môi trường preview PDF thường sẽ bị giới hạn bởi same-origin policy của trình duyệt. Chúng không thể đọc trực tiếp trang NocoBase, storage của trình duyệt hoặc response từ API.
