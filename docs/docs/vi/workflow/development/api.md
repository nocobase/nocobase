:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tham chiếu API

## Phía máy chủ

Các API có sẵn trong cấu trúc gói phía máy chủ được hiển thị trong đoạn mã sau:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Lớp plugin **luồng công việc**.

Thông thường, trong quá trình chạy ứng dụng, bạn có thể gọi `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` ở bất kỳ đâu có thể truy cập thể hiện ứng dụng `app` để lấy thể hiện của **plugin luồng công việc** (sau đây được gọi là `plugin`).

#### `registerTrigger()`

Mở rộng và đăng ký một loại trình kích hoạt mới.

**Chữ ký**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Tham số**

| Tham số   | Kiểu                        | Mô tả                         |
| --------- | --------------------------- | ----------------------------- |
| `type`    | `string`                    | Mã định danh loại trình kích hoạt |
| `trigger` | `typeof Trigger \| Trigger` | Kiểu hoặc thể hiện của trình kích hoạt |

**Ví dụ**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // kích hoạt luồng công việc
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // lắng nghe một số sự kiện để kích hoạt luồng công việc
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // gỡ bỏ bộ lắng nghe
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // lấy thể hiện của plugin luồng công việc
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // đăng ký trình kích hoạt
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Mở rộng và đăng ký một loại nút mới.

**Chữ ký**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Tham số**

| Tham số       | Kiểu                                | Mô tả                     |
| ------------- | ----------------------------------- | ------------------------- |
| `type`        | `string`                            | Mã định danh loại lệnh    |
| `instruction` | `typeof Instruction \| Instruction` | Kiểu hoặc thể hiện của lệnh |

**Ví dụ**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // lấy thể hiện của plugin luồng công việc
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // đăng ký lệnh
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Kích hoạt một **luồng công việc** cụ thể. Chủ yếu được sử dụng trong các trình kích hoạt tùy chỉnh để kích hoạt **luồng công việc** tương ứng khi một sự kiện tùy chỉnh cụ thể được lắng nghe.

**Chữ ký**

`trigger(workflow: Workflow, context: any)`

**Tham số**
| Tham số    | Kiểu          | Mô tả                             |
| ---------- | ------------- | --------------------------------- |
| `workflow` | `WorkflowModel` | Đối tượng **luồng công việc** cần kích hoạt |
| `context`  | `object`      | Dữ liệu ngữ cảnh được cung cấp tại thời điểm kích hoạt |

:::info{title=Mẹo}
`context` hiện là một mục bắt buộc. Nếu không được cung cấp, **luồng công việc** sẽ không được kích hoạt.
:::

