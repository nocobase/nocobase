---
title: "Quản lý bản địa hóa"
description: "Quản lý bản địa hóa: dịch menu, bảng dữ liệu, field, văn bản plugin, đồng bộ từ vựng, tự động tạo từ vựng, chỉnh sửa bản dịch, phát hành bản dịch, hỗ trợ chuyển đổi đa ngôn ngữ, plugin tích hợp sẵn."
keywords: "Quản lý bản địa hóa,dịch,đa ngôn ngữ,i18n,đồng bộ từ vựng,phát hành bản dịch,Quản lý hệ thống,NocoBase"
---

# Quản lý bản địa hóa

## Giới thiệu

Plugin Quản lý bản địa hóa dùng để quản lý và triển khai các tài nguyên bản địa hóa của NocoBase. Có thể dịch menu, bảng dữ liệu, field cùng tất cả các plugin của hệ thống để phù hợp với ngôn ngữ và văn hóa của khu vực cụ thể.

Nếu muốn đóng góp bản dịch mặc định cho hệ thống và plugin chính thức của NocoBase, xem [Đóng góp bản dịch](/get-started/translations).

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

Nếu bản dịch của các từ vựng tích hợp sẵn của hệ thống hoặc plugin bị sửa thủ công hoặc bị bản dịch AI ghi đè, hãy chọn `Reset system built-in entry translations` khi đồng bộ. Sau khi đồng bộ, hệ thống sẽ dùng bản dịch trong gói ngôn ngữ tích hợp để ghi đè bản dịch hiện có của ngôn ngữ hiện tại và khôi phục bản dịch mặc định.

### Tự động tạo từ vựng

Khi chỉnh sửa trang, các văn bản tùy chỉnh trong các block sẽ tự động tạo các từ vựng tương ứng và đồng thời sinh nội dung dịch của ngôn ngữ hiện tại.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Mẹo}
Khi định nghĩa văn bản trong code, cần chỉ định ns (namespace) thủ công, ví dụ: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Chỉnh sửa nội dung dịch

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

Cột bản dịch hỗ trợ chỉnh sửa nhanh. Bạn có thể click trực tiếp vào ô bản dịch trong bảng để sửa, nhấn Enter hoặc rời khỏi ô nhập để lưu, và nhấn `Esc` để hủy thay đổi lần này. Khi cần xem văn bản gốc, module hoặc bản dịch dài hơn, bạn vẫn có thể dùng nút chỉnh sửa trong thao tác dòng để mở editor dạng drawer.

### Sử dụng dịch bằng AI

Quản lý bản địa hóa hỗ trợ dịch từ vựng thông qua AI Employee Lina. Sau khi bật AI Employees và cấu hình dịch vụ mô hình, bạn có thể dùng chức năng dịch bằng AI trên trang Quản lý bản địa hóa để tạo bản dịch hàng loạt cho ngôn ngữ hiện tại.

![](https://static-docs.nocobase.com/202605121152196.png)

Các phạm vi dịch được hỗ trợ:

- **Dịch toàn bộ**: dịch tất cả từ vựng trong ngôn ngữ hiện tại và ghi đè bản dịch hiện có.
- **Dịch tăng dần**: chỉ dịch các từ vựng chưa có bản dịch trong ngôn ngữ hiện tại. Với từ vựng tích hợp, nếu bản dịch đã tồn tại trong gói ngôn ngữ hệ thống hoặc plugin của ngôn ngữ đích, cũng được xem là đã có bản dịch.
- **Dịch mục đã chọn**: chọn bản ghi trong bảng và chỉ dịch nội dung đã chọn.

![](https://static-docs.nocobase.com/202605191341968.png)

Khi tạo tác vụ dịch toàn bộ hoặc dịch tăng dần, bạn có thể chọn phạm vi dịch trong hộp thoại xác nhận:

- **Tất cả**: xử lý tất cả từ vựng phù hợp với điều kiện tác vụ hiện tại.
- **Từ vựng tích hợp**: từ vựng hệ thống và plugin.
- **Từ vựng tùy chỉnh**: tên route, tên collection và field, cùng nội dung UI.

Hộp thoại xác nhận cũng hỗ trợ cấu hình ngôn ngữ bản dịch tham chiếu. Dịch toàn bộ và dịch tăng dần cấu hình riêng ngôn ngữ mặc định và ngôn ngữ dự phòng cho từ vựng tích hợp và từ vựng tùy chỉnh. Dịch mục đã chọn chỉ hiển thị một cấu hình ngôn ngữ tham chiếu chung.

Dịch bằng AI sẽ tạo một tác vụ chạy nền. Bạn có thể xem tiến độ trong lúc tác vụ chạy. Sau khi hoàn tất, bản dịch được ghi vào ngôn ngữ tương ứng và vẫn cần được kiểm tra, hiệu chỉnh theo ngữ cảnh thực tế.

Xem hướng dẫn đầy đủ tại [AI Employee - Lina](/ai-employees/built-in/lina).

:::warning{title=Lưu ý}
Bản dịch do AI tạo có thể sai lệch ngữ nghĩa, không nhất quán thuật ngữ hoặc chưa hiểu đủ ngữ cảnh. Trước khi phát hành, hãy kiểm tra thủ công các trang quan trọng, thuật ngữ nghiệp vụ và nội dung hiển thị cho người dùng.
:::

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
