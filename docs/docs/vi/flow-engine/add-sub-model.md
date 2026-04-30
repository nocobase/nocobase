---
title: "AddSubModelButton"
description: "AddSubModelButton: Thêm subModel vào FlowModel đã chỉ định, hỗ trợ menu bất đồng bộ, nhóm, submenu, lọc lớp kế thừa và dạng switch."
keywords: "AddSubModelButton,subModel,Sub-model,FlowModel,FlowEngine,Menu bất đồng bộ,Menu nhóm"
---

# AddSubModelButton

Dùng để thêm subModel (sub-model) vào `FlowModel` đã chỉ định. Hỗ trợ nhiều cách cấu hình như tải bất đồng bộ, nhóm, submenu, quy tắc kế thừa model tùy chỉnh, v.v.

## Props

```ts pure
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `model` | `FlowModel` | **Bắt buộc**. Model đích để thêm subModel. |
| `subModelKey` | `string` | **Bắt buộc**. Tên key của subModel trong `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | Loại cấu trúc dữ liệu của subModel, mặc định là `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Định nghĩa mục menu, hỗ trợ sinh tĩnh hoặc bất đồng bộ. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Chỉ định một lớp cơ sở, liệt kê tất cả model kế thừa lớp này làm mục menu. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Chỉ định nhiều lớp cơ sở, tự động liệt kê model kế thừa theo nhóm. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Callback sau khi subModel khởi tạo. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Callback sau khi subModel được thêm. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Callback sau khi subModel bị xóa. |
| `children` | `React.ReactNode` | Nội dung nút, có thể tùy chỉnh thành chữ hoặc biểu tượng. |
| `keepDropdownOpen` | `boolean` | Có giữ menu thả xuống mở sau khi thêm hay không. Mặc định tự động đóng. |

## Định nghĩa kiểu SubModelItem

```ts pure
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  hide?: boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| Trường | Kiểu | Mô tả |
| --- | --- | --- |
| `key` | `string` | Định danh duy nhất. |
| `label` | `string` | Văn bản hiển thị. |
| `type` | `'group' \| 'divider'` | Nhóm hoặc dấu phân cách. Khi bỏ qua là mục thông thường hoặc submenu. |
| `disabled` | `boolean` | Có vô hiệu hóa mục hiện tại. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Ẩn động (trả về `true` biểu thị ẩn). |
| `icon` | `React.ReactNode` | Nội dung biểu tượng. |
| `children` | `SubModelItemsType` | Mục submenu, dùng để lồng nhóm hoặc submenu. |
| `useModel` | `string` | Chỉ định loại Model được dùng (tên đăng ký). |
| `createModelOptions` | `object` | Tham số khi khởi tạo model. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Dạng switch, đã thêm thì xóa, chưa thêm thì thêm (chỉ cho phép một). |

## Ví dụ

### Dùng `<AddSubModelButton />` để thêm subModels

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- Dùng `<AddSubModelButton />` để thêm subModels, nút phải đặt trong một FlowModel nào đó mới có thể dùng;
- Dùng `model.mapSubModels()` để duyệt subModels, phương thức `mapSubModels` sẽ giải quyết các vấn đề thiếu, sắp xếp, v.v.;
- Dùng `<FlowModelRenderer />` để render subModels.

### Các dạng khác nhau của AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- Có thể dùng component nút `<Button>Add block</Button>`, có thể đặt ở bất cứ đâu;
- Cũng có thể dùng biểu tượng `<PlusOutlined />`;
- Cũng có thể đặt ở vị trí Flow Settings ở góc trên bên phải.

### Hỗ trợ dạng switch

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- Tình huống đơn giản `toggleable: true` là được, mặc định tìm theo tên class, instance của cùng một class chỉ cho phép xuất hiện một lần;
- Quy tắc tìm tùy chỉnh: `toggleable: (model: FlowModel) => boolean`.

### items bất đồng bộ

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

Có thể lấy items động từ context, ví dụ:

- Có thể là remote `ctx.api.request()`;
- Cũng có thể lấy dữ liệu cần thiết từ API mà `ctx.dataSourceManager` cung cấp;
- Cũng có thể là thuộc tính hoặc phương thức context tùy chỉnh;
- Cả `items` và `children` đều hỗ trợ gọi async.

### Ẩn mục menu động (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` hỗ trợ `boolean` hoặc hàm (hỗ trợ async); trả về `true` biểu thị ẩn;
- Sẽ tác động đệ quy lên group và children.

### Sử dụng nhóm, submenu và dấu phân cách

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- `type: divider` là dấu phân cách;
- `type: group` và có `children` là nhóm menu;
- Có `children`, nhưng không có `type` là submenu.

### Tự động sinh items qua cách kế thừa lớp

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- Tất cả FlowModel kế thừa `subModelBaseClass` sẽ được liệt kê;
- Có thể định nghĩa metadata liên quan thông qua `Model.define()`;
- Các mục được đánh dấu `hide: true` sẽ tự động ẩn.

### Triển khai nhóm qua cách kế thừa lớp

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- Tất cả FlowModel kế thừa `subModelBaseClasses` sẽ được liệt kê;
- Tự động nhóm theo `subModelBaseClasses` và loại bỏ trùng lặp.

### Triển khai menu cấp 2 qua kế thừa lớp + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Chỉ định dạng hiển thị cho lớp cơ sở thông qua `Model.define({ menuType: 'submenu' })`;
- Xuất hiện làm mục cấp 1, mở rộng thành menu cấp 2; có thể trộn sắp xếp với các nhóm khác theo `meta.sort`.

### Tùy chỉnh submenu thông qua `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### Tùy chỉnh group children thông qua `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Bật tìm kiếm trong submenu

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- Bất kỳ mục menu nào chứa `children` chỉ cần đặt `searchable: true`, sẽ hiển thị ô tìm kiếm ở cấp đó;
- Hỗ trợ cấu trúc hỗn hợp giữa group và non-group ở cùng cấp, tìm kiếm chỉ tác động lên cấp hiện tại.
