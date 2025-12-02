---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Thông báo dịch AI
Tài liệu này đã được dịch tự động bằng AI.
:::



```yaml
pkg: "@nocobase/plugin-ai-ee"
```

# Đối thoại Đa phương thức

## Hình ảnh

Với điều kiện mô hình hỗ trợ, nút LLM có thể gửi hình ảnh đến mô hình. Khi sử dụng, bạn cần chọn trường tệp đính kèm hoặc liên kết đến một bản ghi của bộ sưu tập tệp thông qua một biến. Khi chọn bản ghi của bộ sưu tập tệp, bạn có thể chọn ở cấp độ đối tượng hoặc chọn trường URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Có hai tùy chọn cho định dạng gửi hình ảnh:

- **Gửi qua URL** - Tất cả hình ảnh, trừ những hình ảnh được lưu trữ cục bộ, sẽ được gửi dưới dạng URL. Hình ảnh lưu trữ cục bộ sẽ được chuyển đổi sang định dạng base64 trước khi gửi.
- **Gửi qua base64** - Tất cả hình ảnh, dù được lưu trữ cục bộ hay trên đám mây, đều sẽ được gửi dưới định dạng base64. Tùy chọn này phù hợp khi URL hình ảnh không thể được dịch vụ LLM trực tuyến truy cập trực tiếp.

![](https://static-docs.nocobase.com/202503041200638.png)