---
title: "Hướng dẫn di chuyển v1 sang v2"
description: "Phát triển mở rộng Workflow: hướng dẫn di chuyển code phía client từ v1 sang v2."
keywords: "workflow,di chuyển,v1,v2,NocoBase"
---

# Hướng dẫn di chuyển phía Client từ v1 sang v2

Hướng dẫn này mô tả cách di chuyển code phía client của plugin mở rộng Workflow từ v1 sang v2. Thay đổi cốt lõi trong client v2 là thay thế cấu hình UI khai báo bằng Formily Schema sang phương pháp Loader + component React/antd thuần.

## Tổng quan

### Các thay đổi chính

1. **Thay đổi đường dẫn import**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, class cơ sở plugin `@nocobase/client` → `@nocobase/client-v2`
2. **Thay đổi mô hình cấu hình UI**: Từ đối tượng Formily Schema (`fieldset`) sang component React được lazy-load bởi Loader (`FieldsetLoader`)
3. **Loại bỏ thuộc tính `scope`/`components`**: Không còn cần inject đối tượng scope hoặc component vào Schema, chỉ cần import và sử dụng trực tiếp trong component React

### Ánh xạ đường dẫn import

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## Quy tắc chung

### Mô hình Loader

v2 sử dụng các thuộc tính kiểu `LoaderOf` để thay thế `fieldset` và các đối tượng Formily Schema khác của v1. Loader về bản chất là một hàm trả về `Promise<{ default: ComponentType }>`, cho phép tách code và lazy loading thông qua `import()` động:

```ts
// v1: Đối tượng Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader trỏ tới React component
FieldsetLoader = () => import('./MyConfig');
```

Nếu cần trỏ tới một named export (thay vì default export), sử dụng `.then()` để ánh xạ lại:

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Cú pháp component cấu hình

Component được load bởi Loader là một React function component tiêu chuẩn, sử dụng `Form.Item` của antd để xây dựng form. Đường dẫn trường luôn sử dụng định dạng mảng lồng nhau `['config', 'fieldName']`:

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React component
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## Di chuyển Trigger

### Bảng ánh xạ thuộc tính

| Thuộc tính v1 | Thuộc tính v2 | Mô tả |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Form cấu hình Trigger |
| `presetFieldset` | `PresetFieldsetLoader` | Form cài đặt sẵn khi tạo |
| `triggerFieldset` | `TriggerFieldsetLoader` | Form nhập liệu cho thực thi thủ công |
| `scope` | Đã loại bỏ | Không còn cần thiết, import trực tiếp trong component |
| `components` | Đã loại bỏ | Không còn cần thiết, import trực tiếp trong component |
| `view` | Đã loại bỏ | |
| — | `validate(config)` | Mới; kiểm tra cấu hình |
| — | `createDefaultConfig()` | Mới; cung cấp giá trị cấu hình mặc định |

### Ví dụ di chuyển

**Cú pháp v1:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**Cú pháp v2:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

export default function MyTriggerConfig() {
  return (
    <>
      <Form.Item name={['config', 'collection']} label="Collection">
        <CollectionCascader disabled />
      </Form.Item>
      <Form.Item name={['config', 'mode']} label="Mode">
        <Select
          options={[
            { label: 'Created', value: 1 },
            { label: 'Updated', value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}
```

### Đăng ký plugin

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## Di chuyển Node

### Bảng ánh xạ thuộc tính

| Thuộc tính v1 | Thuộc tính v2 | Mô tả |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Form drawer cấu hình Node |
| `presetFieldset` | `PresetFieldsetLoader` | Form cài đặt sẵn khi tạo |
| `Component` | `ComponentLoader` | Render Node tùy chỉnh trên canvas |
| `scope` | Đã loại bỏ | Không còn cần thiết, import trực tiếp trong component |
| `components` | Đã loại bỏ | Không còn cần thiết, import trực tiếp trong component |
| `view` | Đã loại bỏ | |
| — | `createDefaultConfig()` | Mới; cung cấp giá trị cấu hình mặc định |

### Ví dụ di chuyển

**Cú pháp v1:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**Cú pháp v2:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## Lưu ý khác

### Các phần không thay đổi

Các thuộc tính và phương thức sau về cơ bản có chữ ký giống nhau trong v1 và v2, có thể giữ nguyên khi di chuyển:

- `useVariables(node/config, options)` — Cung cấp tùy chọn biến
- `useScopeVariables(node, options)` — Cung cấp biến phạm vi nhánh
- `isAvailable(ctx)` — Kiểm tra tính khả dụng của Node (`NodeAvailableContext` trong v2 thêm thuộc tính `engine` mới)

### Thuộc tính mới trong v2

- `getCreateModelMenuItem` — Định nghĩa cấu hình mục menu tạo sub-model cho Node/Trigger trên canvas v2
- `useTempAssociationSource` — Cung cấp thông tin nguồn dữ liệu liên kết tạm thời
- `validate(config)` — Kiểm tra cấu hình Trigger (chỉ Trigger)
- `branching` — Khai báo Node có phải Node nhánh không (chỉ Node)
- `end` — Khai báo Node có phải Node kết thúc không (chỉ Node)
- `testable` — Khai báo Node có hỗ trợ chạy thử không (chỉ Node)

### Tính nhất quán ngữ nghĩa giá trị

Khi di chuyển, cần đảm bảo các giá trị form được sinh ra bởi component v2 nhất quán với v1, đặc biệt là hình dạng payload khi thực thi thủ công. Ví dụ nếu form thực thi thủ công của v1 lưu đối tượng bản ghi hoàn chỉnh, phiên bản v2 phải duy trì cùng cấu trúc giá trị thay vì chỉ lưu khóa chính.
