:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng các loại trình kích hoạt

Mỗi luồng công việc cần được cấu hình với một trình kích hoạt cụ thể, đóng vai trò là điểm khởi đầu để thực thi quy trình.

Một loại trình kích hoạt thường đại diện cho một sự kiện môi trường hệ thống cụ thể. Trong vòng đời hoạt động của ứng dụng, bất kỳ phần nào cung cấp các sự kiện có thể đăng ký đều có thể được sử dụng để định nghĩa một loại trình kích hoạt. Ví dụ: nhận yêu cầu, thao tác trên bộ sưu tập, tác vụ theo lịch trình, v.v.

Các loại trình kích hoạt được đăng ký trong bảng trình kích hoạt của plugin dựa trên một định danh chuỗi. Plugin luồng công việc đã tích hợp sẵn một số trình kích hoạt:

- `'collection'` : Kích hoạt bởi các thao tác trên bộ sưu tập;
- `'schedule'` : Kích hoạt bởi các tác vụ theo lịch trình;
- `'action'` : Kích hoạt bởi các sự kiện sau thao tác;

Các loại trình kích hoạt mở rộng cần đảm bảo định danh là duy nhất. Việc triển khai đăng ký/hủy đăng ký trình kích hoạt được thực hiện ở phía máy chủ, và việc triển khai giao diện cấu hình được thực hiện ở phía máy khách.

## Phía máy chủ

Bất kỳ trình kích hoạt nào cũng cần kế thừa từ lớp cơ sở `Trigger` và triển khai các phương thức `on`/`off`, được sử dụng để đăng ký và hủy đăng ký các sự kiện môi trường cụ thể tương ứng. Trong phương thức `on`, quý vị cần gọi `this.workflow.trigger()` bên trong hàm callback sự kiện cụ thể để cuối cùng kích hoạt sự kiện. Ngoài ra, trong phương thức `off`, quý vị cần thực hiện các công việc dọn dẹp liên quan đến việc hủy đăng ký.

`this.workflow` là thể hiện của plugin luồng công việc được truyền vào hàm tạo của lớp cơ sở `Trigger`.

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

Sau đó, trong plugin mở rộng luồng công việc, hãy đăng ký thể hiện trình kích hoạt với engine luồng công việc:

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

Sau khi máy chủ khởi động và tải, trình kích hoạt loại `'interval'` có thể được thêm và thực thi.

## Phía máy khách

Phần phía máy khách chủ yếu cung cấp giao diện cấu hình dựa trên các mục cấu hình mà loại trình kích hoạt yêu cầu. Mỗi loại trình kích hoạt cũng cần đăng ký cấu hình loại tương ứng với plugin luồng công việc.

Ví dụ, đối với trình kích hoạt thực thi theo lịch trình đã đề cập ở trên, hãy định nghĩa mục cấu hình thời gian khoảng cách (`interval`) cần thiết trong biểu mẫu giao diện cấu hình:

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

Sau đó, trong plugin mở rộng, hãy đăng ký loại trình kích hoạt này với thể hiện của plugin luồng công việc:

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

Sau đó, quý vị sẽ thấy loại trình kích hoạt mới trong giao diện cấu hình của luồng công việc.

:::info{title=Lưu ý}
Định danh của loại trình kích hoạt được đăng ký ở phía máy khách phải nhất quán với định danh ở phía máy chủ, nếu không sẽ gây ra lỗi.
:::

Để biết thêm chi tiết về việc định nghĩa các loại trình kích hoạt, vui lòng tham khảo phần [Tham chiếu API luồng công việc](./api#pluginregisterTrigger).