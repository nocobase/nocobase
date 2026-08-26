---
title: "Quản lý phát hành"
description: "Skill quản lý phát hành dùng để thực hiện các thao tác phát hành có thể kiểm toán giữa nhiều môi trường, hỗ trợ khôi phục từ bản sao lưu và di chuyển."
keywords: "AI Builder,Quản lý phát hành,Phát hành đa môi trường,Khôi phục sao lưu,Di chuyển"
---

# Quản lý phát hành

:::tip Điều kiện tiên quyết

- Trước khi đọc trang này, hãy cài đặt NocoBase CLI và hoàn tất khởi tạo theo [Bắt đầu nhanh AI Builder](./index.md)
- Cần có giấy phép bản Professional trở lên. Xem [NocoBase Commercial Edition](https://www.nocobase.com/cn/commercial)
- Bật hai plugin "Quản lý sao lưu" và "Quản lý di chuyển", rồi nâng cấp chúng lên phiên bản mới nhất

:::

## Giới thiệu

Skill quản lý phát hành dùng để thực hiện các thao tác phát hành giữa nhiều môi trường NocoBase. Skill này hỗ trợ hai cách: khôi phục từ bản sao lưu và di chuyển.

Nếu bạn chỉ muốn ghi đè hoàn toàn một môi trường bằng một môi trường khác, thông thường khôi phục từ bản sao lưu là đủ. Nếu bạn cần kiểm soát theo quy tắc nội dung nào được đồng bộ, ví dụ chỉ đồng bộ cấu trúc mà không đồng bộ dữ liệu nghiệp vụ, di chuyển sẽ phù hợp hơn.

## Phạm vi năng lực

- Khôi phục sao lưu trong một môi trường: dùng gói sao lưu đã có để khôi phục môi trường hiện tại
- Khôi phục sao lưu tức thời trong một môi trường: tạo bản sao lưu của môi trường hiện tại trước, rồi dùng bản sao lưu đó để khôi phục môi trường hiện tại
- Khôi phục sao lưu đa môi trường: khôi phục gói sao lưu của môi trường nguồn vào môi trường đích
- Di chuyển đa môi trường: dùng gói di chuyển để cập nhật khác biệt cho môi trường đích

## Ví dụ câu lệnh

### Tình huống A: khôi phục sao lưu trong một môi trường với tệp được chỉ định

:::tip Điều kiện tiên quyết

Trong môi trường hiện tại cần có sẵn tệp sao lưu cùng tên.

:::

```text
Khôi phục bằng bản sao lưu <file-name.nbdata>
```

Skill sẽ dùng tệp sao lưu cùng tên đã có trên máy chủ của môi trường hiện tại để khôi phục.

### Tình huống B: khôi phục sao lưu trong một môi trường mà không chỉ định tệp

```text
Sao lưu và khôi phục môi trường hiện tại
```

Skill sẽ tạo bản sao lưu của môi trường hiện tại trước, rồi dùng bản sao lưu đó để khôi phục môi trường hiện tại.

### Tình huống C: khôi phục sao lưu đa môi trường

:::tip Điều kiện tiên quyết

Chuẩn bị hai môi trường, ví dụ môi trường dev trên máy cục bộ và môi trường test từ xa, hoặc hai môi trường cục bộ. Bạn có thể chỉ định tệp sao lưu cụ thể hoặc không chỉ định.

:::

```text
Khôi phục dev sang test
```

Skill sẽ tạo gói sao lưu trong môi trường dev, rồi khôi phục gói sao lưu đó vào môi trường test.

### Tình huống D: di chuyển đa môi trường

:::tip Điều kiện tiên quyết

Tương tự tình huống C, hãy chuẩn bị hai môi trường. Bạn có thể chỉ định tệp di chuyển cụ thể hoặc không chỉ định.

:::

```text
Di chuyển dev sang test
```

Skill sẽ tạo gói di chuyển trong môi trường dev, rồi dùng gói di chuyển đó để cập nhật môi trường test.

## Câu hỏi thường gặp

**Nên chọn khôi phục sao lưu hay di chuyển?**

Mặc định dùng khôi phục sao lưu là đủ, đặc biệt khi bạn đã có gói sao lưu dùng được hoặc muốn môi trường đích được ghi đè hoàn toàn bằng trạng thái của môi trường nguồn. Chỉ dùng di chuyển khi bạn cần kiểm soát phạm vi đồng bộ theo quy tắc, ví dụ chỉ đồng bộ cấu trúc mà không đồng bộ dữ liệu.

**Không có plugin di chuyển nghĩa là gì?**

Plugin Quản lý di chuyển yêu cầu giấy phép bản Professional trở lên. Xem [NocoBase Commercial Edition](https://www.nocobase.com/cn/commercial) để biết chi tiết.

## Liên kết liên quan

- [Tổng quan AI Builder](./index.md) — tổng quan và cách cài đặt tất cả AI Builder Skills
- [Quản lý môi trường](./env-bootstrap) — kiểm tra môi trường, cài đặt, triển khai và chẩn đoán sự cố
