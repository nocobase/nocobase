:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng các loại nút
Loại của một nút về cơ bản là một chỉ thị thực thi. Các chỉ thị khác nhau đại diện cho các thao tác khác nhau được thực hiện trong luồng công việc.

Tương tự như các trình kích hoạt, việc mở rộng các loại nút cũng được chia thành hai phần: phía máy chủ (server-side) và phía máy khách (client-side). Phía máy chủ cần triển khai logic cho các chỉ thị đã đăng ký, trong khi phía máy khách cần cung cấp cấu hình giao diện cho các tham số của nút chứa chỉ thị đó.

## Phía máy chủ

### Chỉ thị nút đơn giản nhất

Nội dung cốt lõi của một chỉ thị là một hàm, nghĩa là phương thức `run` trong lớp chỉ thị phải được triển khai để thực thi logic của chỉ thị. Bất kỳ thao tác cần thiết nào cũng có thể được thực hiện trong hàm, ví dụ như thao tác cơ sở dữ liệu, thao tác tệp, gọi API bên thứ ba, v.v.

Tất cả các chỉ thị cần phải kế thừa từ lớp cơ sở `Instruction`. Chỉ thị đơn giản nhất chỉ cần triển khai một hàm `run`:

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

Và đăng ký chỉ thị này với **plugin** **luồng công việc**:

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

Giá trị trạng thái (`status`) trong đối tượng trả về của chỉ thị là bắt buộc và phải là một giá trị từ hằng số `JOB_STATUS`. Giá trị này sẽ quyết định luồng xử lý tiếp theo cho nút này trong **luồng công việc**. Thông thường, `JOB_STATUS.RESOVLED` được sử dụng, cho biết nút đã thực thi thành công và việc thực thi sẽ tiếp tục đến các nút tiếp theo. Nếu có giá trị kết quả cần lưu trước, bạn cũng có thể gọi phương thức `processor.saveJob` và trả về đối tượng trả về của phương thức đó. Trình thực thi sẽ tạo một bản ghi kết quả thực thi dựa trên đối tượng này.

### Giá trị kết quả của nút

Nếu có một kết quả thực thi cụ thể, đặc biệt là dữ liệu được chuẩn bị để các nút tiếp theo sử dụng, nó có thể được trả về thông qua thuộc tính `result` và được lưu trong đối tượng tác vụ của nút:

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

Trong đó, `node.config` là mục cấu hình của nút, có thể là bất kỳ giá trị nào cần thiết và sẽ được lưu dưới dạng trường kiểu `JSON` trong bản ghi nút tương ứng trong cơ sở dữ liệu.

### Xử lý lỗi chỉ thị

Nếu quá trình thực thi có thể xảy ra ngoại lệ, bạn có thể bắt chúng trước và trả về trạng thái thất bại:

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

Nếu các ngoại lệ có thể dự đoán được không được bắt, công cụ **luồng công việc** sẽ tự động bắt chúng và trả về trạng thái lỗi để tránh các ngoại lệ không được bắt gây ra sự cố chương trình.

### Các nút bất đồng bộ

Khi cần kiểm soát **luồng công việc** hoặc thực hiện các thao tác I/O bất đồng bộ (tốn thời gian), phương thức `run` có thể trả về một đối tượng có `status` là `JOB_STATUS.PENDING`, nhắc trình thực thi chờ (tạm dừng) cho đến khi một số thao tác bất đồng bộ bên ngoài hoàn tất, sau đó thông báo cho công cụ **luồng công việc** tiếp tục thực thi. Nếu một giá trị trạng thái tạm dừng được trả về trong hàm `run`, thì chỉ thị này phải triển khai phương thức `resume`; nếu không, việc thực thi **luồng công việc** không thể được tiếp tục:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Trong đó, `paymentService` đề cập đến một dịch vụ thanh toán nào đó. Trong hàm callback của dịch vụ, **luồng công việc** được kích hoạt để tiếp tục thực thi tác vụ tương ứng, và **luồng công việc** hiện tại sẽ thoát trước. Sau đó, công cụ **luồng công việc** tạo một trình xử lý mới và chuyển giao cho phương thức `resume` của nút, để tiếp tục thực thi nút đã bị tạm dừng trước đó.

:::info{title=Lưu ý}
"Thao tác bất đồng bộ" được đề cập ở đây không phải là các hàm `async` trong JavaScript, mà là các thao tác không trả về ngay lập tức khi tương tác với các hệ thống bên ngoài khác, ví dụ như dịch vụ thanh toán sẽ cần chờ một thông báo khác để biết kết quả.
:::

### Trạng thái kết quả của nút

