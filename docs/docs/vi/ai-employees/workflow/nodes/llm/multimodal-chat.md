---
pkg: "@nocobase/plugin-ai"
title: "Node LLM Workflow - Đối thoại Đa phương tiện"
description: "Node Đối thoại Đa phương tiện LLM trong Workflow: gửi hình ảnh đến mô hình, hỗ trợ định dạng URL hoặc base64, chọn Field tệp đính kèm hoặc bản ghi của bảng tệp."
keywords: "Workflow,Node LLM,Đa phương tiện,Đầu vào hình ảnh,NocoBase"
---

# Đối thoại Đa phương tiện

<PluginInfo name="ai-ee" licenseBundled="true"></PluginInfo>

## Hình ảnh

Với điều kiện mô hình hỗ trợ, Node LLM có thể gửi hình ảnh đến mô hình. Khi sử dụng, bạn cần chọn Field tệp đính kèm thông qua biến, hoặc liên kết với bản ghi của bảng tệp. Khi chọn bản ghi của bảng tệp, bạn có thể chọn đến cấp đối tượng bản ghi hoặc chọn đến Field URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Có hai tùy chọn về định dạng gửi hình ảnh:

- Gửi qua URL - Ngoại trừ hình ảnh được lưu trữ cục bộ, tất cả hình ảnh sẽ được gửi dưới dạng URL. Hình ảnh được lưu trữ cục bộ sẽ được chuyển đổi sang định dạng base64 để gửi.
- Gửi qua base64 - Bất kể là lưu trữ cục bộ hay lưu trữ đám mây, tất cả hình ảnh đều được gửi dưới dạng base64. Phù hợp cho trường hợp URL hình ảnh không thể được dịch vụ LLM trực tuyến truy cập trực tiếp.

![](https://static-docs.nocobase.com/202503041200638.png)
