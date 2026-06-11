---
title: "Mở rộng loại Node"
description: "Mở rộng loại Node: phát triển Node tùy chỉnh, cấu hình Node, logic thực thi, API và vòng đời."
keywords: "workflow,mở rộng node,node tùy chỉnh,phát triển node,NocoBase"
---

# Mở rộng loại Node

Loại Node về bản chất là instruction thao tác, các instruction khác nhau đại diện cho các thao tác khác nhau được thực thi trong quy trình.

Tương tự như Trigger, việc mở rộng loại Node cũng được chia thành hai phần frontend và backend. Phía server cần triển khai logic cho instruction được đăng ký, phía client cần cung cấp giao diện cấu hình các tham số liên quan của Node mà instruction đó đặt trong.

## Phía Server

### Instruction Node đơn giản nhất

Nội dung cốt lõi của instruction là một hàm, tức là phương thức `run` trong class instruction là bắt buộc phải triển khai, dùng để thực thi logic của instruction. Trong hàm có thể thực hiện bất kỳ thao tác cần thiết nào, ví dụ thao tác cơ sở dữ liệu, thao tác file, gọi API bên thứ ba...

Tất cả instruction đều cần kế thừa từ class cơ sở `Instruction`, instruction đơn giản nhất chỉ cần triển khai một hàm `run`:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

Và đăng ký instruction này vào plugin Workflow:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

Giá trị trạng thái (`status`) trong đối tượng trả về của instruction là nội dung bắt buộc, và phải là giá trị trong hằng số `JOB_STATUS`, giá trị này sẽ quyết định luồng xử lý tiếp theo của Node trong quy trình. Thông thường chỉ cần sử dụng `JOB_STATUS.RESOVLED`, đại diện cho việc Node đã thực thi thành công và sẽ tiếp tục thực thi các Node tiếp theo. Nếu cần lưu giá trị kết quả trước, cũng có thể gọi phương thức `processor.saveJob` và trả về đối tượng được trả về bởi phương thức đó. Bộ thực thi sẽ sinh bản ghi kết quả thực thi dựa trên đối tượng đó.

### Giá trị kết quả của Node

Nếu có kết quả thực thi cụ thể, đặc biệt là chuẩn bị dữ liệu cho các Node tiếp theo sử dụng, có thể trả về thông qua thuộc tính `result` và lưu trong đối tượng Task của Node:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Trong đó `node.config` là mục cấu hình của Node, có thể là bất kỳ giá trị cần thiết nào, sẽ được lưu dưới dạng trường kiểu `JSON` trong bản ghi Node tương ứng trong cơ sở dữ liệu.

### Xử lý lỗi của instruction

Nếu trong quá trình thực thi có thể xảy ra ngoại lệ, có thể bắt trước rồi trả về trạng thái thất bại:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Nếu không bắt các ngoại lệ có thể dự đoán, engine quy trình sẽ tự động bắt và trả về trạng thái lỗi để tránh ngoại lệ chưa bắt làm chương trình bị crash.

### Node bất đồng bộ

Khi Node cần chờ thao tác bên ngoài hoàn tất rồi mới có thể tiếp tục quy trình (như HTTP Request, callback thanh toán bên thứ ba... — các thao tác tốn thời gian hoặc không trả về ngay), trước tiên cần lưu Task ở trạng thái `JOB_STATUS.PENDING` để treo việc thực thi hiện tại, sau khi thao tác hoàn tất thì khôi phục lại bằng `resume`. Tất cả các instruction sử dụng logic treo đều phải đồng thời triển khai phương thức `resume`, nếu không quy trình sẽ không thể khôi phục.

Mô hình triển khai khuyến nghị như sau:

