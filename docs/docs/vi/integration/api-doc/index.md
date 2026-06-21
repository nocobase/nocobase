---
title: "Plugin tài liệu API"
description: "Tài liệu API NocoBase dựa trên Swagger: địa chỉ truy cập, tài liệu tổng/kernel/plugin/collections, quy tắc viết swagger, đặc tả OpenAPI."
keywords: "Tài liệu API,Swagger,OpenAPI,Tài liệu interface,swagger:get,Phát triển plugin,NocoBase"
---

# Tài liệu API

<PluginInfo name="api-doc"></PluginInfo>

## Giới thiệu

Tạo tài liệu HTTP API của NocoBase dựa trên Swagger.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt. Chỉ cần kích hoạt là có thể sử dụng.

## Hướng dẫn sử dụng

### Truy cập trang tài liệu API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Tổng quan tài liệu

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Tài liệu API tổng: `/api/swagger:get`
- Tài liệu API kernel: `/api/swagger:get?ns=core`
- Tài liệu API của tất cả plugin: `/api/swagger:get?ns=plugins`
- Tài liệu của từng plugin: `/api/swagger:get?ns=plugins/{name}`
- Tài liệu API của các collection do người dùng tự định nghĩa: `/api/swagger:get?ns=collections`
- Tài nguyên `${collection}` chỉ định và `${collection}.${association}` liên quan: `/api/swagger:get?ns=collections/{name}`

## Hướng dẫn phát triển

### Cách viết tài liệu swagger cho plugin

Trong thư mục `src` của plugin, thêm tệp `swagger/index.ts` với nội dung sau:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Để biết chi tiết quy tắc viết, vui lòng tham khảo [Tài liệu chính thức của Swagger](https://swagger.io/docs/specification/about/)