Trạng thái thực thi của một nút ảnh hưởng đến sự thành công hay thất bại của toàn bộ **luồng công việc**. Thông thường, trong trường hợp không có nhánh, việc một nút thất bại sẽ trực tiếp dẫn đến toàn bộ **luồng công việc** thất bại. Tình huống phổ biến nhất là nếu một nút thực thi thành công, nó sẽ tiếp tục đến nút tiếp theo trong bảng nút, cho đến khi không còn nút nào tiếp theo, thì toàn bộ **luồng công việc** sẽ hoàn thành với trạng thái thành công.

Nếu trong quá trình thực thi, một nút trả về trạng thái thực thi thất bại, công cụ sẽ xử lý khác nhau tùy thuộc vào hai trường hợp sau:

1.  Nút trả về trạng thái thất bại nằm trong **luồng công việc** chính, tức là không nằm trong bất kỳ **luồng công việc** nhánh nào được mở bởi một nút thượng nguồn. Trong trường hợp này, toàn bộ **luồng công việc** chính sẽ được xác định là thất bại và thoát khỏi **luồng công việc**.

2.  Nút trả về trạng thái thất bại nằm trong một **luồng công việc** nhánh. Lúc này, trách nhiệm xác định trạng thái tiếp theo của **luồng công việc** được chuyển giao cho nút đã mở nhánh đó. Logic nội bộ của nút đó sẽ quyết định trạng thái của **luồng công việc** tiếp theo, và quyết định này sẽ được đệ quy ngược lên **luồng công việc** chính.

Cuối cùng, trạng thái tiếp theo của toàn bộ **luồng công việc** được xác định tại các nút của **luồng công việc** chính. Nếu một nút trong **luồng công việc** chính trả về trạng thái thất bại, thì toàn bộ **luồng công việc** kết thúc với trạng thái thất bại.

Nếu bất kỳ nút nào sau khi thực thi trả về trạng thái "đang chờ", toàn bộ quá trình thực thi sẽ bị tạm thời gián đoạn và tạm dừng, chờ một sự kiện được định nghĩa bởi nút tương ứng kích hoạt để tiếp tục thực thi **luồng công việc**. Ví dụ, nút thủ công (Manual Node), khi thực thi đến nút này sẽ tạm dừng với trạng thái "đang chờ", chờ sự can thiệp thủ công vào **luồng công việc** này để quyết định có thông qua hay không. Nếu trạng thái nhập thủ công là thông qua, thì các nút **luồng công việc** tiếp theo sẽ tiếp tục; ngược lại, nó sẽ được xử lý theo logic thất bại đã mô tả trước đó.

Để biết thêm về các trạng thái trả về của chỉ thị, vui lòng tham khảo phần Tham khảo API **luồng công việc**.

### Thoát sớm

Trong một số **luồng công việc** đặc biệt, có thể cần kết thúc **luồng công việc** trực tiếp trong một nút. Bạn có thể trả về `null` để chỉ ra việc thoát khỏi **luồng công việc** hiện tại và các nút tiếp theo sẽ không được thực thi.

Tình huống này khá phổ biến ở các nút loại kiểm soát **luồng công việc**, ví dụ như trong nút nhánh song song ([tham khảo mã nguồn](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)), **luồng công việc** của nút hiện tại thoát, nhưng các **luồng công việc** mới sẽ được khởi tạo riêng cho từng nhánh con và tiếp tục thực thi.

:::warn{title=Cảnh báo}
Việc lập lịch các **luồng công việc** nhánh với các nút mở rộng có độ phức tạp nhất định, cần được xử lý cẩn thận và kiểm thử kỹ lưỡng.
:::

### Tìm hiểu thêm

Để biết định nghĩa về các tham số khác nhau để định nghĩa các loại nút, vui lòng xem phần Tham khảo API **luồng công việc**.

## Phía máy khách

Tương tự như các trình kích hoạt, biểu mẫu cấu hình cho một chỉ thị (loại nút) cần được triển khai ở phía máy khách.

### Chỉ thị nút đơn giản nhất

Tất cả các chỉ thị cần phải kế thừa từ lớp cơ sở `Instruction`. Các thuộc tính và phương thức liên quan được sử dụng để cấu hình và sử dụng nút.

Ví dụ, chúng ta cần cung cấp giao diện cấu hình cho nút loại chuỗi số ngẫu nhiên (`randomString`) đã định nghĩa ở phía máy chủ ở trên, trong đó có một mục cấu hình là `digit` đại diện cho số chữ số của số ngẫu nhiên. Trong biểu mẫu cấu hình, chúng ta sử dụng một hộp nhập số để nhận đầu vào từ người dùng.

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
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Lưu ý}
Mã định danh loại nút được đăng ký ở phía máy khách phải nhất quán với mã định danh ở phía máy chủ, nếu không sẽ gây ra lỗi.
:::

