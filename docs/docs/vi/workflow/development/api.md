---
title: "Tham chiếu API"
description: "Tham chiếu API mở rộng Workflow: Workflow Model, ngữ cảnh thực thi Node, API Trigger, truyền biến."
keywords: "workflow,tham chiếu API,Workflow Model,ngữ cảnh Node,API Trigger,NocoBase"
---

# Tham chiếu API

## Phía Server

Các API có sẵn trong cấu trúc package phía server như đoạn code dưới đây:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Class plugin Workflow.

Thông thường khi ứng dụng đang chạy, ở bất kỳ nơi nào có thể lấy được instance ứng dụng `app` thì đều có thể gọi `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` để lấy instance plugin Workflow (dưới đây gọi là `plugin`).

#### `registerTrigger()`

Mở rộng đăng ký loại Trigger mới.

**Chữ ký**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Tham số**

| Tham số      | Kiểu                        | Mô tả             |
| --------- | --------------------------- | ---------------- |
| `type`    | `string`                    | Định danh loại Trigger |
| `trigger` | `typeof Trigger \| Trigger` | Loại hoặc instance Trigger |

**Ví dụ**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Mở rộng đăng ký loại Node mới.

**Chữ ký**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Tham số**

| Tham số          | Kiểu                                | Mô tả           |
| ------------- | ----------------------------------- | -------------- |
| `type`        | `string`                            | Định danh loại Instruction |
| `instruction` | `typeof Instruction \| Instruction` | Loại hoặc instance Instruction |

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
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Kích hoạt Workflow cụ thể. Chủ yếu dùng trong Trigger tùy chỉnh, để kích hoạt Workflow tương ứng khi nghe được sự kiện tùy chỉnh nào đó.

**Chữ ký**

`trigger(workflow: Workflow, context: any)`

**Tham số**
| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Đối tượng Workflow cần kích hoạt |
| `context` | `object` | Dữ liệu ngữ cảnh được cung cấp khi kích hoạt |

:::info{title=Mẹo}
`context` hiện là bắt buộc, nếu không cung cấp thì Workflow đó sẽ không được kích hoạt.
:::

**Ví dụ**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Khôi phục thực thi Workflow đang chờ với một Task Node cụ thể.

- Chỉ có Workflow đang ở trạng thái chờ (`EXECUTION_STATUS.STARTED`) mới có thể được khôi phục thực thi.
- Chỉ có Task Node đang ở trạng thái chờ (`JOB_STATUS.PENDING`) mới có thể được khôi phục thực thi.

**Chữ ký**

`resume(job: JobModel)`

**Tham số**

| Tham số  | Kiểu       | Mô tả             |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | Đối tượng Task sau khi cập nhật |

:::info{title=Mẹo}
Đối tượng Task được truyền vào thường là đối tượng sau khi cập nhật, và thường sẽ cập nhật `status` thành giá trị khác `JOB_STATUS.PENDING`, nếu không sẽ tiếp tục chờ.
:::

**Ví dụ**

