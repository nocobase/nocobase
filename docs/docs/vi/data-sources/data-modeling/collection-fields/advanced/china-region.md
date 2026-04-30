---
title: "China Region"
description: "Field khu vực hành chính Trung Quốc, hỗ trợ chọn liên cấp Tỉnh/Thành phố/Quận, phù hợp cho các tình huống địa chỉ, quê quán."
keywords: "China Region,Tỉnh/Thành phố/Quận,Field khu vực hành chính,Liên cấp 3 cấp,NocoBase"
---

# China Region

<PluginInfo name="field-china-region"></PluginInfo>

## Giới thiệu

Field China Region được dùng để lưu trữ thông tin khu vực hành chính Trung Quốc như tỉnh, thành phố, quận/huyện trong Collection. Field này dựa trên Collection khu vực hành chính `chinaRegions` được tích hợp sẵn, cung cấp bộ chọn cascade, người dùng có thể chọn theo cấp độ tỉnh, thành phố, quận trong form.

Các tình huống áp dụng bao gồm:

- Vị trí của khách hàng, người liên hệ, cửa hàng, dự án, v.v.
- Thông tin địa chỉ cơ bản như nơi đăng ký hộ khẩu, quê quán, khu vực giao hàng
- Dữ liệu cần lọc hoặc thống kê theo tỉnh/thành phố/quận

Giá trị field được lưu dưới dạng bản ghi liên kết, mặc định liên kết với Collection `chinaRegions` và hiển thị theo thứ tự cấp độ khu vực hành chính. Ví dụ sau khi chọn "Bắc Kinh / Quận đô thị / Đông Thành", trạng thái hiển thị sẽ ghép thành đường dẫn đầy đủ theo cấp độ.

## Cấu hình Field

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

Khi tạo field, chọn kiểu field là "China Region", bạn có thể cấu hình các tùy chọn sau:

| Tùy chọn | Mô tả |
| --- | --- |
| Cấp độ chọn | Kiểm soát cấp độ sâu nhất có thể chọn. Hiện tại hỗ trợ "Tỉnh", "Thành phố", "Quận", mặc định là "Quận". "Phường", "Thôn" ở trạng thái bị vô hiệu hóa trong giao diện. |
| Phải chọn đến cấp cuối cùng | Khi tích chọn, người dùng phải chọn đến cấp độ sâu nhất đã cấu hình mới có thể submit; khi không tích, có thể hoàn thành chọn ở cấp độ trung gian. |

## Sử dụng giao diện

Trong form, field China Region được hiển thị dưới dạng bộ chọn cascade:

1. Khi mở dropdown, dữ liệu cấp tỉnh được load.
2. Khi mở rộng một tỉnh, các thành phố con được load theo nhu cầu.
3. Tiếp tục mở rộng thành phố, các quận/huyện được load theo nhu cầu.
4. Sau khi lưu, trong các tình huống hiển thị như chi tiết, bảng, sẽ hiển thị theo cấp độ là `Tỉnh/Thành phố/Quận`.

Field hỗ trợ các cấu hình form thông dụng như tiêu đề field, mô tả, bắt buộc, giá trị mặc định, chế độ đọc, v.v. Ở chế độ đọc, field sẽ hiển thị dưới dạng đường dẫn văn bản, ví dụ:

```text
Bắc Kinh / Quận đô thị / Đông Thành
```

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

## Lưu ý

- Field China Region hiện chỉ hỗ trợ chọn đường dẫn đơn, không hỗ trợ chọn nhiều.
- Hiện tại dữ liệu được tích hợp và kích hoạt là 3 cấp tỉnh, thành phố, quận, các tùy chọn cấp phường và thôn tạm thời chưa thể chọn.
- Khi import cần điền tên giống với dữ liệu khu vực hành chính được tích hợp, và phân tách bằng `/` theo cấp độ.
- Field này phụ thuộc vào Collection `chinaRegions` do plugin cung cấp, vui lòng đảm bảo plugin field "China Region" đã được kích hoạt.
