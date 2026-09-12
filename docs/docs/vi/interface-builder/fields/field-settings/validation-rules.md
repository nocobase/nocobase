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

### Quy tắc xác thực phía client trong cài đặt Field

Quy tắc xác thực được cài đặt trong cấu hình Field sẽ kích hoạt xác thực phía frontend, đảm bảo dữ liệu bạn nhập đáp ứng quy định.

Nếu Field Collection tương ứng đã có quy tắc xác thực, các quy tắc đó sẽ hiển thị trong cài đặt xác thực dưới **Quy tắc xác thực Field phía server**. Chúng được kế thừa từ cấu hình Field của Data Source và chỉ đọc tại đây. Nếu cần thay đổi, hãy chỉnh sửa Field Collection trong Data Source → Cấu hình Collection.

Các quy tắc được thêm dưới **Quy tắc xác thực phía client** chỉ áp dụng cho component Field hiện tại. Chúng không thay đổi cấu hình Field Collection. Khi cả hai nhóm quy tắc tồn tại, NocoBase sẽ áp dụng đồng thời quy tắc Field kế thừa và quy tắc xác thực phía client.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Field văn bản** còn hỗ trợ xác thực biểu thức chính quy tùy chỉnh để đáp ứng yêu cầu định dạng cụ thể.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)
