---
pkg: "@nocobase/plugin-data-source-main"
title: "General Collection"
description: "Collection thông thường tích hợp sẵn các field hệ thống thông dụng (Created By, Updated By, Created At, Updated At, v.v.), phù hợp cho data modeling nghiệp vụ thông thường."
keywords: "General Collection,General Collection,Field hệ thống,Collection,NocoBase"
---
# General Collection

## Giới thiệu

Dùng cho hầu hết các tình huống. Trừ khi cần template Collection đặc biệt, còn lại đều có thể dùng General Collection.

## Hướng dẫn sử dụng

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

### Set field khóa chính

Collection cần chỉ định field khóa chính, khi tạo Collection mới khuyến nghị tích chọn field ID preset, kiểu khóa chính mặc định của field ID là `Snowflake ID (53-bit)`

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Di chuột qua Interface của field ID có thể chọn các kiểu khóa chính khác.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Các kiểu khóa chính có thể chọn:
- [Text](/data-sources/data-modeling/collection-fields/basic/input)
- [Integer](/data-sources/data-modeling/collection-fields/basic/integer)
- [Snowflake ID (53-bit)](/data-sources/data-modeling/collection-fields/advanced/snowflake-id)
- [UUID](/data-sources/data-modeling/collection-fields/advanced/uuid)
- [Nano ID](/data-sources/data-modeling/collection-fields/advanced/nano-id)