Xem chi tiết tại [mã nguồn](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Class cơ sở của Trigger, dùng để mở rộng loại Trigger tùy chỉnh.

| Tham số          | Kiểu                                                        | Mô tả                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructor               |
| `on?`         | `(workflow: WorkflowModel): void`                           | Xử lý sự kiện sau khi bật Workflow |
| `off?`        | `(workflow: WorkflowModel): void`                           | Xử lý sự kiện sau khi tắt Workflow |

`on`/`off` được dùng để đăng ký/hủy đăng ký lắng nghe sự kiện khi Workflow được bật/tắt, tham số được truyền vào là instance Workflow của Trigger tương ứng, có thể xử lý theo cấu hình tương ứng. Một số loại Trigger nếu đã lắng nghe sự kiện ở phạm vi toàn cục thì cũng có thể không cần triển khai hai phương thức này. Ví dụ trong Trigger định kỳ, có thể đăng ký timer trong `on`, hủy đăng ký timer trong `off`.

### `Instruction`

Class cơ sở của loại Instruction, dùng để mở rộng loại Instruction tùy chỉnh.

| Tham số          | Kiểu                                                            | Mô tả                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructor                           |
| `run`         | `Runner`                                                        | Logic thực thi khi vào Node lần đầu             |
| `resume?`     | `Runner`                                                        | Logic thực thi khi vào Node sau khi khôi phục thực thi từ trạng thái gián đoạn |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Cung cấp nội dung biến cục bộ cho nhánh sinh ra bởi Node tương ứng |

**Kiểu liên quan**

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

`getScope` có thể tham khảo [cách triển khai Node vòng lặp](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), được dùng để cung cấp nội dung biến cục bộ của nhánh.

### `EXECUTION_STATUS`

Bảng hằng số trạng thái kế hoạch thực thi Workflow, dùng để xác định trạng thái hiện tại của kế hoạch thực thi tương ứng.

| Tên hằng số                          | Ý nghĩa                 |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING`     | Đang xếp hàng               |
| `EXECUTION_STATUS.STARTED`      | Đang thực thi               |
| `EXECUTION_STATUS.RESOLVED`     | Hoàn tất thành công             |
| `EXECUTION_STATUS.FAILED`       | Thất bại                 |
| `EXECUTION_STATUS.ERROR`        | Lỗi thực thi             |
| `EXECUTION_STATUS.ABORTED`      | Đã gián đoạn               |
| `EXECUTION_STATUS.CANCELED`     | Đã hủy               |
| `EXECUTION_STATUS.REJECTED`     | Đã từ chối               |
| `EXECUTION_STATUS.RETRY_NEEDED` | Thực thi không thành công, cần thử lại |

Ngoài ba trạng thái đầu, các trạng thái còn lại đều biểu thị trạng thái thất bại nhưng có thể dùng để mô tả các nguyên nhân thất bại khác nhau.

### `JOB_STATUS`

Bảng hằng số trạng thái Task Node của Workflow, dùng để xác định trạng thái hiện tại của Task Node tương ứng, trạng thái sinh ra bởi Node cũng đồng thời ảnh hưởng đến trạng thái của toàn bộ kế hoạch thực thi.

| Tên hằng số                    | Ý nghĩa                                     |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | Chờ: đã thực thi đến Node này nhưng instruction yêu cầu treo và chờ |
| `JOB_STATUS.RESOLVED`     | Hoàn tất thành công                                 |
| `JOB_STATUS.FAILED`       | Thất bại: Node này thực thi không thỏa mãn điều kiện cấu hình         |
| `JOB_STATUS.ERROR`        | Lỗi: trong quá trình thực thi Node này phát sinh lỗi không được bắt   |
| `JOB_STATUS.ABORTED`      | Gián đoạn: Node này sau khi chờ bị logic khác kết thúc thực thi   |
| `JOB_STATUS.CANCELED`     | Hủy: Node này sau khi chờ bị hủy thực thi bởi người dùng       |
| `JOB_STATUS.REJECTED`     | Từ chối: Node này sau khi chờ bị từ chối tiếp tục bởi người dùng       |
| `JOB_STATUS.RETRY_NEEDED` | Thực thi không thành công, cần thử lại                     |

## Phía Client

Các API có sẵn trong cấu trúc package phía client như đoạn code dưới đây:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Đăng ký panel cấu hình tương ứng với loại Trigger.

**Chữ ký**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Tham số**

| Tham số      | Kiểu                        | Mô tả                                 |
| --------- | --------------------------- | ------------------------------------ |
| `type`    | `string`                    | Định danh loại Trigger, giống định danh được dùng khi đăng ký |
| `trigger` | `typeof Trigger \| Trigger` | Loại hoặc instance Trigger                     |

#### `registerInstruction()`

Đăng ký panel cấu hình tương ứng với loại Node.

**Chữ ký**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Tham số**

| Tham số          | Kiểu                                | Mô tả                               |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type`        | `string`                            | Định danh loại Node, giống định danh được dùng khi đăng ký |
| `instruction` | `typeof Instruction \| Instruction` | Loại hoặc instance Node                     |

#### `registerInstructionGroup()`

Đăng ký nhóm loại Node. NocoBase mặc định cung cấp 4 nhóm loại Node:

* `'control'`: nhóm điều khiển
* `'collection'`: nhóm thao tác bảng dữ liệu
* `'manual'`: nhóm xử lý thủ công
* `'extended'`: nhóm mở rộng khác

Nếu cần mở rộng thêm nhóm khác, có thể sử dụng phương thức này để đăng ký.

**Chữ ký**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Tham số**

| Tham số      | Kiểu               | Mô tả                           |
| --------- | ----------------- | ----------------------------- |
| `type`    | `string`          | Định danh nhóm Node, giống định danh được dùng khi đăng ký |
| `group` | `{ label: string }` | Thông tin nhóm, hiện chỉ chứa tiêu đề         |

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

Class cơ sở của Trigger, dùng để mở rộng loại Trigger tùy chỉnh.

| Tham số            | Kiểu                                                             | Mô tả                               |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title`         | `string`                                                         | Tên loại Trigger                     |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | Tập các mục cấu hình của Trigger                   |
| `scope?`        | `{ [key: string]: any }`                                         | Tập các đối tượng có thể được dùng trong Schema mục cấu hình |
| `components?`   | `{ [key: string]: React.FC }`                                    | Tập các Component có thể được dùng trong Schema mục cấu hình |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Hàm lấy giá trị dữ liệu ngữ cảnh kích hoạt           |

- Nếu `useVariables` không được thiết lập, có nghĩa loại Trigger này không cung cấp khả năng lấy giá trị, các Node trong quy trình không thể chọn dữ liệu ngữ cảnh của Trigger.

### `Instruction`

Class cơ sở của Instruction, dùng để mở rộng loại Node tùy chỉnh.

| Tham số                 | Kiểu                                                    | Mô tả                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`              | `string`                                                | Định danh nhóm loại Node, hiện có thể chọn: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | Tập các mục cấu hình Node                                                                 |
| `scope?`             | `Record<string, Function>`                              | Tập các đối tượng có thể được dùng trong Schema mục cấu hình                                             |
| `components?`        | `Record<string, React.FC>`                              | Tập các Component có thể được dùng trong Schema mục cấu hình                                             |
| `Component?`         | `React.FC`                                              | Component render tùy chỉnh của Node                                                             |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | Phương thức cung cấp tùy chọn biến của Node                                                     |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Phương thức cung cấp tùy chọn biến cục bộ của nhánh                                                 |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | Phương thức cung cấp tùy chọn initializer của Node                                                     |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Phương thức kiểm tra Node có khả dụng không                                                         |

**Kiểu liên quan**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Nếu `useVariables` không được thiết lập, có nghĩa loại Node này không cung cấp khả năng lấy giá trị, các Node trong quy trình không thể chọn dữ liệu kết quả của loại Node này. Nếu giá trị kết quả là duy nhất (không thể chọn), chỉ cần trả về một nội dung tĩnh có thể biểu thị thông tin tương ứng (tham khảo: [mã nguồn Node tính toán](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Nếu cần có thể chọn (như một thuộc tính trong Object), có thể tự định nghĩa Component chọn tương ứng để xuất ra (tham khảo: [mã nguồn Node thêm dữ liệu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` là Component render tùy chỉnh của Node, khi việc render Node mặc định không thỏa mãn thì có thể hoàn toàn ghi đè để sử dụng, thực hiện render view tùy chỉnh cho Node. Ví dụ nếu cần cung cấp thêm các nút thao tác hoặc tương tác khác cho Node bắt đầu của loại nhánh, cần sử dụng phương thức này (tham khảo: [mã nguồn nhánh song song](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` được dùng để cung cấp phương thức initializer Block, ví dụ trong Node thủ công có thể khởi tạo Block người dùng liên quan dựa trên Node phía trên. Nếu cung cấp phương thức này, sẽ khả dụng khi initializer Block trong cấu hình giao diện Node thủ công (tham khảo: [mã nguồn Node thêm dữ liệu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` chủ yếu được dùng để kiểm tra Node có thể được sử dụng (thêm vào) trong môi trường hiện tại hay không. Môi trường hiện tại bao gồm Workflow hiện tại, Node phía trên và chỉ số nhánh hiện tại...
