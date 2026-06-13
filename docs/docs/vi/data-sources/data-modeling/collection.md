---
title: "Tổng quan Collection"
description: "Khái niệm Collection: định nghĩa mô hình dữ liệu, Field, index, liên kết, tạo hoặc đồng bộ bảng hiện có thông qua quản lý Data Source."
keywords: "Collection,Collection,mô hình dữ liệu,định nghĩa Field,liên kết,NocoBase"
---

# Tổng quan Collection

NocoBase cung cấp một DSL đặc trưng để mô tả cấu trúc dữ liệu, gọi là Collection, thống nhất cấu trúc dữ liệu từ các nguồn khác nhau, đặt nền tảng đáng tin cậy cho việc quản lý, phân tích và ứng dụng dữ liệu sau này.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Để sử dụng thuận tiện các loại mô hình dữ liệu khác nhau, NocoBase hỗ trợ tạo nhiều loại Collection:

- [Bảng thông thường](/data-sources/data-source-main/general-collection): Có sẵn các Field hệ thống thông dụng.
- [Bảng kế thừa](/data-sources/data-source-main/inheritance-collection): Bạn có thể tạo một bảng cha, sau đó tạo bảng con từ bảng cha đó. Bảng con sẽ kế thừa cấu trúc của bảng cha, đồng thời cũng có thể định nghĩa các cột riêng.
- [Bảng cây](/data-sources/collection-tree): Bảng cấu trúc cây, hiện chỉ hỗ trợ thiết kế adjacency list.
- [Bảng lịch](/data-sources/calendar/calendar-collection): Dùng để tạo bảng sự kiện liên quan đến lịch.
- [Bảng tệp](/data-sources/file-manager/file-collection): Dùng để quản lý lưu trữ tệp.
- : Dùng cho các tình huống biểu thức động trong workflow.
- [Bảng SQL](/data-sources/collection-sql): Không phải là bảng database thực tế, mà là cách hiển thị nhanh truy vấn SQL theo dạng có cấu trúc.
- [Bảng View](/data-sources/collection-view): Kết nối Database View hiện có.
- [Bảng bên ngoài](/data-sources/collection-fdw): Cho phép hệ thống database trực tiếp truy cập và truy vấn dữ liệu trong các Data Source bên ngoài, dựa trên công nghệ FDW.
