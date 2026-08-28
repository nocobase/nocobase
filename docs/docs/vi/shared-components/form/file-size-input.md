---
title: "FileSizeInput"
description: "FileSizeInput: Nhập kích thước tệp và lưu dưới dạng byte."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` dùng để nhập kích thước tệp và lưu dưới dạng byte.

## Cách dùng cơ bản

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value` | `number` | Giá trị hiện tại |
| `onChange` | `(value: number | null) => void` | Callback khi thay đổi |
| `disabled` | `boolean` | Có bị vô hiệu hóa hay không |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
