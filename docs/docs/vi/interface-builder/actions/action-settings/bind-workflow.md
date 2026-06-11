---
title: "Bind Workflow"
description: "Cấu hình Action: gắn nút Action với workflow, kích hoạt thực thi workflow chỉ định khi nhấp."
keywords: "bind workflow,gắn workflow,kích hoạt workflow,cấu hình Action,Interface Builder,NocoBase"
---

# Bind Workflow

## Giới thiệu

Trên một số nút Action, có thể cấu hình bind workflow, dùng để gắn Action gửi này với workflow, thực hiện xử lý tự động hóa dữ liệu.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Loại Action và workflow được hỗ trợ

Hiện tại các loại nút Action và workflow có thể bind như sau:

| Nút Action \ Loại workflow | Sự kiện trước Action | Sự kiện sau Action | Sự kiện phê duyệt | Sự kiện Action tùy chỉnh |
| --- | --- | --- | --- | --- |
| Nút "Submit", "Save" của Form | ✅ | ✅ | ✅ | ❌ |
| Nút "Update record" trong hàng dữ liệu (Table, danh sách, v.v.) | ✅ | ✅ | ✅ | ❌ |
| Nút "Delete" trong hàng dữ liệu (Table, danh sách, v.v.) | ✅ | ❌ | ❌ | ❌ |
| Nút "Trigger workflow" | ❌ | ❌ | ❌ | ✅ |

## Bind nhiều workflow đồng thời

Một nút Action có thể bind nhiều workflow, khi bind nhiều workflow, thứ tự thực thi của workflow tuân theo các quy tắc sau:

1. Trong cùng loại trigger, workflow đồng bộ được thực thi trước, workflow bất đồng bộ được thực thi sau.
2. Workflow cùng loại trigger được thực thi theo thứ tự cấu hình.
3. Giữa workflow của các loại trigger khác nhau:
    1. Sự kiện trước Action chắc chắn được thực thi trước sự kiện sau Action và sự kiện phê duyệt
    2. Sự kiện sau Action và sự kiện phê duyệt không có thứ tự cụ thể, nghiệp vụ không nên dựa vào thứ tự cấu hình.

## Tìm hiểu thêm

Các loại sự kiện workflow khác nhau, tham khảo giới thiệu chi tiết của Plugin liên quan:

* [Sự kiện sau Action]
* [Sự kiện trước Action]
* [Sự kiện phê duyệt]
* [Sự kiện Action tùy chỉnh]
