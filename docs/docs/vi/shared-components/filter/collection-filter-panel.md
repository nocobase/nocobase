---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Nhúng panel lọc Collection vào trang."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` dùng để nhúng panel lọc Collection vào trang.

## Cách dùng cơ bản

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
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

## Phương thức

| Phương thức | Mô tả |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Liên kết liên quan

- [CollectionFilter](./)