```ts
import { Instruction, JOB_STATUS, FlowNodeModel, IJob } from '@nocobase/plugin-workflow';

export class AsyncInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor) {
    // 1. Lưu Task ở trạng thái treo, ghi nhận id
    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // 2. Chủ động gọi exit() để ngay lập tức flush Task vào cơ sở dữ liệu và commit transaction
    await processor.exit();

    // 3. Phát động thao tác bất đồng bộ (lúc này transaction đã commit, không còn chiếm kết nối DB)
    const jobDone: IJob = { status: JOB_STATUS.PENDING };
    try {
      const result = await someAsyncOperation(node.config);
      jobDone.status = JOB_STATUS.RESOLVED;
      jobDone.result = result;
    } catch (error) {
      jobDone.status = JOB_STATUS.FAILED;
      jobDone.result = { message: error.message };
    } finally {
      // 4. Truy vấn lại Task từ cơ sở dữ liệu, không sử dụng đối tượng cache trong bộ nhớ
      const job = await this.workflow.app.db.getRepository('jobs').findOne({
        filterByTk: id,
      });
      job.set(jobDone);

      // 5. Thông báo engine Workflow khôi phục thực thi, vào luồng resume
      this.workflow.resume(job);
    }
    // 6. Không trả về giá trị nào (void), bộ thực thi sau khi nhận được sẽ trực tiếp thoát
  }

  async resume(node: FlowNodeModel, job, processor) {
    // job đã được thiết lập trạng thái cuối trong run, trả về trực tiếp là được
    return job;
  }
}
```

Có một vài chi tiết quan trọng cần giải thích ở đây:

**Vì sao phải chủ động gọi `processor.exit()` thay vì trả về đối tượng Task ở trạng thái treo?**  
`return { status: PENDING }` sẽ ngay lập tức kết thúc hàm `run`, sau đó không thể thực thi bất kỳ code nào. Chủ động gọi `await processor.exit()` chỉ commit transaction và thoát khỏi context cơ sở dữ liệu, bản thân hàm vẫn tiếp tục thực thi, như vậy mới có thể `await` thao tác tốn thời gian trong cùng một thân hàm và sau khi hoàn tất gọi `resume`. Nếu không gọi `exit()` trước mà trực tiếp `await` thao tác dài rồi mới trả về thì một mặt sẽ giữ transaction cơ sở dữ liệu trong thời gian dài gây tranh chấp lock, mặt khác trước khi thao tác hoàn tất thì transaction vẫn chưa commit, bản ghi Task sẽ không vào DB.

**Vì sao phải truy vấn lại Task thay vì trực tiếp sử dụng đối tượng được trả về bởi `saveJob`?**  
`saveJob` trả về instance Model trong bộ nhớ được gắn với transaction gốc, sau khi `processor.exit()` được gọi thì transaction đó đã commit và đóng. Trực tiếp sửa instance này và gọi `resume` sẽ dẫn đến trạng thái ORM bất thường (tham chiếu transaction không còn hợp lệ, trạng thái không nhất quán...). Truy vấn lại từ DB qua `id` đảm bảo có được instance mới sạch, không liên quan đến bất kỳ transaction nào.

**Vì sao hàm `run` không trả về giá trị nào (`void`)?**  
`processor.exit()` đã được gọi thủ công, sau khi bộ thực thi nhận được `void` sẽ gọi `exit(true)` để ngay lập tức thoát, không xử lý lặp lại. Nếu lúc này trả về `IJob`, bộ thực thi sẽ thử lưu và commit lại lần nữa, gây ra lỗi. Xem chi tiết tại phần giá trị trả về `run`/`resume`.

**Đối với các tình huống cần callback bên ngoài** (như kết quả thanh toán được webhook thông báo), tương tự cũng nên gọi `processor.exit()` trước rồi đăng ký callback, đảm bảo bản ghi Task đã vào DB trước khi hệ thống bên ngoài callback, trong callback truy vấn lại Task theo `id` rồi gọi `this.workflow.resume(job)`.

Ví dụ hoàn chỉnh trong dự án thực tế có thể tham khảo: [RequestInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-request/src/server/RequestInstruction.ts) (Node HTTP Request, sử dụng mô hình này trong Workflow không đồng bộ)

### Trạng thái kết quả của Node

Trạng thái thực thi của Node sẽ ảnh hưởng đến sự thành công hay thất bại của toàn bộ quy trình, thông thường trong trường hợp không có nhánh, việc thất bại của một Node sẽ trực tiếp dẫn đến toàn bộ quy trình thất bại. Trường hợp thông thường nhất là Node thực thi thành công thì tiếp tục Node tiếp theo trong bảng Node, cho đến khi không còn Node tiếp theo thì toàn bộ Workflow thực thi xong với trạng thái thành công.

