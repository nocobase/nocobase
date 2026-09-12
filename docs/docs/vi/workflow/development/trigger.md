---
title: "Mở rộng loại Trigger"
description: "Mở rộng loại Trigger: phát triển Trigger tùy chỉnh, giao diện cấu hình, logic kích hoạt, tham chiếu API."
keywords: "workflow,mở rộng trigger,trigger tùy chỉnh,phát triển trigger,NocoBase"
---

# Mở rộng loại Trigger

Mỗi Workflow đều bắt buộc phải cấu hình một Trigger cụ thể làm cổng vào để khởi động việc thực thi quy trình.

Loại Trigger thường đại diện cho một sự kiện môi trường hệ thống cụ thể. Trong vòng đời ứng dụng đang chạy, bất kỳ liên kết sự kiện nào có thể được subscribe đều có thể dùng để định nghĩa loại Trigger. Ví dụ nhận request, thao tác bảng dữ liệu, tác vụ định kỳ...

Loại Trigger được đăng ký trong bảng Trigger của plugin dựa trên định danh chuỗi, plugin Workflow tích hợp sẵn một số loại Trigger sau:

- `'collection'`: kích hoạt thao tác bảng dữ liệu;
- `'schedule'`: kích hoạt tác vụ định kỳ;
- `'action'`: kích hoạt sự kiện sau Action;


Loại Trigger mở rộng cần đảm bảo định danh là duy nhất, đăng ký phía server các implementation subscribe/unsubscribe của Trigger và đăng ký phía client implementation cấu hình giao diện.

## Phía Server

Bất kỳ Trigger nào cần kế thừa từ class cơ sở `Trigger` và triển khai các phương thức `on`/`off`, lần lượt dùng để subscribe và unsubscribe các sự kiện môi trường cụ thể. Trong phương thức `on`, bạn cần gọi `this.workflow.trigger()` trong hàm callback của sự kiện cụ thể để cuối cùng kích hoạt sự kiện. Trong phương thức `off`, bạn cần thực hiện công việc dọn dẹp liên quan đến việc unsubscribe.

`this.workflow` là instance plugin Workflow được class cơ sở `Trigger` truyền vào trong constructor.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

Sau đó trong plugin mở rộng cho Workflow, đăng ký instance Trigger lên engine Workflow:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

Sau khi server khởi động và load xong, Trigger loại `'interval'` đã có thể được thêm vào và thực thi.

## Phía Client

Phần phía client chủ yếu cung cấp giao diện cấu hình dựa trên các mục cấu hình mà loại Trigger cần. Mỗi loại Trigger cũng cần đăng ký cấu hình loại tương ứng với plugin Workflow.

Giao diện cấu hình của Trigger được định nghĩa thông qua Loader (hàm lazy-load), trỏ đến một React component thuần dùng antd `Form.Item` để xây dựng form.

### Trigger đơn giản nhất

Ví dụ với Trigger thực thi định kỳ ở trên, định nghĩa mục cấu hình thời gian khoảng (`interval`) cần thiết trong form giao diện cấu hình:

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // Trigger config form (lazy-loaded component)
  FieldsetLoader = () => import('./IntervalConfig');

  // Config validation
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

Ở đây, `FieldsetLoader` là một hàm trả về `Promise<{ default: ComponentType }>`, triển khai lazy loading thông qua `import()` động. Component mà nó trỏ tới là một React function component tiêu chuẩn:

```tsx
// IntervalConfig.tsx
import { Form, InputNumber } from 'antd';

export default function IntervalConfig() {
  return (
    <Form.Item
      name={['config', 'interval']}
      label="Interval"
      initialValue={60000}
      rules={[{ required: true }]}
    >
      <InputNumber min={1000} />
    </Form.Item>
  );
}
```

Lưu ý rằng `name` của trường form sử dụng định dạng mảng lồng nhau `['config', 'fieldName']`, đây là quy ước chuẩn của antd Form.

### Nhiều giao diện cấu hình

Một Trigger có thể cung cấp nhiều giao diện cấu hình cho các tình huống khác nhau:

- `PresetFieldsetLoader` — Form cài đặt sẵn khi tạo Workflow (thường chỉ chứa các trường bắt buộc)
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — Form cấu hình Trigger đầy đủ (hiển thị trong drawer cấu hình)
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — Form nhập liệu cho việc thực thi thủ công
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Khi một Loader cần trỏ tới một named export (thay vì default export) trong file, sử dụng `.then()` để ánh xạ lại:

```ts
class MyTrigger extends Trigger {
  title = 'My trigger';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }

  createDefaultConfig() {
    return { mode: 1 };
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

// Preset form for creation (named export)
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// Full config form (default export)
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

### Đăng ký Trigger

Đăng ký loại Trigger với instance plugin Workflow trong plugin mở rộng:

```ts
import { Plugin } from '@nocobase/client-v2';
import MyTrigger from './MyTrigger';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Sau đó trong giao diện cấu hình Workflow đã có thể thấy loại Trigger mới.

:::info{title=Gợi ý}
Định danh loại Trigger được đăng ký phía client phải nhất quán với phía server, nếu không sẽ dẫn đến lỗi.
:::

Ví dụ hoàn chỉnh trong dự án thực tế có thể tham khảo: [Mã nguồn CollectionTrigger](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

Các nội dung khác về việc định nghĩa loại Trigger, xem chi tiết tại phần [Tham chiếu API Workflow](./api).

:::info{title=Gợi ý}
Nếu trước đây bạn đang sử dụng code phía client phiên bản cũ (v1) và muốn di chuyển sang phiên bản v2 mới, hãy tham khảo [Hướng dẫn di chuyển v1 sang v2](./migration).
:::
