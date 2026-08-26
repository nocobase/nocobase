---
title: "File Manager"
description: "File collection, field attachment và storage engine, hỗ trợ Local Storage, Aliyun OSS, Amazon S3, Tencent COS, quản lý metadata và upload file."
keywords: "File manager,File collection,Field attachment,Storage engine,OSS,S3,COS,NocoBase"
---

# File Manager

<PluginInfo name="file-manager"></PluginInfo>

## Giới thiệu

Plugin file manager cung cấp file collection, field attachment và storage engine, dùng để quản lý file một cách hiệu quả. File là các bản ghi của bảng có cấu trúc đặc biệt, bảng có cấu trúc đặc biệt này được gọi là file collection, dùng để lưu trữ metadata của file, và có thể được quản lý thông qua file manager. Field attachment là field quan hệ đặc biệt được liên kết với file collection. File hỗ trợ nhiều cách lưu trữ, các storage engine hiện được hỗ trợ bao gồm Local Storage, Aliyun OSS, Amazon S3 và Tencent COS.

## Hướng dẫn sử dụng

### File Collection

Bảng attachments được tích hợp sẵn, dùng để lưu trữ tất cả file được liên kết bởi field attachment. Ngoài ra, bạn cũng có thể tạo file collection mới để lưu trữ các file cụ thể.

[Xem thêm cách dùng tại tài liệu giới thiệu File Collection](/data-sources/file-manager/file-collection)

### Field Attachment

Field attachment là field quan hệ đặc biệt được liên kết với file collection, có thể tạo thông qua "field kiểu attachment", cũng có thể cấu hình thông qua "field quan hệ".

[Xem thêm cách dùng tại tài liệu giới thiệu Field Attachment](/data-sources/file-manager/field-attachment)

### Storage Engine

Storage engine dùng để lưu file vào các dịch vụ cụ thể, bao gồm Local Storage (lưu vào ổ cứng máy chủ), cloud storage, v.v.

[Xem thêm nội dung tại tài liệu giới thiệu Storage Engine](./storage/index.md)

### HTTP API

Upload file có thể được xử lý thông qua HTTP API, tham khảo [HTTP API](./http-api.md).

## Phát triển mở rộng

* 