Nếu trong khi thực thi có Node nào trả về trạng thái thực thi thất bại, engine sẽ có cách xử lý khác nhau tùy theo hai trường hợp sau:

1.  Node trả về trạng thái thất bại đang ở trong luồng chính, tức là không nằm trong bất kỳ luồng nhánh nào được Node phía trên mở ra, thì toàn bộ luồng chính sẽ được phán đoán là thất bại và thoát quy trình.

2.  Node trả về trạng thái thất bại đang trong một luồng nhánh nào đó, lúc này trách nhiệm phán đoán trạng thái bước tiếp theo của quy trình được giao cho Node mở nhánh, do logic bên trong Node đó quyết định trạng thái của luồng tiếp theo, và đệ quy ngược lên đến luồng chính.

Cuối cùng đều rút ra trạng thái bước tiếp theo của toàn bộ quy trình tại Node của luồng chính, nếu Node của luồng chính trả về thất bại thì toàn bộ quy trình kết thúc với trạng thái thất bại.

Nếu bất kỳ Node nào sau khi thực thi trả về trạng thái "Chờ", toàn bộ luồng thực thi sẽ bị tạm thời gián đoạn và treo, chờ một sự kiện được định nghĩa bởi Node tương ứng kích hoạt để khôi phục thực thi quy trình. Ví dụ Node thủ công, sau khi thực thi đến Node đó sẽ tạm dừng tại Node với trạng thái "Chờ", chờ con người can thiệp vào quy trình và quyết định có thông qua hay không. Nếu trạng thái nhập vào của con người là thông qua thì tiếp tục các Node phía sau, ngược lại sẽ xử lý theo logic thất bại như đã nói ở trên.

Các trạng thái trả về khác của instruction có thể tham khảo phần Tham chiếu API Workflow.

### Kiểu giá trị trả về của `run`/`resume` và hành vi của bộ thực thi

Định nghĩa kiểu trả về đầy đủ của các phương thức `run` và `resume` là:

```ts
type InstructionResult = IJob | Promise<IJob> | Promise<void> | Promise<null> | null | void;
```

Bộ thực thi (`Processor`) sau khi gọi instruction sẽ thực thi logic xử lý khác nhau dựa trên kiểu của giá trị trả về, có ba trường hợp.

#### 1. Trả về đối tượng Task `IJob`

Đây là trường hợp thường gặp nhất, trả về một đối tượng chứa trường `status` (bắt buộc) và `result` tùy chọn. Bộ thực thi sẽ lưu nó thành bản ghi Task của Node và quyết định hướng tiếp theo dựa trên giá trị `status`:

- `JOB_STATUS.RESOLVED`: Node thực thi thành công, nếu có Node phía dưới thì tiếp tục chạy, nếu không thì quy trình kết thúc
- `JOB_STATUS.PENDING`: Node vào trạng thái treo, context thực thi hiện tại dừng, chờ sự kiện bên ngoài kích hoạt `resume`
- Các trạng thái thất bại khác (`FAILED`, `ERROR`...): chuyển lên Node nhánh cha hoặc trực tiếp kết thúc toàn bộ quy trình

Đường đi này là đường commit transaction hoàn chỉnh — bộ thực thi sẽ lưu bản ghi Task, ghi vào DB và commit transaction.

Ví dụ tham khảo: [ConditionInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts) (khi không có nhánh thì trực tiếp trả về đối tượng `job`, khi có nhánh xem trường hợp `void` ở dưới)

#### 2. Trả về `null`

Khi trả về `null`, bộ thực thi sẽ gọi `processor.exit()` (không truyền tham số), hiệu quả là: **flush Task đang chờ ghi vào cơ sở dữ liệu và commit transaction, nhưng không cập nhật trạng thái thực thi tổng thể**.

Cách dùng này thường gặp trong phương thức `resume` của Node điều khiển nhánh: một nhánh nào đó đã hoàn thành, cần cập nhật và lưu trạng thái Task của Node cha (ví dụ ghi nhận "nhánh thứ N đã hoàn thành"), nhưng các nhánh khác vẫn đang chạy, việc thực thi tổng thể nên tiếp tục giữ trạng thái `STARTED` chờ các nhánh còn lại — lúc này trả về `null` để thoát context resume hiện tại mà không ảnh hưởng đến trạng thái thực thi tổng thể.