**Ví dụ**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // đăng ký sự kiện
    this.timer = setInterval(() => {
      // kích hoạt luồng công việc
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Tiếp tục thực thi một **luồng công việc** đang chờ với một tác vụ nút cụ thể.

- Chỉ những **luồng công việc** ở trạng thái chờ (`EXECUTION_STATUS.STARTED`) mới có thể được tiếp tục thực thi.
- Chỉ những tác vụ nút ở trạng thái chờ (`JOB_STATUS.PENDING`) mới có thể được tiếp tục thực thi.

**Chữ ký**

`resume(job: JobModel)`

**Tham số**

| Tham số | Kiểu       | Mô tả                     |
| ------- | ---------- | ------------------------- |
| `job`   | `JobModel` | Đối tượng tác vụ đã cập nhật |

:::info{title=Mẹo}
Đối tượng tác vụ được truyền vào thường là đối tượng đã cập nhật, và `status` của nó thường được cập nhật thành một giá trị khác `JOB_STATUS.PENDING`, nếu không nó sẽ tiếp tục chờ.
:::

**Ví dụ**

Xem chi tiết tại [mã nguồn](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Lớp cơ sở cho các trình kích hoạt, được sử dụng để mở rộng các loại trình kích hoạt tùy chỉnh.

| Tham số       | Kiểu                                                        | Mô tả                                  |
| ------------- | ----------------------------------------------------------- | -------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Hàm tạo                                |
| `on?`         | `(workflow: WorkflowModel): void`                           | Bộ xử lý sự kiện sau khi bật **luồng công việc** |
| `off?`        | `(workflow: WorkflowModel): void`                           | Bộ xử lý sự kiện sau khi tắt **luồng công việc** |

`on`/`off` được sử dụng để đăng ký/hủy đăng ký bộ lắng nghe sự kiện khi một **luồng công việc** được bật/tắt. Tham số được truyền vào là thể hiện **luồng công việc** tương ứng với trình kích hoạt, có thể được xử lý theo cấu hình tương ứng. Một số loại trình kích hoạt đã lắng nghe sự kiện toàn cục có thể không cần triển khai hai phương thức này. Ví dụ, trong một trình kích hoạt theo lịch, bạn có thể đăng ký bộ hẹn giờ trong `on` và hủy đăng ký nó trong `off`.

### `Instruction`

Lớp cơ sở cho các loại lệnh, được sử dụng để mở rộng các loại lệnh tùy chỉnh.

| Tham số       | Kiểu                                                            | Mô tả                                      |
| ------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Hàm tạo                                    |
| `run`         | `Runner`                                                        | Logic thực thi khi lần đầu tiên vào nút     |
| `resume?`     | `Runner`                                                        | Logic thực thi khi vào nút sau khi tiếp tục từ một gián đoạn |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Cung cấp nội dung biến cục bộ cho nhánh được tạo bởi nút tương ứng |

**Các kiểu liên quan**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

`getScope` có thể tham khảo [triển khai của nút lặp](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), được sử dụng để cung cấp nội dung biến cục bộ cho các nhánh.

### `EXECUTION_STATUS`

Bảng hằng số trạng thái kế hoạch thực thi **luồng công việc**, được sử dụng để xác định trạng thái hiện tại của kế hoạch thực thi tương ứng.

| Tên hằng số                     | Ý nghĩa                    |
| ------------------------------- | -------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | Đang xếp hàng              |
| `EXECUTION_STATUS.STARTED`      | Đang thực thi              |
| `EXECUTION_STATUS.RESOLVED`     | Hoàn thành thành công      |
| `EXECUTION_STATUS.FAILED`       | Thất bại                   |
| `EXECUTION_STATUS.ERROR`        | Lỗi thực thi               |
| `EXECUTION_STATUS.ABORTED`      | Đã hủy bỏ                  |
| `EXECUTION_STATUS.CANCELED`     | Đã hủy                     |
| `EXECUTION_STATUS.REJECTED`     | Đã từ chối                 |
| `EXECUTION_STATUS.RETRY_NEEDED` | Chưa thực thi thành công, cần thử lại |

Ngoại trừ ba trạng thái đầu tiên, tất cả các trạng thái khác đều đại diện cho trạng thái thất bại, nhưng có thể được sử dụng để mô tả các nguyên nhân thất bại khác nhau.

### `JOB_STATUS`

Bảng hằng số trạng thái tác vụ nút **luồng công việc**, được sử dụng để xác định trạng thái hiện tại của tác vụ nút tương ứng. Trạng thái do nút tạo ra cũng sẽ ảnh hưởng đến trạng thái của toàn bộ kế hoạch thực thi.

| Tên hằng số                 | Ý nghĩa                                         |
| ------------------------- | ----------------------------------------------- |
| `JOB_STATUS.PENDING`      | Đang chờ: Đã thực thi đến nút này, nhưng lệnh yêu cầu tạm dừng và chờ |
| `JOB_STATUS.RESOLVED`     | Hoàn thành thành công                           |
| `JOB_STATUS.FAILED`       | Thất bại: Việc thực thi nút này không đáp ứng được các điều kiện cấu hình |
| `JOB_STATUS.ERROR`        | Lỗi: Đã xảy ra lỗi chưa được xử lý trong quá trình thực thi nút này |
| `JOB_STATUS.ABORTED`      | Đã hủy bỏ: Việc thực thi nút này đã bị chấm dứt bởi logic khác sau khi ở trạng thái chờ |
| `JOB_STATUS.CANCELED`     | Đã hủy: Việc thực thi nút này đã bị hủy thủ công sau khi ở trạng thái chờ |
| `JOB_STATUS.REJECTED`     | Đã từ chối: Việc tiếp tục thực thi nút này đã bị từ chối thủ công sau khi ở trạng thái chờ |
| `JOB_STATUS.RETRY_NEEDED` | Chưa thực thi thành công, cần thử lại           |

## Phía máy khách

Các API có sẵn trong cấu trúc gói phía máy khách được hiển thị trong đoạn mã sau:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Đăng ký bảng cấu hình tương ứng cho loại trình kích hoạt.

**Chữ ký**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Tham số**

| Tham số   | Kiểu                        | Mô tả                                      |
| --------- | --------------------------- | ------------------------------------------ |
| `type`    | `string`                    | Mã định danh loại trình kích hoạt, nhất quán với mã định danh được sử dụng để đăng ký |
| `trigger` | `typeof Trigger \| Trigger` | Kiểu hoặc thể hiện của trình kích hoạt     |

#### `registerInstruction()`

Đăng ký bảng cấu hình tương ứng cho loại nút.

**Chữ ký**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Tham số**

| Tham số       | Kiểu                                | Mô tả                                  |
| ------------- | ----------------------------------- | -------------------------------------- |
| `type`        | `string`                            | Mã định danh loại nút, nhất quán với mã định danh được sử dụng để đăng ký |
| `instruction` | `typeof Instruction \| Instruction` | Kiểu hoặc thể hiện của nút             |

#### `registerInstructionGroup()`

Đăng ký nhóm loại nút. NocoBase cung cấp 4 nhóm loại nút mặc định:

* `'control'`: Điều khiển
* `'collection'`: Thao tác **bộ sưu tập**
* `'manual'`: Xử lý thủ công
* `'extended'`: Các tiện ích mở rộng khác

Nếu bạn cần mở rộng các nhóm khác, bạn có thể sử dụng phương thức này để đăng ký.

**Chữ ký**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Tham số**

| Tham số | Kiểu               | Mô tả                             |
| ------- | ----------------- | --------------------------------- |
| `type`  | `string`          | Mã định danh nhóm nút, nhất quán với mã định danh được sử dụng để đăng ký |
| `group` | `{ label: string }` | Thông tin nhóm, hiện chỉ bao gồm tiêu đề |

**Ví dụ**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Lớp cơ sở cho các trình kích hoạt, được sử dụng để mở rộng các loại trình kích hoạt tùy chỉnh.

| Tham số         | Kiểu                                                             | Mô tả                                      |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| `title`         | `string`                                                         | Tên loại trình kích hoạt                   |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | Tập hợp các mục cấu hình trình kích hoạt   |
| `scope?`        | `{ [key: string]: any }`                                         | Tập hợp các đối tượng có thể được sử dụng trong Schema của mục cấu hình |
| `components?`   | `{ [key: string]: React.FC }`                                    | Tập hợp các thành phần có thể được sử dụng trong Schema của mục cấu hình |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Bộ truy cập giá trị cho dữ liệu ngữ cảnh trình kích hoạt |

- Nếu `useVariables` không được thiết lập, điều đó có nghĩa là loại trình kích hoạt này không cung cấp chức năng truy xuất giá trị, và dữ liệu ngữ cảnh của trình kích hoạt không thể được chọn trong các nút của **luồng công việc**.

### `Instruction`

Lớp cơ sở cho các lệnh, được sử dụng để mở rộng các loại nút tùy chỉnh.

| Tham số            | Kiểu                                                    | Mô tả                                                                          |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`              | `string`                                                | Mã định danh nhóm loại nút, hiện có các tùy chọn: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | Tập hợp các mục cấu hình nút                                                  |
| `scope?`             | `Record<string, Function>`                              | Tập hợp các đối tượng có thể được sử dụng trong Schema của mục cấu hình       |
| `components?`        | `Record<string, React.FC>`                              | Tập hợp các thành phần có thể được sử dụng trong Schema của mục cấu hình       |
| `Component?`         | `React.FC`                                              | Thành phần hiển thị tùy chỉnh cho nút                                          |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | Phương thức để nút cung cấp các tùy chọn biến nút                              |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Phương thức để nút cung cấp các tùy chọn biến cục bộ nhánh                     |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | Phương thức để nút cung cấp các tùy chọn khởi tạo                             |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Phương thức để xác định xem nút có khả dụng hay không                          |

**Các kiểu liên quan**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Nếu `useVariables` không được thiết lập, điều đó có nghĩa là loại nút này không cung cấp chức năng truy xuất giá trị, và dữ liệu kết quả của loại nút này không thể được chọn trong các nút của **luồng công việc**. Nếu giá trị kết quả là đơn lẻ (không thể chọn), bạn có thể trả về nội dung tĩnh thể hiện thông tin tương ứng (tham khảo: [mã nguồn nút tính toán](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Nếu cần có thể chọn (ví dụ: một thuộc tính trong một đối tượng), bạn có thể tùy chỉnh đầu ra của thành phần chọn tương ứng (tham khảo: [mã nguồn nút tạo dữ liệu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` là thành phần hiển thị tùy chỉnh cho nút. Khi hiển thị nút mặc định không đủ, nó có thể được ghi đè hoàn toàn để sử dụng, thực hiện hiển thị chế độ xem nút tùy chỉnh. Ví dụ, nếu bạn cần cung cấp thêm các nút thao tác hoặc tương tác khác cho nút bắt đầu của loại nhánh, bạn sẽ cần sử dụng phương thức này (tham khảo: [mã nguồn nhánh song song](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` được sử dụng để cung cấp phương thức khởi tạo các khối. Ví dụ, trong một nút thủ công, bạn có thể khởi tạo các khối người dùng liên quan dựa trên các nút phía trên. Nếu phương thức này được cung cấp, nó sẽ khả dụng khi khởi tạo các khối trong cấu hình giao diện nút thủ công (tham khảo: [mã nguồn nút tạo dữ liệu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` chủ yếu được sử dụng để xác định xem một nút có thể được sử dụng (thêm) trong môi trường hiện tại hay không. Môi trường hiện tại bao gồm **luồng công việc** hiện tại, các nút phía trên và chỉ mục nhánh hiện tại, v.v.