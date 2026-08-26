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

Bất kỳ Trigger nào cần kế thừa từ class cơ sở `Trigger` và triển khai các phương thức `on`/`off`, lần lượt dùng để subscribe và unsubscribe các sự kiện môi trường cụ thể. Trong phương thức `on`, bạn cần gọi `this.workflow.trigger()` trong hàm callback của sự kiện cụ thể để cuối cùng kích hoạt sự kiện. Ngoài ra trong phương thức `off`, bạn cần thực hiện công việc dọn dẹp liên quan đến việc unsubscribe.

Trong đó `this.workflow` là instance plugin Workflow được class cơ sở `Trigger` truyền vào trong constructor.

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

Ví dụ với Trigger thực thi định kỳ ở trên, định nghĩa mục cấu hình thời gian khoảng (`interval`) cần thiết trong form giao diện cấu hình:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

Sau đó trong plugin mở rộng đăng ký loại Trigger này với instance plugin Workflow:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Sau đó trong giao diện cấu hình Workflow đã có thể thấy loại Trigger mới.

:::info{title=Mẹo}
Định danh loại Trigger được đăng ký phía client phải nhất quán với phía server, nếu không sẽ dẫn đến lỗi.
:::

Các nội dung khác về việc định nghĩa loại Trigger, xem chi tiết tại phần [Tham chiếu API Workflow](./api#pluginregisterTrigger).