### Cung cấp kết quả nút dưới dạng biến

Bạn có thể nhận thấy phương thức `useVariables` trong ví dụ trên. Nếu bạn cần sử dụng kết quả của nút (phần `result`) làm biến cho các nút tiếp theo, bạn cần triển khai phương thức này trong lớp chỉ thị kế thừa và trả về một đối tượng tuân thủ kiểu `VariableOption`. Đối tượng này đóng vai trò là mô tả cấu trúc của kết quả thực thi nút, cung cấp ánh xạ tên biến để các nút tiếp theo có thể chọn và sử dụng.

Kiểu `VariableOption` được định nghĩa như sau:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

Cốt lõi là thuộc tính `value`, đại diện cho giá trị đường dẫn phân đoạn của tên biến. `label` được sử dụng để hiển thị trên giao diện, và `children` được sử dụng để biểu thị cấu trúc biến đa cấp, được dùng khi kết quả của nút là một đối tượng lồng sâu.

Một biến có thể sử dụng được biểu diễn nội bộ trong hệ thống dưới dạng một chuỗi mẫu đường dẫn được phân tách bằng `.`, ví dụ: `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Trong đó, `jobsMapByNodeKey` đại diện cho tập hợp kết quả của tất cả các nút (đã được định nghĩa nội bộ, không cần xử lý), `2dw92cdf` là `key` của nút, và `abc` là một thuộc tính tùy chỉnh trong đối tượng kết quả của nút.

Ngoài ra, vì kết quả của nút cũng có thể là một giá trị đơn giản, nên khi cung cấp các biến nút, cấp độ đầu tiên **phải** là mô tả của chính nút đó:

```ts
{
  value: node.key,
  label: node.title,
}
```

Tức là, cấp độ đầu tiên là `key` và tiêu đề của nút. Ví dụ, trong [tham khảo mã nguồn](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) của nút tính toán, khi sử dụng kết quả của nút tính toán, các tùy chọn giao diện như sau:

![Kết quả của nút tính toán](https://static-docs.nocobase.com/20240514230014.png)

Khi kết quả của nút là một đối tượng phức tạp, bạn có thể sử dụng `children` để tiếp tục mô tả các thuộc tính lồng sâu. Ví dụ, một chỉ thị tùy chỉnh có thể trả về dữ liệu JSON như sau:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Khi đó, bạn có thể trả về thông qua phương thức `useVariables` như sau:

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

Bằng cách này, trong các nút tiếp theo, bạn có thể sử dụng giao diện sau để chọn các biến từ đó:

![Các biến kết quả được ánh xạ](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Lưu ý"}
Khi một cấu trúc trong kết quả là một mảng các đối tượng lồng sâu, bạn cũng có thể sử dụng `children` để mô tả đường dẫn, nhưng không thể bao gồm các chỉ mục mảng. Điều này là do trong việc xử lý biến của **luồng công việc** NocoBase, mô tả đường dẫn biến cho một mảng đối tượng sẽ tự động được làm phẳng thành một mảng các giá trị lồng sâu khi sử dụng, và bạn không thể truy cập một giá trị cụ thể bằng chỉ mục của nó.
:::

### Khả dụng của nút

Theo mặc định, bất kỳ nút nào cũng có thể được thêm vào một **luồng công việc**. Tuy nhiên, trong một số trường hợp, một nút có thể không phù hợp trong một số loại **luồng công việc** hoặc nhánh cụ thể. Trong những tình huống như vậy, bạn có thể cấu hình khả dụng của nút bằng cách sử dụng `isAvailable`:

```ts
// Định nghĩa kiểu
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Thể hiện plugin luồng công việc
  engine: WorkflowPlugin;
  // Thể hiện luồng công việc
  workflow: object;
  // Nút thượng nguồn
  upstream: object;
  // Có phải là nút nhánh không (số nhánh)
  branchIndex: number;
};
```

Phương thức `isAvailable` trả về `true` nếu nút khả dụng và `false` nếu không. Tham số `ctx` chứa thông tin ngữ cảnh của nút hiện tại, có thể được sử dụng để xác định khả dụng của nút.

Nếu không có yêu cầu đặc biệt, bạn không cần triển khai phương thức `isAvailable`, vì các nút mặc định là khả dụng. Tình huống phổ biến nhất cần cấu hình là khi một nút có thể là một thao tác tốn nhiều thời gian và không phù hợp để thực thi trong một **luồng công việc** đồng bộ. Bạn có thể sử dụng phương thức `isAvailable` để hạn chế việc sử dụng nút. Ví dụ:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Tìm hiểu thêm

Để biết định nghĩa về các tham số khác nhau để định nghĩa các loại nút, vui lòng xem phần Tham khảo API **luồng công việc**.