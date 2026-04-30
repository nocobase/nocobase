---
title: "Quản lý phát hành"
description: "Skill quản lý phát hành dùng để thực hiện các thao tác phát hành có thể kiểm toán giữa nhiều môi trường."
keywords: "AI Builder,Quản lý phát hành,Phát hành đa môi trường,Sao lưu khôi phục,Di chuyển"
---

# Quản lý phát hành

:::tip Điều kiện tiên quyết

- Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).
- Phải có giấy phép từ phiên bản Professional trở lên [NocoBase Commercial](https://www.nocobase.com/cn/commercial).
- Đảm bảo đã kích hoạt cả hai Plugin Quản lý sao lưu và Quản lý di chuyển, đồng thời nâng cấp lên phiên bản mới nhất.

:::

:::warning Lưu ý
CLI liên quan đến quản lý phát hành vẫn đang được phát triển liên tục, hiện chưa hỗ trợ sử dụng.
:::
## Giới thiệu

Skill quản lý phát hành dùng để thực hiện các thao tác phát hành giữa nhiều môi trường — hỗ trợ hai phương thức phát hành: sao lưu khôi phục và di chuyển.


## Phạm vi năng lực

- Sao lưu khôi phục đơn môi trường: dùng gói sao lưu để khôi phục toàn bộ dữ liệu của máy này.
- Sao lưu khôi phục đa môi trường: dùng gói sao lưu để khôi phục toàn bộ dữ liệu của môi trường đích.
- Di chuyển đa môi trường: dùng gói di chuyển mới tạo để cập nhật chênh lệch dữ liệu môi trường đích.

## Ví dụ câu lệnh

### Tình huống A: Sao lưu khôi phục đơn môi trường
:::tip Điều kiện tiên quyết

Môi trường hiện tại cần có một gói sao lưu hoặc sao lưu trước rồi khôi phục

:::

Chế độ câu lệnh
```
Sử dụng <file-name> để sao lưu khôi phục
```
Chế độ dòng lệnh
```
// Xem các gói sao lưu khả dụng, nếu chưa có gói sao lưu, chạy nb backup <file-name>
nb backup list
nb restore <file-name>
```
![Sao lưu khôi phục](https://static-docs.nocobase.com/20260417150854.png)

### Tình huống B: Sao lưu khôi phục đa môi trường

:::tip Điều kiện tiên quyết

Cần chuẩn bị hai môi trường, ví dụ một môi trường dev cục bộ và một môi trường test từ xa, hoặc cài đặt hai môi trường ở cục bộ.

:::

Chế độ câu lệnh
```
Khôi phục dev sang test
```
Chế độ dòng lệnh
```
// Xem các gói sao lưu khả dụng, nếu chưa có gói sao lưu, chạy nb backup <file-name> --env dev
nb backup list --env dev
// Dùng gói sao lưu để khôi phục
nb restore <file-name> --env test
```
![Sao lưu khôi phục](https://static-docs.nocobase.com/20260417150854.png)

### Tình huống C: Di chuyển đa môi trường

:::tip Điều kiện tiên quyết

Tương tự như tình huống B, cần chuẩn bị hai môi trường, ví dụ một môi trường dev cục bộ và một môi trường test từ xa, hoặc cài đặt hai môi trường ở cục bộ.

:::

Chế độ câu lệnh
```
Di chuyển dev sang test
```
Chế độ dòng lệnh
```
// Tạo quy tắc di chuyển mới, sẽ sinh ra một ruleId mới hoặc dùng nb migration rule list --env dev để lấy ruleId lịch sử
nb migration rule add --env dev
// Dùng ruleId để sinh gói di chuyển
nb migration generate <ruleId> --env dev
// Dùng gói di chuyển để di chuyển
nb migration run <file-name> --env test
```
![Phát hành di chuyển](https://static-docs.nocobase.com/20260417151022.png)

## Câu hỏi thường gặp

**Sao lưu khôi phục và di chuyển nên chọn cái nào?**

Nếu bạn đã có gói sao lưu sẵn dùng được, chọn sao lưu khôi phục. Nếu cần kiểm soát theo chiến lược việc dữ liệu nào được đồng bộ qua (ví dụ chỉ đồng bộ cấu trúc không đồng bộ dữ liệu), hãy chọn di chuyển.

**Không có Plugin di chuyển là vấn đề gì?**

Plugin Quản lý di chuyển yêu cầu phiên bản Professional trở lên, xem chi tiết tại [NocoBase Commercial](https://www.nocobase.com/cn/commercial).

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [Quản lý môi trường](./env-bootstrap) — Kiểm tra môi trường, cài đặt triển khai và chẩn đoán sự cố
