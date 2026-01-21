---
pkg: "@nocobase/plugin-wecom"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Đồng bộ dữ liệu người dùng từ WeChat Work (WeCom)

## Giới thiệu

**Plugin WeChat Work** hỗ trợ đồng bộ dữ liệu người dùng và phòng ban từ WeChat Work.

## Tạo và cấu hình ứng dụng tự xây dựng trên WeChat Work

Đầu tiên, bạn cần tạo một ứng dụng tự xây dựng trong bảng điều khiển quản trị WeChat Work và lấy **ID Doanh nghiệp (Corp ID)**, **AgentId** và **Secret**.

Tham khảo [Xác thực người dùng - WeChat Work](/auth-verification/auth-wecom/).

## Thêm nguồn dữ liệu đồng bộ trong NocoBase

Vào Người dùng & Quyền hạn - Đồng bộ - Thêm, và điền các thông tin đã lấy được.

![](https://static-docs.nocobase.com/202412041251867.png)

## Cấu hình đồng bộ danh bạ

Vào bảng điều khiển quản trị WeChat Work - Bảo mật và Quản lý - Công cụ quản lý, sau đó nhấp vào Đồng bộ danh bạ.

![](https://static-docs.nocobase.com/202412041249958.png)

Cấu hình như hình minh họa và thiết lập IP đáng tin cậy của doanh nghiệp.

![](https://static-docs.nocobase.com/202412041250776.png)

Bây giờ bạn có thể tiến hành đồng bộ dữ liệu người dùng.

## Thiết lập máy chủ nhận sự kiện

Nếu bạn muốn các thay đổi về dữ liệu người dùng và phòng ban trên WeChat Work được đồng bộ kịp thời với ứng dụng NocoBase, bạn có thể thực hiện các cài đặt bổ sung.

Sau khi điền thông tin cấu hình trước đó, bạn có thể sao chép URL thông báo callback danh bạ.

![](https://static-docs.nocobase.com/202412041256547.png)

Điền URL này vào cài đặt WeChat Work, lấy Token và EncodingAESKey, sau đó hoàn tất cấu hình nguồn dữ liệu đồng bộ người dùng NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)