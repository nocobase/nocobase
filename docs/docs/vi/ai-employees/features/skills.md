---
pkg: '@nocobase/plugin-ai'
title: 'Sử dụng Skills cho Nhân viên AI'
description: 'Skills là hướng dẫn kiến thức chuyên ngành cho Nhân viên AI: General skills, Employee-specific skills.'
keywords: 'Skills Nhân viên AI,Skills,NocoBase'
---

# Sử dụng Skills

Skills là hướng dẫn kiến thức chuyên ngành cung cấp cho Nhân viên AI, hướng dẫn Nhân viên AI sử dụng nhiều công cụ để xử lý các tác vụ chuyên ngành.

Hiện tại Skills không hỗ trợ tùy chỉnh, chỉ được hệ thống thiết lập sẵn.

## Cấu trúc Skills

Trang Skills chia thành hai loại:

1. `General skills`: Tất cả Nhân viên AI dùng chung, thường chỉ đọc.
2. `Employee-specific skills`: Chuyên dụng cho nhân viên hiện tại.

![](https://static-docs.nocobase.com/202604230832639.png)

## Giới thiệu Skills

### Skills tổng quát

| Tên Skill | Mô tả chức năng |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Data metadata | Lấy mô hình dữ liệu hệ thống, bảng dữ liệu, thông tin Field và các metadata khác, giúp Nhân viên AI hiểu ngữ cảnh nghiệp vụ. |
| Data query | Truy vấn dữ liệu trong bảng dữ liệu, hỗ trợ lọc điều kiện, truy vấn tổng hợp và các chức năng khác, giúp Nhân viên AI lấy dữ liệu nghiệp vụ. |
| Business analysis report | Tạo báo cáo phân tích dựa trên dữ liệu nghiệp vụ, hỗ trợ phân tích đa chiều và trực quan hóa, giúp Nhân viên AI thực hiện insight nghiệp vụ. |
| Document search | Tìm kiếm và đọc nội dung tài liệu được cấu hình sẵn, giúp Nhân viên AI hoàn thành công việc dựa trên tài liệu, hiện tại chủ yếu là viết mã JS. |

### Skills chuyên dụng

| Tên Skill | Mô tả chức năng | Nhân viên sở hữu |
| ------------------ | ------------------------------------ | -------- |
| Data modeling | Skill mô hình hóa dữ liệu, hiểu và xây dựng mô hình dữ liệu nghiệp vụ | Orin |
| Frontend developer | Viết và kiểm tra mã JS cho Block front-end | Nathan |
