:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/system-management/localization/index).
:::

# Quản lý bản địa hóa

## Giới thiệu

Plugin quản lý bản địa hóa được sử dụng để quản lý và triển khai các tài nguyên bản địa hóa của NocoBase, có thể dịch menu hệ thống, bộ sưu tập, trường và tất cả các plugin để thích ứng với ngôn ngữ và văn hóa của các khu vực cụ thể.

## Cài đặt

Plugin này là plugin tích hợp sẵn, không cần cài đặt thêm.

## Hướng dẫn sử dụng

### Kích hoạt plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Truy cập trang quản lý bản địa hóa

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Đồng bộ từ khóa dịch

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Hiện tại hỗ trợ đồng bộ các nội dung sau:

- Gói ngôn ngữ địa phương của hệ thống và plugin
- Tiêu đề bộ sưu tập, tiêu đề trường và nhãn tùy chọn trường
- Tiêu đề menu

Sau khi hoàn tất đồng bộ, hệ thống sẽ liệt kê tất cả các từ khóa có thể dịch của ngôn ngữ hiện tại.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Gợi ý}
Các mô-đun khác nhau có thể có cùng một từ khóa gốc, cần phải dịch riêng biệt.
:::

### Tự động tạo từ khóa

Khi chỉnh sửa trang, các văn bản tùy chỉnh trong mỗi khối sẽ tự động tạo từ khóa tương ứng và đồng bộ tạo nội dung dịch cho ngôn ngữ hiện tại.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Gợi ý}
Khi định nghĩa văn bản trong mã nguồn, cần chỉ định ns (namespace) một cách thủ công, ví dụ: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Chỉnh sửa nội dung dịch

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Xuất bản bản dịch

Sau khi hoàn thành bản dịch, cần nhấp vào nút "Xuất bản" để các thay đổi có hiệu lực.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Dịch các ngôn ngữ khác

Bật các ngôn ngữ khác trong "Cài đặt hệ thống", ví dụ: Tiếng Trung giản thể.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Chuyển sang môi trường ngôn ngữ đó.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Đồng bộ từ khóa.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Dịch và xuất bản.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>