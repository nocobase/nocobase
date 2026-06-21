---
title: "Quy tắc xác thực"
description: "Cấu hình Field: cài đặt quy tắc xác thực Field, hỗ trợ bắt buộc, định dạng, độ dài, xác thực tùy chỉnh."
keywords: "quy tắc xác thực,validation,xác thực Form,xác thực Field,Interface Builder,NocoBase"
---

# Cài đặt quy tắc xác thực

## Giới thiệu

Quy tắc xác thực được dùng để đảm bảo dữ liệu bạn nhập đáp ứng kỳ vọng.

## Có thể cài đặt quy tắc xác thực Field ở đâu

### Cấu hình quy tắc xác thực trong Field Table dữ liệu

Hầu hết các Field đều hỗ trợ cấu hình quy tắc xác thực. Khi Field được cấu hình quy tắc xác thực, sẽ kích hoạt xác thực phía backend khi gửi dữ liệu. Các loại Field khác nhau hỗ trợ các quy tắc xác thực khác nhau.

- **Field ngày tháng**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Field số**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Field văn bản**

  Field văn bản ngoài việc giới hạn độ dài văn bản, còn hỗ trợ biểu thức chính quy tùy chỉnh để xác thực chi tiết hơn.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Xác thực phía frontend trong cấu hình Field

Quy tắc xác thực được cài đặt trong cấu hình Field sẽ kích hoạt xác thực phía frontend, đảm bảo dữ liệu bạn nhập đáp ứng quy định.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Field văn bản** còn hỗ trợ xác thực biểu thức chính quy tùy chỉnh để đáp ứng yêu cầu định dạng cụ thể.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)
