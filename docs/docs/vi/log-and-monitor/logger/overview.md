---
pkg: '@nocobase/plugin-logger'
title: "Tổng quan Log và Audit"
description: "Hệ thống log NocoBase: log server (vận hành hệ thống, request), audit log (thao tác người dùng, thay đổi tài nguyên), record history (giá trị trước/sau thay đổi dữ liệu, so sánh phiên bản)."
keywords: "log server,audit log,record history,log request,audit thao tác người dùng,history thay đổi dữ liệu,NocoBase"
---

# Log server, Audit log, Record history

## Log server

### Log vận hành hệ thống

> Tham khảo [Log hệ thống](./index.md#log-hệ-thống)

- Ghi lại thông tin vận hành của hệ thống ứng dụng, theo dõi chuỗi thực thi của logic code, truy xuất các thông tin bất thường như lỗi chạy code.
- Có phân cấp log, phân loại theo module chức năng.
- Output qua terminal hoặc lưu dưới dạng file.
- Chủ yếu được dùng để khắc phục các tình huống bất thường xảy ra trong quá trình vận hành hệ thống.

### Log request

> Tham khảo [Log request](./index.md#log-request)

- Ghi lại thông tin request và response của HTTP API, tập trung vào việc ghi lại Request ID, API Path, header request, status code response, thời gian, v.v.
- Output qua terminal hoặc lưu dưới dạng file.
- Chủ yếu được dùng để theo dõi việc gọi và thực thi của API.

## Audit log

> Tham khảo [Audit log](/security/audit-logger/index.md)

- Ghi lại các hành vi thao tác của người dùng (API) đối với tài nguyên hệ thống, tập trung vào việc ghi lại loại tài nguyên, đối tượng tài nguyên, loại thao tác, thông tin người dùng, trạng thái thao tác, v.v.
- Để theo dõi tốt hơn nội dung và kết quả cụ thể của các thao tác người dùng, tham số request và response request sẽ được ghi lại dưới dạng thông tin MetaData. Phần thông tin này có một phần trùng lặp với log request nhưng không hoàn toàn nhất quán, ví dụ trong log request hiện tại thường cũng không ghi lại request body đầy đủ.
- Tham số request và response request không tương đương với snapshot của tài nguyên, có thể biết được các thay đổi do thao tác tạo ra thông qua tham số và logic code, nhưng không thể biết chính xác nội dung trước khi sửa đổi của bản ghi bảng dữ liệu, để thực hiện kiểm soát phiên bản và khôi phục dữ liệu sau thao tác sai.
- Lưu trữ dưới dạng file và bảng dữ liệu

![](https://static-docs.nocobase.com/202501031627922.png)

## Record history

> Tham khảo [Record history](/record-history/index.md)

- Ghi lại lịch sử thay đổi của nội dung dữ liệu.
- Nội dung chính được ghi là loại tài nguyên, đối tượng tài nguyên, loại thao tác, field thay đổi, giá trị trước và sau khi thay đổi.
- Có thể dùng để so sánh dữ liệu.
- Lưu trữ dưới dạng bảng dữ liệu.

![](https://static-docs.nocobase.com/202511011338499.png)
