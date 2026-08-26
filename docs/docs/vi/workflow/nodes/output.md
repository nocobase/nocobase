---
pkg: '@nocobase/plugin-workflow-subflow'
title: "Node Workflow - Đầu ra luồng"
description: "Node đầu ra luồng: định nghĩa giá trị đầu ra trong Workflow được gọi để bên gọi sử dụng."
keywords: "workflow,đầu ra luồng,Output,đầu ra luồng con,truyền biến,NocoBase"
---

# Đầu ra luồng

## Giới thiệu

Node "Đầu ra luồng" được dùng để định nghĩa giá trị đầu ra của Workflow trong Workflow được gọi. Khi một Workflow được Workflow khác gọi, có thể qua Node "Đầu ra luồng" truyền giá trị về cho bên gọi.

## Tạo Node

Trong Workflow được gọi, thêm Node "Đầu ra luồng":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Cấu hình Node

### Giá trị đầu ra

Nhập hoặc chọn biến làm giá trị đầu ra, giá trị đầu ra có thể là loại bất kỳ, có thể là hằng số như chuỗi, số, giá trị logic, ngày hoặc JSON tùy chỉnh..., cũng có thể là biến khác trong quy trình.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Mẹo}
Nếu trong Workflow được gọi có thêm nhiều Node "Đầu ra luồng", thì khi gọi Workflow đó, sẽ xuất theo giá trị của Node "Đầu ra luồng" được thực thi cuối cùng.
:::
