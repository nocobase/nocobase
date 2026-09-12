---
title: "Resource API"
description: "Tham khảo Resource API của NocoBase FlowEngine: chữ ký phương thức đầy đủ, định dạng tham số, cú pháp filter của MultiRecordResource và SingleRecordResource."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

NocoBase FlowEngine cung cấp hai lớp Resource để xử lý các thao tác dữ liệu phía frontend - `MultiRecordResource` cho danh sách/bảng (nhiều bản ghi) và `SingleRecordResource` cho form/chi tiết (một bản ghi). Chúng đóng gói các lệnh gọi REST API và cung cấp quản lý dữ liệu phản ứng (reactive).

Chuỗi kế thừa: `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Dùng cho các tình huống nhiều bản ghi như danh sách, bảng, kanban. Import từ `@nocobase/flow-engine`.

### Thao tác dữ liệu

| Phương thức | Tham số | Mô tả |
|------|------|------|
| `getData()` | - | Trả về `TDataItem[]`, giá trị ban đầu là `[]` |
| `hasData()` | - | Mảng dữ liệu có khác rỗng hay không |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Tạo bản ghi, mặc định tự động refresh sau khi tạo |
| `get(filterByTk)` | `filterByTk: string \| number` | Lấy một bản ghi theo khóa chính |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Cập nhật bản ghi, tự động refresh sau khi hoàn tất |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Xóa bản ghi, hỗ trợ xóa hàng loạt |
| `destroySelectedRows()` | - | Xóa tất cả các hàng đã chọn |
| `refresh()` | - | Làm mới dữ liệu (gọi action `list`), nhiều lần gọi trong cùng một event loop sẽ được gộp lại |

### Phân trang

| Phương thức | Mô tả |
|------|------|
| `getPage()` | Lấy số trang hiện tại |
| `setPage(page)` | Đặt số trang |
| `getPageSize()` | Lấy số bản ghi mỗi trang (mặc định 20) |
| `setPageSize(pageSize)` | Đặt số bản ghi mỗi trang |
| `getCount()` | Lấy tổng số bản ghi |
| `getTotalPage()` | Lấy tổng số trang |
| `next()` | Sang trang sau và refresh |
| `previous()` | Sang trang trước và refresh |
| `goto(page)` | Nhảy đến trang chỉ định và refresh |

### Hàng đã chọn

| Phương thức | Mô tả |
|------|------|
| `setSelectedRows(rows)` | Đặt các hàng đã chọn |
| `getSelectedRows()` | Lấy các hàng đã chọn |

### Ví dụ: Sử dụng trong CollectionBlockModel

Khi kế thừa `CollectionBlockModel`, bạn cần tạo resource qua `createResource()`, sau đó đọc dữ liệu trong `renderComponent()`:

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Khai báo dùng MultiRecordResource để quản lý dữ liệu
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // Tổng số bản ghi

    return (
      <div>
        <h3>Tổng cộng {count} bản ghi (trang {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

Xem ví dụ đầy đủ tại [FlowEngine → Mở rộng block](../../plugin-development/client/flow-engine/block.md).

### Ví dụ: Gọi CRUD trong nút thao tác

Trong handler của `registerFlow` của `ActionModel`, lấy resource của block hiện tại qua `ctx.blockModel?.resource` và gọi các phương thức CRUD:

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Lấy resource của block hiện tại
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Tạo bản ghi, sau khi tạo resource sẽ tự động refresh
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Xem ví dụ đầy đủ tại [Tạo Plugin quản lý dữ liệu liên kết frontend-backend](../../plugin-development/client/examples/fullstack-plugin.md).

### Ví dụ: Tham khảo nhanh thao tác CRUD

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Tạo ---
  await resource.create({ title: 'New item', completed: false });
  // Không tự động refresh
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Đọc ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // Tổng số bản ghi
  const item = await resource.get(1);   // Lấy một bản ghi theo khóa chính

  // --- Cập nhật ---
  await resource.update(1, { title: 'Updated' });

  // --- Xóa ---
  await resource.destroy(1);            // Xóa một bản ghi
  await resource.destroy([1, 2, 3]);    // Xóa hàng loạt

  // --- Phân trang ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // Hoặc dùng phương thức tắt
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Refresh ---
  await resource.refresh();
}
```

## SingleRecordResource

Dùng cho các tình huống một bản ghi như form, trang chi tiết. Import từ `@nocobase/flow-engine`.

### Thao tác dữ liệu

| Phương thức | Tham số | Mô tả |
|------|------|------|
| `getData()` | - | Trả về `TData` (một đối tượng duy nhất), giá trị ban đầu là `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Lưu thông minh - khi `isNewRecord` là true thì gọi create, ngược lại gọi update |
| `destroy(options?)` | - | Xóa bản ghi hiện tại (dùng filterByTk đã đặt) |
| `refresh()` | - | Làm mới dữ liệu (gọi action `get`), bỏ qua khi `isNewRecord` là true |

### Thuộc tính chính

| Thuộc tính | Mô tả |
|------|------|
| `isNewRecord` | Đánh dấu có phải bản ghi mới hay không. `setFilterByTk()` sẽ tự động đặt thành `false` |

### Ví dụ: Tình huống form chi tiết

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // Đối tượng đơn hoặc null
    if (!data) return <div>Đang tải...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Ví dụ: Tạo mới và chỉnh sửa bản ghi

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Tạo bản ghi mới ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save bên trong gọi action create, tự động refresh sau khi xong

  // --- Chỉnh sửa bản ghi đã có ---
  resource.setFilterByTk(1);  // Tự động đặt isNewRecord = false
  await resource.refresh();   // Tải dữ liệu hiện tại trước
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save bên trong gọi action update

  // --- Xóa bản ghi hiện tại ---
  await resource.destroy();   // Dùng filterByTk đã đặt
}
```

