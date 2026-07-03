---
title: "CollectionFilter"
description: "CollectionFilter: Lọc Collection bằng nhiều điều kiện."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` dùng để lọc Collection bằng nhiều điều kiện.

## Cách dùng cơ bản

```tsx
import { CollectionFilter } from '@nocobase/client-v2';

<CollectionFilter
  collection={collection}
  t={t}
  onChange={(filter) => {
    listRequest.run({ filter });
  }}
/>;
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | Giá trị filter ban đầu |
| `onChange` | `(filter) => void` | Callback khi thay đổi |
| `t` | `(key, options?) => string` | Hàm dịch |
| `filterableFieldNames` | `string[]` | Danh sách field được phép |
| `nonfilterableFieldNames` | `string[]` | Danh sách field bị chặn |
| `noIgnore` | `boolean` | Bỏ qua giới hạn danh sách cho phép |
| `buttonText` | `React.ReactNode` | Văn bản nút tùy chỉnh |
| `showCount` | `boolean` | Có hiển thị số điều kiện hay không |
| `popoverProps` | `PopoverProps` | Props truyền cho Antd Popover |
| `buttonProps` | `ButtonProps` | Props truyền cho Antd Button |
| `popoverMinWidth` | `number` | Độ rộng tối thiểu của nội dung Popover |

## Liên kết liên quan

- [CollectionFilterPanel](./collection-filter-panel)
