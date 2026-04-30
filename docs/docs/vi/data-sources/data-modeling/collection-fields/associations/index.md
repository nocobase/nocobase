---
title: "Field quan hệ"
description: "Field quan hệ thiết lập kết nối giữa các bảng, hỗ trợ OneToOne, OneToMany, ManyToOne, ManyToMany, không cần field thực để lưu trữ."
keywords: "Field quan hệ,BelongsTo,HasMany,O2O,O2M,M2O,M2M,Field liên kết,NocoBase"
---

# Field quan hệ

Trong NocoBase, field quan hệ không phải là field thực, mà được dùng để thiết lập kết nối giữa các bảng. Khái niệm này tương đương với quan hệ trong relational database.

Trong relational database, các kiểu quan hệ phổ biến chủ yếu bao gồm:

- [OneToOne (One-to-one)](./o2o/index.md): Mỗi thực thể trong hai bảng chỉ có thể tương ứng với một thực thể trong bảng kia. Quan hệ này thường được dùng để lưu trữ các khía cạnh khác nhau của thực thể trong các bảng khác nhau, nhằm giảm dư thừa và cải thiện tính nhất quán của dữ liệu.
- [OneToMany (One-to-many)](./o2m/index.md): Mỗi thực thể trong một bảng có thể liên kết với nhiều thực thể trong bảng khác. Đây là một trong những kiểu quan hệ phổ biến nhất, ví dụ một tác giả có thể viết nhiều bài viết, nhưng một bài viết chỉ có thể có một tác giả.
- [ManyToOne (Many-to-one)](./m2o/index.md): Nhiều thực thể trong một bảng có thể liên kết với một thực thể trong bảng khác. Quan hệ này cũng rất phổ biến trong data modeling, ví dụ nhiều học sinh có thể thuộc về cùng một lớp học.
- [ManyToMany (Many-to-many)](./m2m/index.md): Nhiều thực thể trong hai bảng có thể liên kết với nhau. Quan hệ này thường yêu cầu một bảng trung gian để ghi lại liên kết giữa các thực thể, ví dụ mối quan hệ giữa học sinh và môn học, một học sinh có thể chọn nhiều môn học, và một môn học cũng có thể được nhiều học sinh chọn.

Các kiểu quan hệ này đều có vai trò quan trọng trong thiết kế database và data modeling, có thể giúp mô tả các quan hệ và cấu trúc dữ liệu phức tạp trong thế giới thực.
