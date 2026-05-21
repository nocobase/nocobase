---
title: "UI Schema"
description: "Tham chiếu cú pháp UI Schema của NocoBase: giao thức mô tả component dựa trên Formily Schema, mô tả các thuộc tính type, x-component, x-decorator, x-pattern, v.v."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema là giao thức mà NocoBase dùng để mô tả component frontend, dựa trên [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema), theo phong cách JSON Schema. Trong FlowEngine, trường `uiSchema` của `registerFlow` chính là dùng cú pháp này để định nghĩa UI của bảng cấu hình.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // Component bao
  ['x-decorator']?: string;
  // Thuộc tính component bao
  ['x-decorator-props']?: any;
  // Component
  ['x-component']?: string;
  // Thuộc tính component
  ['x-component-props']?: any;
  // Trạng thái hiển thị, mặc định 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // Node con của component
  ['x-content']?: any;
  // Schema node children
  properties?: Record<string, ISchema>;

  // Dưới đây chỉ dùng khi là component Field

  // Liên động Field
  ['x-reactions']?: SchemaReactions;
  // Chế độ tương tác UI của Field, mặc định 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // Validate Field
  ['x-validator']?: Validator;
  // Dữ liệu mặc định
  default?: any;
}
```

## Cách dùng cơ bản

### Component đơn giản nhất

Tất cả các thẻ HTML gốc đều có thể chuyển thành cách viết schema:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Tương đương với JSX:

```tsx
<h1>Hello, world!</h1>
```

### Component con

Component children được viết trong `properties`:

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
    },
  },
}
```

Tương đương với JSX:

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Mô tả thuộc tính

### type

Loại của node:

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

Tên schema. Tên của node con là key của `properties`:

```ts
{
  name: 'root',
  properties: {
    child1: {
      // Ở đây không cần viết name nữa
    },
  },
}
```

### title

Tiêu đề của node, thường được dùng cho label của Field trong form.

### x-component

Tên component. Có thể là thẻ HTML gốc, cũng có thể là component React đã đăng ký:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Thuộc tính component:

```ts
{
  type: 'void',
  'x-component': 'Table',
  'x-component-props': {
    loading: true,
  },
}
```

### x-decorator

Component bao. Sự kết hợp `x-decorator` + `x-component`, có thể đặt hai component vào một schema node — giảm độ phức tạp cấu trúc, tăng tỷ lệ tái sử dụng.

Ví dụ trong tình huống form, `FormItem` chính là decorator:

```ts
{
  type: 'void',
  'x-component': 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
}
```

Tương đương với JSX:

```tsx
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

### x-display

Trạng thái hiển thị của component:

| Giá trị | Mô tả |
|----|------|
| `'visible'` | Hiển thị component (mặc định) |
| `'hidden'` | Ẩn component, nhưng dữ liệu không bị ẩn |
| `'none'` | Ẩn component, dữ liệu cũng bị ẩn |

### x-pattern

Chế độ tương tác của component Field:

| Giá trị | Mô tả |
|----|------|
| `'editable'` | Có thể chỉnh sửa (mặc định) |
| `'disabled'` | Không thể chỉnh sửa |
| `'readPretty'` | Chế độ đọc thân thiện — ví dụ component văn bản một dòng ở chế độ chỉnh sửa là `<input />`, ở chế độ đọc thân thiện là `<div />` |

## Sử dụng trong registerFlow

Trong phát triển Plugin, uiSchema chủ yếu được dùng trong bảng cấu hình của `registerFlow`. Mỗi Field thường được bọc bằng `'x-decorator': 'FormItem'`:

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: 'Chỉnh sửa tiêu đề',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Tiêu đề',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: 'Hiển thị viền',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: 'Màu sắc',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: 'Đỏ', value: 'red' },
            { label: 'Xanh', value: 'blue' },
            { label: 'Lục', value: 'green' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.props.title = params.title;
        ctx.model.props.showBorder = params.showBorder;
        ctx.model.props.color = params.color;
      },
    },
  },
});
```

:::tip Mẹo

v2 tương thích với cú pháp uiSchema, tuy nhiên ngữ cảnh sử dụng có hạn — chủ yếu được dùng trong bảng cấu hình của Flow để mô tả UI form. Phần lớn việc render component runtime khuyến nghị dùng trực tiếp [component Antd](https://5x.ant.design/components/overview).

:::

## Bảng tra cứu component phổ biến

| Component | x-component | type | Mô tả |
|------|-------------|------|------|
| Văn bản một dòng | `Input` | `string` | Nhập văn bản cơ bản |
| Văn bản nhiều dòng | `Input.TextArea` | `string` | Vùng văn bản nhiều dòng |
| Số | `InputNumber` | `number` | Nhập số |
| Switch | `Switch` | `boolean` | Boolean switch |
| Chọn thả xuống | `Select` | `string` | Cần kết hợp `enum` để cung cấp các tùy chọn |
| Chọn đơn | `Radio.Group` | `string` | Cần kết hợp `enum` để cung cấp các tùy chọn |
| Chọn đa | `Checkbox.Group` | `string` | Cần kết hợp `enum` để cung cấp các tùy chọn |
| Ngày | `DatePicker` | `string` | Trình chọn ngày |

## Liên kết liên quan

- [Tổng quan FlowEngine (Phát triển Plugin)](../plugin-development/client/flow-engine/index.md) — Cách dùng thực tế uiSchema trong registerFlow
- [FlowDefinition](./definitions/flow-definition.md) — Mô tả tham số đầy đủ của registerFlow
- [Tài liệu Formily Schema](https://react.formilyjs.org/api/shared/schema) — Giao thức Formily mà uiSchema dựa trên
