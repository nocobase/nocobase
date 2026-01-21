---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Tài liệu API

## Giới thiệu

Plugin này tạo tài liệu API HTTP của NocoBase dựa trên Swagger.

## Cài đặt

Đây là một plugin tích hợp sẵn, không cần cài đặt. Bạn chỉ cần kích hoạt để sử dụng.

## Hướng dẫn sử dụng

### Truy cập trang tài liệu API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Tổng quan tài liệu

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Tổng tài liệu API: `/api/swagger:get`
- Tài liệu API lõi: `/api/swagger:get?ns=core`
- Tài liệu API của tất cả các plugin: `/api/swagger:get?ns=plugins`
- Tài liệu của từng plugin: `/api/swagger:get?ns=plugins/{name}`
- Tài liệu API cho các **bộ sưu tập** tùy chỉnh: `/api/swagger:get?ns=collections`
- Các tài nguyên `${collection}` và tài nguyên liên quan `${collection}.${association}` được chỉ định: `/api/swagger:get?ns=collections/{name}`

## Hướng dẫn dành cho nhà phát triển

### Cách viết tài liệu Swagger cho plugin

Thêm tệp `swagger/index.ts` vào thư mục `src` của plugin với nội dung như sau:

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

Để biết các quy tắc viết chi tiết, vui lòng tham khảo [Tài liệu chính thức của Swagger](https://swagger.io/docs/specification/about/).