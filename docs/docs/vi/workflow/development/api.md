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

:::info{title=Gợi ý}
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

:::info{title=Gợi ý}
Đối tượng Task được truyền vào thường là đối tượng sau khi cập nhật, và thường sẽ cập nhật `status` thành giá trị khác `JOB_STATUS.PENDING`, nếu không sẽ tiếp tục chờ.
:::

**Ví dụ**

Xem chi tiết tại [mã nguồn](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Class cơ sở của Trigger, dùng để mở rộng loại Trigger tùy chỉnh.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Tham số          | Kiểu                                                        | Mô tả                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructor               |
| `on?`         | `(workflow: WorkflowModel): void`                           | Xử lý sự kiện sau khi bật Workflow |
| `off?`        | `(workflow: WorkflowModel): void`                           | Xử lý sự kiện sau khi tắt Workflow |

`on`/`off` được dùng để đăng ký/hủy đăng ký lắng nghe sự kiện khi Workflow được bật/tắt, tham số được truyền vào là instance Workflow của Trigger tương ứng, có thể xử lý theo cấu hình tương ứng. Một số loại Trigger nếu đã lắng nghe sự kiện ở phạm vi toàn cục thì cũng có thể không cần triển khai hai phương thức này. Ví dụ trong Trigger định kỳ, có thể đăng ký timer trong `on`, hủy đăng ký timer trong `off`.

### `Instruction`

Class cơ sở của loại Instruction, dùng để mở rộng loại Instruction tùy chỉnh.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| Tham số          | Kiểu                                                            | Mô tả                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructor                           |
| `run`         | `Runner`                                                        | Logic thực thi khi vào Node lần đầu             |
| `resume?`     | `Runner`                                                        | Logic thực thi khi vào Node sau khi khôi phục thực thi từ trạng thái gián đoạn |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`  | Cung cấp nội dung biến cục bộ cho nhánh sinh ra bởi Node tương ứng |

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

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

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

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

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
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Class plugin Workflow phía client. Thường được lấy thông qua `this.app.pm.get('workflow')`.

#### `registerTrigger()`

Đăng ký panel cấu hình tương ứng với loại Trigger.

**Chữ ký**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Tham số**

| Tham số      | Kiểu                        | Mô tả                                 |
| --------- | --------------------------- | ------------------------------------ |
| `type`    | `string`                    | Định danh loại Trigger, nhất quán với định danh đăng ký phía server |
| `trigger` | `typeof Trigger \| Trigger` | Loại hoặc instance Trigger                     |

#### `registerInstruction()`

Đăng ký panel cấu hình tương ứng với loại Node.

**Chữ ký**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Tham số**

| Tham số          | Kiểu                                | Mô tả                               |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type`        | `string`                            | Định danh loại Node, nhất quán với định danh đăng ký phía server |
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
| `type`    | `string`          | Định danh nhóm Node                 |
| `group` | `{ label: string }` | Thông tin nhóm, hiện chỉ chứa tiêu đề         |

**Ví dụ**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Kiểm tra Workflow có đang ở chế độ đồng bộ hay không.

**Chữ ký**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

Class cơ sở của Trigger, dùng để mở rộng loại Trigger tùy chỉnh.

| Tham số            | Kiểu                                                             | Mô tả                               |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title`         | `string`                                                         | Tên loại Trigger                     |
| `description?`  | `string`                                                         | Mô tả loại Trigger                   |
| `PresetFieldsetLoader?` | `LoaderOf`                                                | Form cài đặt sẵn khi tạo (lazy-load) |
| `FieldsetLoader?` | `LoaderOf`                                                     | Form cấu hình Trigger đầy đủ (lazy-load) |
| `TriggerFieldsetLoader?` | `LoaderOf`                                                | Form nhập liệu cho thực thi thủ công (lazy-load) |
| `validate`      | `(config: Record<string, unknown>) => boolean`                   | Kiểm tra cấu hình; trả về `true` nếu cấu hình hợp lệ |
| `createDefaultConfig?` | `() => Record<string, unknown>`                             | Cung cấp giá trị cấu hình mặc định |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | Tùy chọn biến cho dữ liệu ngữ cảnh Trigger |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null`       | Mục menu tạo sub-model trên canvas |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | Cung cấp nguồn dữ liệu liên kết tạm thời |

**Kiểu liên quan**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- Nếu `useVariables` không được thiết lập, có nghĩa loại Trigger này không cung cấp khả năng lấy giá trị, các Node trong quy trình không thể chọn dữ liệu ngữ cảnh của Trigger.

### `Instruction`

Class cơ sở của Instruction, dùng để mở rộng loại Node tùy chỉnh.

| Tham số                 | Kiểu                                                    | Mô tả                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `title`              | `string`                                                | Tên loại Node |
| `type`               | `string`                                                | Định danh loại Node |
| `group`              | `string`                                                | Định danh nhóm loại Node, có thể chọn: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?`       | `string`                                                | Mô tả loại Node |
| `icon?`              | `JSX.Element`                                           | Icon Node |
| `FieldsetLoader?`    | `LoaderOf`                                              | Form drawer cấu hình Node (lazy-load) |
| `PresetFieldsetLoader?` | `LoaderOf`                                           | Form cài đặt sẵn khi tạo (lazy-load) |
| `ComponentLoader?`   | `LoaderOf<{ data: any }>`                               | Render Node tùy chỉnh trên canvas (lazy-load), dùng cho Node nhánh và các trường hợp cần render đặc biệt |
| `branching?`         | `boolean \| object \| ((config) => boolean \| object)`  | Khai báo Node có phải Node nhánh không |
| `end?`               | `boolean \| ((node) => boolean)`                        | Khai báo Node có phải Node kết thúc không |
| `testable?`          | `boolean`                                               | Khai báo Node có hỗ trợ chạy thử không |
| `createDefaultConfig?` | `() => object`                                        | Cung cấp giá trị cấu hình mặc định |
| `useVariables?`      | `(node, options?: UseVariableOptions) => VariableOption` | Phương thức cung cấp tùy chọn biến của Node |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | Phương thức cung cấp tùy chọn biến phạm vi nhánh của Node |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Phương thức kiểm tra Node có khả dụng không |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null`     | Mục menu tạo sub-model trên canvas |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null`        | Cung cấp nguồn dữ liệu liên kết tạm thời |

**Kiểu liên quan**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Nếu `useVariables` không được thiết lập, có nghĩa loại Node này không cung cấp khả năng lấy giá trị, các Node trong quy trình không thể chọn dữ liệu kết quả của loại Node này. Nếu giá trị kết quả là duy nhất (không thể chọn), chỉ cần trả về một nội dung tĩnh có thể biểu thị thông tin tương ứng (tham khảo: [mã nguồn Node tính toán](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). Nếu cần có thể chọn (như một thuộc tính trong Object), có thể tự định nghĩa Component chọn tương ứng để xuất ra (tham khảo: [mã nguồn Node truy vấn dữ liệu](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` là Component render tùy chỉnh của Node. Khi việc render Node mặc định không đủ, có thể hoàn toàn ghi đè để render view tùy chỉnh cho Node. Ví dụ để cung cấp thêm render nhánh cho các Node loại nhánh (tham khảo: [mã nguồn Node điều kiện](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` chủ yếu được dùng để kiểm tra Node có thể được sử dụng (thêm vào) trong môi trường hiện tại hay không. Môi trường hiện tại bao gồm instance plugin Workflow, Workflow hiện tại, Node phía trên và chỉ số nhánh hiện tại.

### Component nhập biến

Workflow cung cấp một bộ component nhập biến để người dùng chọn biến Workflow trong form cấu hình Node/Trigger.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Ô nhập biến hỗ trợ chọn biến và tiếp tục nhập nội dung. Phù hợp cho các tình huống nhập một dòng cần kết hợp tham chiếu biến và văn bản tự do.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value?` | `string` | Giá trị đường dẫn biến, ví dụ `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | Callback khi giá trị thay đổi |
| `variableOptions?` | `UseWorkflowVariableOptions` | Tùy chọn lọc biến (lọc kiểu, độ sâu...) |
| `disabled?` | `boolean` | Có bị vô hiệu hóa không |
| `placeholder?` | `string` | Văn bản placeholder |

#### `WorkflowVariableTextArea`

Vùng nhập văn bản nhiều dòng hỗ trợ chèn tham chiếu biến tại bất kỳ vị trí con trỏ nào. Phù hợp cho các tình huống văn bản tự do như HTTP Body, văn bản template...

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value?` | `string` | Giá trị văn bản (có thể chứa tham chiếu biến) |
| `onChange?` | `(value: string) => void` | Callback khi giá trị thay đổi |
| `variableOptions?` | `UseWorkflowVariableOptions` | Tùy chọn lọc biến |
| `delimiters?` | `readonly [string, string]` | Ký tự phân cách biến, mặc định `['{{', '}}']` |

Kế thừa các Props khác từ antd `TextArea` (như `autoSize`, `placeholder`...).

#### `WorkflowTypedVariableInput`

Ô nhập có kiểu, chuyển đổi giữa chế độ "hằng số" và "tham chiếu biến". Ở chế độ biến, chỉ có thể chọn biến, không thể tiếp tục nhập sau khi chọn. Ở chế độ hằng số, hỗ trợ năm kiểu: `string`, `number`, `boolean`, `date` và `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | Tùy chọn lọc biến |

Kế thừa các Props khác từ `TypedVariableInput` (ngoại trừ `extraNodes`, `metaTree`, `namespaces` được sử dụng nội bộ).

#### `WorkflowVariableWrapper`

Component bọc tổng quát để thay thế các component nhập khác nhau trong các ngữ cảnh khác nhau. Ví dụ khi cùng một trường cần phương thức nhập khác nhau trong cấu hình Node Trigger và drawer cấu hình Node, có thể sử dụng component này để bọc ô nhập native thành ô nhập có thể chuyển đổi chế độ biến.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | Giá trị hiện tại (giá trị hằng số hoặc chuỗi đường dẫn biến) |
| `onChange?` | `(value: TValue \| string \| null) => void` | Callback khi giá trị thay đổi |
| `variableOptions?` | `UseWorkflowVariableOptions` | Tùy chọn lọc biến |
| `render` | `(props: { value?, onChange? }) => ReactNode` | Render component nhập native |
| `clearValue?` | `TValue \| null` | Giá trị khởi tạo khi chuyển từ chế độ biến về chế độ hằng số, mặc định `null` |

### Component liên quan đến bảng dữ liệu

Workflow cũng cung cấp một bộ component trợ giúp liên quan đến bảng dữ liệu:

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — Bộ chọn bảng dữ liệu hỗ trợ nguồn dữ liệu (cascader)
- `AppendsSelect` — Bộ chọn tải trước trường liên kết (tree select)
- `FieldsSelect` — Bộ chọn nhiều trường của bảng dữ liệu
- `SortFieldsInput` — Ô nhập trường sắp xếp
- `PaginationFields` — Các mục form tham số phân trang
