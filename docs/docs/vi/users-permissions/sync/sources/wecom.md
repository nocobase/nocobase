---
pkg: '@nocobase/plugin-user-data-sync'
title: "Đồng bộ dữ liệu người dùng từ WeCom"
description: "Đồng bộ dữ liệu người dùng NocoBase từ WeCom: ứng dụng tự xây dựng WeCom, ID doanh nghiệp, AgentId, Secret, đồng bộ danh bạ, cấu hình IP tin cậy."
keywords: "WeCom,WeCom,đồng bộ người dùng,đồng bộ danh bạ,AgentId,Secret,NocoBase"
---

# Đồng bộ dữ liệu người dùng từ WeCom

<PluginInfo commercial="true" name="wecom"></PluginInfo>

## Giới thiệu

Plugin **WeCom** hỗ trợ đồng bộ dữ liệu người dùng và phòng ban từ WeCom.

## Tạo và cấu hình ứng dụng tự xây dựng WeCom

Trước tiên, bạn cần tạo ứng dụng tự xây dựng WeCom trong trang quản trị WeCom và lấy **ID doanh nghiệp**, **AgentId** và **Secret**.

Tham khảo [Xác thực người dùng - WeCom](/auth-verification/auth-wecom/index.md).

## Thêm nguồn dữ liệu đồng bộ trong NocoBase

Người dùng và quyền - Đồng bộ - Thêm, điền các thông tin đã lấy được.

![](https://static-docs.nocobase.com/202412041251867.png)

## Cấu hình đồng bộ danh bạ

Vào trang quản trị WeCom - Bảo mật và quản lý - Công cụ quản lý, click vào đồng bộ danh bạ.

![](https://static-docs.nocobase.com/202412041249958.png)

Cài đặt theo hình minh họa và thiết lập IP tin cậy của doanh nghiệp.

![](https://static-docs.nocobase.com/202412041250776.png)

Tiếp theo bạn có thể tiến hành đồng bộ dữ liệu người dùng.

## Cài đặt server nhận sự kiện

Nếu bạn muốn các thay đổi dữ liệu người dùng, phòng ban từ phía WeCom có thể được đồng bộ kịp thời sang ứng dụng NocoBase, bạn có thể cài đặt thêm.

Sau khi điền các thông tin cấu hình ở trên, bạn có thể sao chép địa chỉ thông báo callback của danh bạ.

![](https://static-docs.nocobase.com/202412041256547.png)

Điền vào cài đặt WeCom, lấy Token và EncodingAESKey, hoàn tất cấu hình nguồn đồng bộ dữ liệu người dùng NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)
