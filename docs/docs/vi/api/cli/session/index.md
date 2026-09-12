---
title: "nb session"
description: "Tài liệu lệnh nb session: cấu hình và kiểm tra `NB_SESSION_ID` để cô lập env hiện tại theo từng shell hoặc runtime agent."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

Quản lý session mode cho `NB_SESSION_ID`.

Sau khi session mode được bật, `nb env use` và `nb env current` sẽ ưu tiên dùng ngữ cảnh của shell hoặc runtime agent hiện tại, thay vì trực tiếp chia sẻ một current env toàn cục duy nhất.

## Cách dùng


nb session <command>

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb session setup`](./setup.md) | Cài đặt tích hợp shell hoặc runtime cho `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Hiển thị id phiên đang có hiệu lực |
| [`nb session remove`](./remove.md) | Gỡ tích hợp shell hoặc runtime cho `NB_SESSION_ID` |

## Khi nào bạn cần

Khuyến nghị mặc định là chạy `nb session setup` một lần khi bạn bắt đầu dùng CLI. Khi đó:

- terminal 1 có thể dùng `env1`
- terminal 2 có thể dùng `env2` cùng lúc
- runtime agent cũng có thể giữ current env riêng của nó

Nếu không có session mode, các phiên khác nhau sẽ cùng fallback về một `last env` toàn cục, khiến công việc song song dễ ảnh hưởng lẫn nhau hơn.

## Lệnh liên quan

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