## Phương thức chung

Các phương thức sau khả dụng trên cả `MultiRecordResource` và `SingleRecordResource`:

### Lọc

| Phương thức | Mô tả |
|------|------|
| `setFilter(filter)` | Đặt trực tiếp đối tượng filter |
| `addFilterGroup(key, filter)` | Thêm nhóm filter có tên (khuyến nghị, có thể kết hợp và gỡ bỏ) |
| `removeFilterGroup(key)` | Gỡ bỏ nhóm filter có tên |
| `getFilter()` | Lấy filter đã tổng hợp, nhiều group sẽ tự động kết hợp bằng `$and` |

### Kiểm soát field

| Phương thức | Mô tả |
|------|------|
| `setFields(fields)` | Đặt các field trả về |
| `setAppends(appends)` | Đặt appends cho các field quan hệ |
| `addAppends(appends)` | Thêm appends (loại bỏ trùng) |
| `setSort(sort)` | Đặt sắp xếp, ví dụ `['-createdAt', 'name']` |
| `setFilterByTk(value)` | Đặt lọc theo khóa chính |

### Cấu hình resource

| Phương thức | Mô tả |
|------|------|
| `setResourceName(name)` | Đặt tên tài nguyên, ví dụ `'users'` hoặc tài nguyên quan hệ `'users.tags'` |
| `setSourceId(id)` | Đặt ID bản ghi cha của tài nguyên quan hệ |
| `setDataSourceKey(key)` | Đặt nguồn dữ liệu (thêm header `X-Data-Source`) |

### Metadata và trạng thái

| Phương thức | Mô tả |
|------|------|
| `getMeta(key?)` | Lấy metadata, không truyền key thì trả về toàn bộ đối tượng meta |
| `loading` | Có đang load không (getter) |
| `getError()` | Lấy thông tin lỗi |
| `clearError()` | Xóa lỗi |

### Sự kiện

| Sự kiện | Thời điểm kích hoạt |
|------|----------|
| `'refresh'` | Sau khi `refresh()` lấy dữ liệu thành công |
| `'saved'` | Sau khi thao tác `create` / `update` / `save` thành công |

```ts
resource.on('saved', (data) => {
  console.log('Bản ghi đã được lưu:', data);
});
```

## Cú pháp Filter

NocoBase sử dụng cú pháp filter kiểu JSON, các operator bắt đầu bằng `$`:

```ts
// Bằng
{ status: { $eq: 'active' } }

// Khác
{ status: { $ne: 'deleted' } }

// Lớn hơn
{ age: { $gt: 18 } }

// Chứa (so khớp mờ)
{ name: { $includes: 'test' } }

// Điều kiện kết hợp
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// Điều kiện hoặc
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

Trên Resource, khuyến nghị dùng `addFilterGroup` để quản lý điều kiện lọc:

```ts
// Thêm nhiều nhóm filter
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() tự động tổng hợp thành: { $and: [...] }

// Gỡ bỏ một nhóm filter
resource.removeFilterGroup('status');

// Refresh để áp dụng filter
await resource.refresh();
```

## So sánh MultiRecordResource và SingleRecordResource

| Đặc điểm | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| getData() trả về | `TDataItem[]` (mảng) | `TData` (đối tượng đơn) |
| Action refresh mặc định | `list` | `get` |
| Phân trang | Hỗ trợ | Không hỗ trợ |
| Hàng đã chọn | Hỗ trợ | Không hỗ trợ |
| Tạo | `create(data)` | `save(data)` + `isNewRecord=true` |
| Cập nhật | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Xóa | `destroy(filterByTk)` | `destroy()` |
| Tình huống điển hình | Danh sách, bảng, kanban | Form, trang chi tiết |

## Liên kết liên quan

- [Tạo Plugin quản lý dữ liệu liên kết frontend-backend](../../plugin-development/client/examples/fullstack-plugin.md) — Ví dụ đầy đủ: cách dùng thực tế của `resource.create()` trong nút thao tác tùy chỉnh
- [FlowEngine → Mở rộng block](../../plugin-development/client/flow-engine/block.md) — Cách dùng `createResource()` và `resource.getData()` trong CollectionBlockModel
- [ResourceManager (server)](../../plugin-development/server/resource-manager.md) — Định nghĩa REST API resource phía server, đây là các API mà Resource phía client gọi đến
- [FlowContext API](./flow-context.md) — Mô tả các phương thức như `ctx.makeResource()`, `ctx.initResource()`