Ví dụ tham khảo: [ParallelInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts)

- Dòng [117](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L117): Node song song đã hoàn tất sớm (resolved/rejected), bỏ qua resume của các nhánh sau, trực tiếp trả về `null`
- Dòng [135](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L135): vẫn còn nhánh chưa hoàn tất (`PENDING`), sau khi lưu tiến độ hiện tại trả về `null`, tiếp tục chờ các nhánh khác

#### 3. Trả về `void` (không trả về, tức `undefined` ngầm định)

Khi trả về `void` (hàm không có câu lệnh return rõ ràng, hoặc khi đường thực thi kết thúc không có giá trị trả về), bộ thực thi sẽ gọi `processor.exit(true)`, hiệu quả là **trả về ngay lập tức, không thực hiện bất kỳ thao tác cơ sở dữ liệu nào**.

Mô hình này dành riêng cho tình huống **instruction đã tự đảm nhiệm việc điều phối thực thi**: bên trong instruction đã thông qua `processor.run()` để khởi động luồng con thủ công, bản thân chuỗi thực thi của luồng con sẽ chịu trách nhiệm ghi DB và commit transaction khi hoàn tất, bộ thực thi không nên xử lý lặp lại nữa.

Ví dụ điển hình:

- [ConditionInstruction.ts#L67](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts#L67): khi có nhánh, sau khi gọi thủ công `processor.run(branchNode, savedJob)` thì hàm kết thúc, ngầm định trả về `void`
- [ParallelInstruction.ts#L108](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L108): duyệt qua tất cả các nhánh và lần lượt gọi `processor.run(branch, job)` rồi hàm kết thúc, ngầm định trả về `void`

:::warn{title=Mẹo}
Trước khi trả về `void`, nếu đã gọi `processor.saveJob()`, các bản ghi Task này sẽ không được bộ thực thi hiện tại ghi vào DB. Chúng được tạm lưu trong danh sách Task của bộ thực thi (trong bộ nhớ), sẽ được flush thống nhất vào cơ sở dữ liệu khi `exit()` được kích hoạt sau đó bởi `processor.run()` được gọi thủ công. Vì vậy khi sử dụng mô hình này, phải đảm bảo tồn tại đường thực thi con kết thúc bình thường để hoàn tất việc lưu trữ các bản ghi này. Việc điều phối luồng nhánh có một độ phức tạp nhất định, cần thiết kế cẩn thận và kiểm thử đầy đủ.
:::

Tóm tắt so sánh ba kiểu giá trị trả về:

| Giá trị trả về | Hành vi của bộ thực thi | Tình huống áp dụng điển hình |
|--------|-----------|------------|
| `IJob` | Lưu Task, dựa vào `status` để tiếp tục/kết thúc/treo quy trình | Node thực thi bình thường, có kết quả và trạng thái |
| `null` | Lưu Task chờ ghi và commit transaction, không cập nhật trạng thái thực thi | Nhánh vẫn đang chờ, tạm thời thoát context thực thi hiện tại |
| `void` | Trả về ngay, không làm bất kỳ thao tác DB nào | Node đã tự điều phối luồng con, để luồng con đảm nhiệm xử lý tiếp theo |

### Tìm hiểu thêm

Định nghĩa các tham số khi định nghĩa loại Node, xem phần Tham chiếu API Workflow.

## Phía Client

Tương tự như Trigger, form cấu hình của instruction (loại Node) cần được triển khai ở frontend.

### Instruction Node đơn giản nhất

Tất cả instruction đều cần kế thừa từ class cơ sở `Instruction`, các thuộc tính và phương thức liên quan dùng cho việc cấu hình và sử dụng Node.

Ví dụ chúng ta cần cung cấp giao diện cấu hình cho Node loại chuỗi số ngẫu nhiên (`randomString`) đã được định nghĩa ở phía server bên trên, trong đó có một mục cấu hình là `digit` đại diện cho số chữ số của số ngẫu nhiên, trong form cấu hình chúng ta sử dụng một ô nhập số để nhận đầu vào của người dùng.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

:::info{title=Mẹo}
Định danh loại Node được đăng ký phía client phải nhất quán với phía server, nếu không sẽ dẫn đến lỗi.
:::

### Cung cấp kết quả của Node làm biến

Có thể chú ý đến phương thức `useVariables` trong ví dụ trên, nếu cần dùng kết quả của Node (phần `result`) làm biến cho các Node sau sử dụng, cần triển khai phương thức này trong class instruction được kế thừa và trả về một đối tượng phù hợp với kiểu `VariableOption`, đối tượng này dùng làm mô tả cấu trúc kết quả chạy của Node, cung cấp ánh xạ tên biến để các Node sau lựa chọn sử dụng.

Trong đó định nghĩa kiểu `VariableOption` như sau:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

Cốt lõi là thuộc tính `value`, đại diện cho giá trị đường dẫn phân đoạn của tên biến, `label` dùng để hiển thị trên giao diện, `children` dùng để biểu thị cấu trúc biến nhiều lớp, sẽ được sử dụng khi kết quả của Node là một đối tượng nhiều tầng sâu.

Cách biểu diễn của một biến có thể sử dụng bên trong hệ thống là một chuỗi template đường dẫn được phân tách bằng `.`, ví dụ `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Trong đó `$jobsMapByNodeKey` đại diện cho tập kết quả của tất cả Node (đã được định nghĩa nội bộ, không cần xử lý), `2dw92cdf` là `key` của Node, `abc` là một thuộc tính tùy chỉnh trong đối tượng kết quả của Node.

Ngoài ra, vì kết quả của Node cũng có thể là một giá trị đơn giản, nên khi cung cấp biến của Node, lớp đầu tiên **bắt buộc** phải là mô tả của bản thân Node:

```ts
{
  value: node.key,
  label: node.title,
}
```

Tức là lớp đầu tiên là `key` và tiêu đề của Node. Ví dụ [tham khảo code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) của Node tính toán, khi sử dụng kết quả của Node tính toán, các tùy chọn trên giao diện như sau:

![Kết quả của Node tính toán](https://static-docs.nocobase.com/20240514230014.png)

Khi kết quả của Node là một đối tượng phức tạp, có thể tiếp tục mô tả các thuộc tính sâu hơn thông qua `children`, ví dụ một instruction tùy chỉnh sẽ trả về dữ liệu JSON như sau:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Có thể trả về thông qua phương thức `useVariables` như sau:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

Như vậy trong các Node sau có thể sử dụng giao diện sau để chọn biến trong đó:

![Biến kết quả sau khi ánh xạ](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Mẹo"}
Khi một cấu trúc nào đó trong kết quả là mảng đối tượng nhiều tầng, cũng có thể sử dụng `children` để mô tả đường dẫn nhưng không thể chứa chỉ số mảng, vì trong cách xử lý biến của Workflow NocoBase, đối với mô tả đường dẫn biến của mảng đối tượng, khi sử dụng sẽ tự động được làm phẳng thành mảng giá trị sâu, không thể truy cập giá trị thứ mấy thông qua chỉ số.
:::

### Node có khả dụng không

Mặc định trong Workflow có thể tùy ý thêm Node. Nhưng trong một số trường hợp, Node không phù hợp với một số loại Workflow hoặc nhánh đặc thù, lúc này có thể cấu hình tính khả dụng của Node thông qua `isAvailable`:

```ts
// Định nghĩa kiểu
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Instance plugin Workflow
  engine: WorkflowPlugin;
  // Instance Workflow
  workflow: object;
  // Node phía trên
  upstream: object;
  // Có phải Node nhánh không (số nhánh)
  branchIndex: number;
};
```

Phương thức `isAvailable` trả về `true` nghĩa là Node khả dụng, `false` nghĩa là không khả dụng. Tham số `ctx` chứa thông tin ngữ cảnh của Node hiện tại, có thể dựa vào những thông tin này để phán đoán Node có khả dụng không.

Trong trường hợp không có yêu cầu đặc biệt, không cần triển khai phương thức `isAvailable`, Node mặc định khả dụng. Trường hợp cần cấu hình thường gặp nhất là Node có thể là một thao tác tốn thời gian cao, không phù hợp thực thi trong luồng đồng bộ, có thể thông qua phương thức `isAvailable` để giới hạn việc sử dụng Node. Ví dụ:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Tìm hiểu thêm

Định nghĩa các tham số khi định nghĩa loại Node, xem phần Tham chiếu API Workflow.
