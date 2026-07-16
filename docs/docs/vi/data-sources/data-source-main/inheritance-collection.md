---
pkg: "@nocobase/plugin-data-source-main"
title: "Inheritance Collection"
description: "Inheritance Collection mở rộng field dựa trên bảng có sẵn, bảng con kế thừa field và dữ liệu từ bảng cha, phù hợp cho các tình huống tái sử dụng và mở rộng cấu trúc bảng, chỉ PostgreSQL hỗ trợ."
keywords: "Inheritance Collection,Inheritance Collection,Table inheritance,Mở rộng Collection,PostgreSQL,NocoBase"
---
# Inheritance Collection

## Giới thiệu

:::warning
Chỉ hỗ trợ khi Database chính là PostgreSQL.
:::

Bạn có thể tạo một bảng cha, sau đó dẫn xuất bảng con từ bảng cha đó. Bảng con sẽ kế thừa cấu trúc của bảng cha, đồng thời còn có thể định nghĩa các cột riêng. Mô hình thiết kế này giúp tổ chức và quản lý dữ liệu có cấu trúc tương tự nhưng có thể có một số khác biệt.

Sau đây là một số đặc điểm phổ biến về Inheritance Collection:

Bảng cha: Bảng cha chứa các cột và dữ liệu chung, định nghĩa cấu trúc cơ bản của toàn bộ hệ thống cấu trúc kế thừa.
Bảng con: Bảng con kế thừa cấu trúc của bảng cha, nhưng còn có thể định nghĩa thêm các cột riêng. Điều này cho phép mỗi bảng con có các thuộc tính chung của bảng cha, đồng thời có thể chứa các thuộc tính đặc thù của subclass.
Truy vấn: Khi truy vấn, có thể chọn truy vấn toàn bộ hệ thống cấu trúc kế thừa, hoặc chỉ truy vấn bảng cha hoặc bảng con cụ thể. Điều này giúp có thể truy xuất và xử lý dữ liệu ở các cấp độ khác nhau theo nhu cầu.
Quan hệ kế thừa: Quan hệ kế thừa được thiết lập giữa bảng cha và bảng con, điều này có nghĩa là có thể sử dụng cấu trúc của bảng cha để định nghĩa các thuộc tính nhất quán, đồng thời cho phép bảng con mở rộng hoặc ghi đè những thuộc tính này.
Mô hình thiết kế này giúp giảm dư thừa dữ liệu, đơn giản hóa data model, đồng thời làm cho dữ liệu dễ bảo trì hơn. Tuy nhiên, cần sử dụng cẩn thận, vì Inheritance Collection có thể tăng độ phức tạp của truy vấn, đặc biệt là khi xử lý toàn bộ hệ thống cấu trúc kế thừa. Các database system hỗ trợ Inheritance Collection thường cung cấp cú pháp và công cụ cụ thể để quản lý và truy vấn cấu trúc bảng này.


## Hướng dẫn sử dụng

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)
