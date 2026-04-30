---
title: "Quản lý bản địa hóa"
description: "Quản lý bản địa hóa: dịch menu, bảng dữ liệu, field, văn bản plugin, đồng bộ từ vựng, tự động tạo từ vựng, chỉnh sửa bản dịch, phát hành bản dịch, hỗ trợ chuyển đổi đa ngôn ngữ, plugin tích hợp sẵn."
keywords: "Quản lý bản địa hóa,dịch,đa ngôn ngữ,i18n,đồng bộ từ vựng,phát hành bản dịch,Quản lý hệ thống,NocoBase"
---

# Quản lý bản địa hóa

## Giới thiệu

Plugin Quản lý bản địa hóa dùng để quản lý và triển khai các tài nguyên bản địa hóa của NocoBase. Có thể dịch menu, bảng dữ liệu, field cùng tất cả các plugin của hệ thống để phù hợp với ngôn ngữ và văn hóa của khu vực cụ thể.

## Cài đặt

Plugin này là plugin tích hợp sẵn, không cần cài đặt thêm.

## Hướng dẫn sử dụng

### Kích hoạt plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Vào trang Quản lý bản địa hóa

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Đồng bộ từ vựng dịch

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Hiện tại hỗ trợ đồng bộ các nội dung sau:

- Gói ngôn ngữ địa phương của hệ thống và plugin
- Tiêu đề bảng dữ liệu, tiêu đề field và label tùy chọn field
- Tiêu đề menu

Sau khi đồng bộ xong, hệ thống sẽ liệt kê tất cả các từ vựng có thể dịch của ngôn ngữ hiện tại.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Mẹo}
Các module khác nhau có thể có các từ vựng gốc giống nhau, cần dịch riêng từng cái.
:::

### Tự động tạo từ vựng

Khi chỉnh sửa trang, các văn bản tùy chỉnh trong các block sẽ tự động tạo các từ vựng tương ứng và đồng thời sinh nội dung dịch của ngôn ngữ hiện tại.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Mẹo}
Khi định nghĩa văn bản trong code, cần chỉ định ns (namespace) thủ công, ví dụ: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Chỉnh sửa nội dung dịch

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Phát hành bản dịch

Sau khi dịch xong, cần click nút "Phát hành" để các thay đổi có hiệu lực.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Dịch ngôn ngữ khác

Trong "System Settings" kích hoạt ngôn ngữ khác, ví dụ tiếng Trung giản thể.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Chuyển sang môi trường ngôn ngữ đó.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Đồng bộ từ vựng.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Dịch và phát hành.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>
