---
title: "Thành phần dùng chung"
description: "Thành phần dùng chung của NocoBase client v2: vùng chứa biểu mẫu, trường biểu mẫu, bộ lọc, bảng và biểu tượng."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Thành phần dùng chung

NocoBase client v2 tích hợp sẵn một nhóm thành phần dùng chung. Khi xây dựng trang plugin, trang thiết lập hoặc biểu mẫu, bạn có thể dùng trực tiếp các thành phần này để tái sử dụng UI và tương tác đã được NocoBase chuẩn bị.

Phần này sắp xếp các thành phần theo tình huống sử dụng. Mỗi trang chỉ giới thiệu một thành phần: dùng khi nào, API thường dùng và có thể xem trước trong tài liệu hay không.

## Tra cứu nhanh

| Tôi muốn... | Xem ở đâu |
| --- | --- |
| Điều khiển trình quét toàn màn hình cấp thấp | [CodeScanner](./form/code-scanner) |
| Đặt biểu mẫu chuẩn trong dialog | [DialogFormLayout](./form/dialog-form-layout) |
| Đặt biểu mẫu chuẩn trong drawer | [DrawerFormLayout](./form/drawer-form-layout) |
| Chỉ cho phép biến môi trường `$env` | [EnvVariableInput](./form/env-variable-input) |
| Nhập kích thước tệp và lưu dưới dạng byte | [FileSizeInput](./form/file-size-input) |
| Chỉnh sửa cấu hình JSON / JSON5 | [JsonTextArea](./form/json-text-area) |
| Nhập mật khẩu kèm chỉ báo độ mạnh | [PasswordInput](./form/password-input) |
| Tải tùy chọn Select bất đồng bộ từ API | [RemoteSelect](./form/remote-select) |
| Thêm hỗ trợ quét vào ô nhập | [ScanInput](./form/scan-input) |
| Cho phép trường nhận cả hằng số và biến | [TypedVariableInput](./form/typed-variable-input) |
| Cho phép trường một dòng nhận biến như `{{ $env.X }}` và `{{ $user.name }}` | [VariableInput](./form/variable-input) |
| Chèn biến vào cấu hình JSON / JSON5 | [VariableJsonTextArea](./form/variable-json-text-area) |
| Cho phép văn bản nhiều dòng nhận biến | [VariableTextArea](./form/variable-text-area) |
| Lọc Collection bằng nhiều điều kiện | [CollectionFilter](./filter/) |
| Nhúng panel lọc Collection vào trang | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Tùy chỉnh hàng có thể kéo của antd Table | [SortableRow](./table/sortable-row) |
| Tùy chỉnh cột tay nắm kéo của Table | [SortHandle](./table/sort-handle) |
| Hiển thị danh sách, chọn hàng và sắp xếp kéo thả trong trang thiết lập | [Table](./table/) |
| Dùng biểu tượng Ant Design hoặc đăng ký biểu tượng tùy chỉnh | [Icon](./icon) |
| Tạo registry nội bộ cho mục mở rộng plugin | [createFormRegistry](./create-form-registry) |

## Cách dùng

Nhập các thành phần cần dùng trong plugin phía client, rồi dùng như các thành phần React thông thường:

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## Gợi ý lựa chọn

Mặc định dùng React + Antd là đủ. Với các tình huống phổ biến trong plugin NocoBase, hãy kiểm tra các thành phần này trước:

- Mở biểu mẫu drawer hoặc dialog trong trang thiết lập
- Chèn biến, chỉnh sửa JSON, nhập kích thước tệp hoặc quét mã trong trường biểu mẫu
- Dùng bộ lọc Collection hoặc sắp xếp kéo thả trong trang danh sách
- Dùng điểm vào biểu tượng thống nhất của NocoBase

Với input, nút và thông báo thông thường, thành phần Antd thường rõ ràng hơn.

## Liên kết liên quan

- [Phát triển thành phần](../plugin-development/client/component/index.md)
- [Context - Khả năng thường dùng](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
