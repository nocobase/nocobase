---
title: 'nb backup'
description: 'Tài liệu tham khảo lệnh nb backup: tạo bản sao lưu NocoBase và tải về cục bộ, hoặc khôi phục tệp sao lưu cục bộ vào env đích.'
keywords: 'nb backup,NocoBase CLI,sao lưu,khôi phục,nbdata'
---

# nb backup

Tạo hoặc khôi phục bản sao lưu NocoBase. `nb backup create` sẽ tạo bản sao lưu từ xa trong env đích, sau đó tải tệp sao lưu về cục bộ; `nb backup restore` sẽ tải tệp sao lưu cục bộ lên env đích và chờ ứng dụng sẵn sàng trở lại.

## Cách dùng

```bash
nb backup <command>
```

## Lệnh con

| Lệnh                                | Mô tả                                     |
| ----------------------------------- | ----------------------------------------- |
| [`nb backup create`](./create.md)   | Tạo bản sao lưu và tải về cục bộ          |
| [`nb backup restore`](./restore.md) | Khôi phục tệp sao lưu cục bộ vào env đích |

## Ví dụ

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Mô tả

Trước khi thực thi, CLI trước tiên sẽ kiểm tra xem env đích có cung cấp các lệnh runtime liên quan đến sao lưu hay không. Nếu thiếu lệnh, CLI sẽ tự động làm mới bộ nhớ đệm runtime một lần; nếu sau khi làm mới mà vẫn thiếu khả năng `nb api backup ...`, điều đó có nghĩa là env đích vẫn chưa bật hoặc đồng bộ khả năng backup/restore, và lúc này bạn cần xử lý chính ứng dụng đích trước.

Cụ thể:

- `nb backup create` phụ thuộc vào `nb api backup create`, `nb api backup status`, và `nb api backup download`
- `nb backup restore` phụ thuộc vào `nb api backup restore-upload`

## Các lệnh liên quan

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
